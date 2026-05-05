const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');
const { logAudit, createNotification } = require('../utils/helpers');


const register = async (req, res) => {
    try {
        const { fullName, email, password, userType } = req.body;

        if (!fullName || !email || !password || !userType) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (userType !== 'Student') {
            return res.status(403).json({ message: "Self-registration is only allowed for Students." });
        }

        const pool = await getPool();
        
        // Use a transaction to ensure User and Role tables are inserted together safely
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // Only one instructor allowed
            if (userType === "Instructor") {
                const existingInst = await request
                    .input('type', sql.VarChar, 'Instructor')
                    .query('SELECT * FROM Users WHERE UserType = @type');

                if (existingInst.recordset.length > 0) {
                    await transaction.rollback();
                    return res.status(400).json({ message: "Only one instructor allowed" });
                }
            }

            // Check duplicate email
            const dup = await request
                .input('email', sql.VarChar, email)
                .query('SELECT * FROM Users WHERE Email = @email');
            
            if (dup.recordset.length > 0) {
                await transaction.rollback();
                return res.status(400).json({ message: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into Users
            const userResult = await request
                .input('fullName', sql.VarChar, fullName)
                .input('emailParam', sql.VarChar, email) // Using different parameter name to avoid conflict if reused
                .input('password', sql.VarChar, hashedPassword)
                .input('userTypeParam', sql.VarChar, userType)
                .query(`
                    INSERT INTO Users (FullName, Email, Password, UserType)
                    OUTPUT INSERTED.UserID
                    VALUES (@fullName, @emailParam, @password, @userTypeParam)
                `);

            const userID = userResult.recordset[0].UserID;

            // Insert into role-specific table
            request.input('userID', sql.Int, userID);
            
            if (userType === "Instructor") {
                await request.query('INSERT INTO Instructors (UserID) VALUES (@userID)');
            } else if (userType === "Assistant") {
                await request.query('INSERT INTO Assistants (UserID) VALUES (@userID)');
            } else if (userType === "Student") {
                await request.query('INSERT INTO Students (UserID) VALUES (@userID)');
            }

            // Commit transaction if all succeeded
            await transaction.commit();

            res.json({ message: "User registered successfully", userID });

        } catch (txErr) {
            // Rollback if anything failed inside the transaction
            await transaction.rollback();
            throw txErr;
        }

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: "An internal server error occurred during registration." });
    }
};


// ================= LOGIN =================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Account lockout check
        if (user.LockedUntil && new Date(user.LockedUntil) > new Date()) {
            const minsLeft = Math.ceil((new Date(user.LockedUntil) - new Date()) / 60000);
            await logAudit(user.UserID, 'LOGIN_BLOCKED', `Account locked, ${minsLeft} mins remaining`, req.ip);
            return res.status(423).json({ message: `Account locked. Try again in ${minsLeft} minute(s).` });
        }

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            // Increment failed attempts
            const attempts = (user.FailedLoginAttempts || 0) + 1;
            const MAX_ATTEMPTS = 5;
            const LOCKOUT_MINUTES = 15;

            if (attempts >= MAX_ATTEMPTS) {
                await pool.request()
                    .input('Email', sql.VarChar, email)
                    .input('Attempts', sql.Int, attempts)
                    .query(`UPDATE Users SET FailedLoginAttempts = @Attempts, LockedUntil = DATEADD(MINUTE, ${LOCKOUT_MINUTES}, GETDATE()) WHERE Email = @Email`);
                await logAudit(user.UserID, 'ACCOUNT_LOCKED', `Locked after ${MAX_ATTEMPTS} failed attempts`, req.ip);
                return res.status(423).json({ message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` });
            } else {
                await pool.request()
                    .input('Email', sql.VarChar, email)
                    .input('Attempts', sql.Int, attempts)
                    .query(`UPDATE Users SET FailedLoginAttempts = @Attempts WHERE Email = @Email`);
            }

            await logAudit(user.UserID, 'LOGIN_FAILED', `Attempt ${attempts}/${MAX_ATTEMPTS}`, req.ip);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Reset failed attempts on successful login
        await pool.request()
            .input('Email', sql.VarChar, email)
            .query('UPDATE Users SET FailedLoginAttempts = 0, LockedUntil = NULL WHERE Email = @Email');

        const token = jwt.sign(
            { 
                id: user.UserID, 
                type: user.UserType,
                name: user.FullName,
                email: user.Email,
                profilePicture: user.ProfilePicture
            },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { id: user.UserID },
            process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh'),
            { expiresIn: "7d" }
        );

        await logAudit(user.UserID, 'LOGIN_SUCCESS', `${user.UserType} logged in`, req.ip);

        res.json({
            message: "Login success",
            token,
            refreshToken,
            user: {
                UserID: user.UserID,
                FullName: user.FullName,
                Email: user.Email,
                UserType: user.UserType,
                ProfilePicture: user.ProfilePicture
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "An internal server error occurred during login." });
    }
};

const updateProfilePicture = async (req, res) => {
    try {
        const userID = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const profilePicPath = `/uploads/profiles/${req.file.filename}`;
        const pool = await getPool();

        // Get old picture to delete it
        const userResult = await pool.request()
            .input('id', sql.Int, userID)
            .query('SELECT ProfilePicture FROM Users WHERE UserID = @id');
        
        const oldPic = userResult.recordset[0]?.ProfilePicture;

        await pool.request()
            .input('pic', sql.VarChar, profilePicPath)
            .input('id', sql.Int, userID)
            .query('UPDATE Users SET ProfilePicture = @pic WHERE UserID = @id');

        // Delete old file if it exists and isn't the same as the new one
        if (oldPic && oldPic !== profilePicPath) {
            const { deleteFile } = require('../utils/helpers');
            await deleteFile(oldPic);
        }

        res.json({ 
            message: "Profile picture updated", 
            profilePicture: profilePicPath 
        });

    } catch (err) {
        console.error("Update Profile Picture Error:", err);
        res.status(500).json({ message: "An internal server error occurred while updating profile picture." });
    }
};


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];
        if (!user) {
            return res.json({ message: "If that email is in our system, a reset link has been sent." });
        }

        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await pool.request()
            .input('Token', sql.VarChar, resetToken)
            .input('Expiry', sql.DateTime, expires)
            .input('UserID', sql.Int, user.UserID)
            .query('UPDATE Users SET ResetPasswordToken = @Token, ResetPasswordExpires = @Expiry WHERE UserID = @UserID');

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&id=${user.UserID}`;

        const subject = "Password Reset - Mini LMS";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
                <h2 style="color: #1e293b; margin-bottom: 16px;">Password Reset Request</h2>
                <p style="color: #64748b;">Hello <strong>${user.FullName}</strong>,</p>
                <p style="color: #64748b;">Click the button below to reset your password. This link expires in 15 minutes.</p>
                <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background: #2563eb; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 20px 0;">Reset Password</a>
                <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, ignore this email.</p>
            </div>
        `;

        await sendEmail(email, subject, '', html);
        res.json({ message: "If that email is in our system, a reset link has been sent." });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { id, token, newPassword } = req.body;
        if (!id || !token || !newPassword) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, id)
            .query('SELECT * FROM Users WHERE UserID = @UserID');

        const user = result.recordset[0];
        if (!user || user.ResetPasswordToken !== token || new Date(user.ResetPasswordExpires) < new Date()) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.request()
            .input('Password', sql.VarChar, hashedPassword)
            .input('UserID', sql.Int, id)
            .query('UPDATE Users SET Password = @Password, ResetPasswordToken = NULL, ResetPasswordExpires = NULL WHERE UserID = @UserID');

        res.json({ message: "Password has been successfully reset." });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh'));

        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, decoded.id)
            .query('SELECT * FROM Users WHERE UserID = @UserID');

        const user = result.recordset[0];
        if (!user) return res.status(401).json({ message: "User not found" });

        const newToken = jwt.sign(
            { id: user.UserID, type: user.UserType, name: user.FullName, email: user.Email, profilePicture: user.ProfilePicture },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ token: newToken });
    } catch (err) {
        console.error("Refresh Token Error:", err.message);
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
};

module.exports = { register, login, updateProfilePicture, forgotPassword, resetPassword, refreshAccessToken };