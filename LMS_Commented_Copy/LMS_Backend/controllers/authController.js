/**
 * AUTHENTICATION CONTROLLER
 * Handles user registration, login, profile updates, and password resets.
 */
const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs'); // Used for hashing and comparing passwords
const jwt = require('jsonwebtoken'); // Used for generating and verifying security tokens
const { sendEmail } = require('../utils/emailService'); // Helper to send automated emails
const { logAudit, createNotification } = require('../utils/helpers'); // Helpers for logging actions and notifying users

/**
 * REGISTER NEW USER
 * Only students can self-register. Instructors and Assistants are added by the system administrator.
 */
const register = async (req, res) => {
    try {
        const { fullName, email, password, userType } = req.body;

        // 1. Validate Input: Ensure all required fields are present
        if (!fullName || !email || !password || !userType) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Restriction: Only students can register themselves in this public endpoint
        if (userType !== 'Student') {
            return res.status(403).json({ message: "Self-registration is only allowed for Students." });
        }

        const pool = await getPool();
        
        // 3. Database Transaction: Ensures that if any part of the process fails, no data is saved (all or nothing)
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // 4. Instructor Constraint: Ensure only one instructor exists in the whole system (system rule)
            if (userType === "Instructor") {
                const existingInst = await request
                    .input('type', sql.VarChar, 'Instructor')
                    .query('SELECT * FROM Users WHERE UserType = @type');

                if (existingInst.recordset.length > 0) {
                    await transaction.rollback();
                    return res.status(400).json({ message: "Only one instructor allowed" });
                }
            }

            // 5. Duplicate Check: Prevent multiple accounts with the same email
            const dup = await request
                .input('email', sql.VarChar, email)
                .query('SELECT * FROM Users WHERE Email = @email');
            
            if (dup.recordset.length > 0) {
                await transaction.rollback();
                return res.status(400).json({ message: "Email already exists" });
            }

            // 6. Security: Hash the password so it's not stored in plain text (standard security practice)
            const hashedPassword = await bcrypt.hash(password, 10);

            // 7. Insert User: Save basic info into the main 'Users' table
            const userResult = await request
                .input('fullName', sql.VarChar, fullName)
                .input('emailParam', sql.VarChar, email) 
                .input('password', sql.VarChar, hashedPassword)
                .input('userTypeParam', sql.VarChar, userType)
                .query(`
                    INSERT INTO Users (FullName, Email, Password, UserType)
                    OUTPUT INSERTED.UserID
                    VALUES (@fullName, @emailParam, @password, @userTypeParam)
                `);

            const userID = userResult.recordset[0].UserID;

            // 8. Role-Specific Data: Each role has its own table for additional attributes
            request.input('userID', sql.Int, userID);
            
            if (userType === "Instructor") {
                await request.query('INSERT INTO Instructors (UserID) VALUES (@userID)');
            } else if (userType === "Assistant") {
                await request.query('INSERT INTO Assistants (UserID) VALUES (@userID)');
            } else if (userType === "Student") {
                // For students, we also generate a unique Student Code (e.g., S123456)
                const studentCode = 'S' + Math.floor(100000 + Math.random() * 900000);
                await request.input('sCode', sql.VarChar, studentCode).query('INSERT INTO Students (UserID, StudentCode) VALUES (@userID, @sCode)');
            }

            // 9. Finalize: Save all changes to the database
            await transaction.commit();

            res.json({ message: "User registered successfully", userID });

        } catch (txErr) {
            // Error handling: If anything fails inside the transaction, undo everything to keep DB clean
            await transaction.rollback();
            throw txErr;
        }

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: "An internal server error occurred during registration." });
    }
};

/**
 * LOGIN USER
 * Authenticates users and provides security tokens for future requests.
 * Includes security features like account lockout after failed attempts.
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const pool = await getPool();

        // 1. Fetch User: Find the user by their email
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" }); // User not found
        }

        // 2. Lockout Check: If the account is currently locked, deny access immediately
        if (user.LockedUntil && new Date(user.LockedUntil) > new Date()) {
            const minsLeft = Math.ceil((new Date(user.LockedUntil) - new Date()) / 60000);
            await logAudit(user.UserID, 'LOGIN_BLOCKED', `Account locked, ${minsLeft} mins remaining`, req.ip);
            return res.status(423).json({ message: `Account locked. Try again in ${minsLeft} minute(s).` });
        }

        // 3. Password Verification: Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            // 4. Failed Attempt Logic: Increment counter and lock if too many failures (Brute-force protection)
            const attempts = (user.FailedLoginAttempts || 0) + 1;
            const MAX_ATTEMPTS = 5;
            const LOCKOUT_MINUTES = 15;

            if (attempts >= MAX_ATTEMPTS) {
                // Lock account for 15 minutes
                await pool.request()
                    .input('Email', sql.VarChar, email)
                    .input('Attempts', sql.Int, attempts)
                    .query(`UPDATE Users SET FailedLoginAttempts = @Attempts, LockedUntil = DATEADD(MINUTE, ${LOCKOUT_MINUTES}, GETDATE()) WHERE Email = @Email`);
                
                await logAudit(user.UserID, 'ACCOUNT_LOCKED', `Locked after ${MAX_ATTEMPTS} failed attempts`, req.ip);
                return res.status(423).json({ message: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` });
            } else {
                // Just increment the counter
                await pool.request()
                    .input('Email', sql.VarChar, email)
                    .input('Attempts', sql.Int, attempts)
                    .query(`UPDATE Users SET FailedLoginAttempts = @Attempts WHERE Email = @Email`);
            }

            await logAudit(user.UserID, 'LOGIN_FAILED', `Attempt ${attempts}/${MAX_ATTEMPTS}`, req.ip);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 5. Success Logic: Reset failed attempts on successful login
        await pool.request()
            .input('Email', sql.VarChar, email)
            .query('UPDATE Users SET FailedLoginAttempts = 0, LockedUntil = NULL WHERE Email = @Email');

        // 6. Access Token: Short-lived token for making requests (15 minutes)
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

        // 7. Refresh Token: Long-lived token used to get a new Access Token without logging in again (7 days)
        const refreshToken = jwt.sign(
            { id: user.UserID },
            process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh'),
            { expiresIn: "7d" }
        );

        // 8. Audit Log: Record the successful login for security monitoring
        await logAudit(user.UserID, 'LOGIN_SUCCESS', `${user.UserType} logged in`, req.ip);

        // 9. Response: Send tokens and user data to the frontend
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

/**
 * UPDATE PROFILE PICTURE
 * Saves the new picture path to the database and deletes the old file to save space.
 */
const updateProfilePicture = async (req, res) => {
    try {
        const userID = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // The file path where the picture was saved by the upload middleware
        const profilePicPath = `/uploads/profiles/${req.file.filename}`;
        const pool = await getPool();

        // 1. Cleanup: Fetch the current picture path before updating
        const userResult = await pool.request()
            .input('id', sql.Int, userID)
            .query('SELECT ProfilePicture FROM Users WHERE UserID = @id');
        
        const oldPic = userResult.recordset[0]?.ProfilePicture;

        // 2. Update Database: Set the new path
        await pool.request()
            .input('pic', sql.VarChar, profilePicPath)
            .input('id', sql.Int, userID)
            .query('UPDATE Users SET ProfilePicture = @pic WHERE UserID = @id');

        // 3. File System Cleanup: Delete the old file if it exists (prevents orphan files)
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

/**
 * FORGOT PASSWORD
 * Generates a unique, time-limited token and sends a reset link to the user's email.
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];
        // Security Note: We return the same message even if email doesn't exist (prevents email enumeration)
        if (!user) {
            return res.json({ message: "If that email is in our system, a reset link has been sent." });
        }

        // 1. Generate Token: Use crypto to create a secure, random hex string
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000); // Token expires in 15 minutes

        // 2. Save Token: Store the token and its expiry in the user's record
        await pool.request()
            .input('Token', sql.VarChar, resetToken)
            .input('Expiry', sql.DateTime, expires)
            .input('UserID', sql.Int, user.UserID)
            .query('UPDATE Users SET ResetPasswordToken = @Token, ResetPasswordExpires = @Expiry WHERE UserID = @UserID');

        // 3. Construct Link: The URL the user will click in their email
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

        // 4. Send Email: Use the email utility to send the instructions
        await sendEmail(email, subject, '', html);
        res.json({ message: "If that email is in our system, a reset link has been sent." });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

/**
 * RESET PASSWORD
 * Verifies the token and updates the user's password if the token is valid and not expired.
 */
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

        // 1. Token Verification: Check if user exists, token matches, and is still valid
        if (!user || user.ResetPasswordToken !== token || new Date(user.ResetPasswordExpires) < new Date()) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        // 2. Hash New Password: Securely process the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update DB: Save new password and clear the reset token fields
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

/**
 * REFRESH ACCESS TOKEN
 * Issues a new Access Token using a valid Refresh Token. 
 * This allows users to stay logged in without re-entering credentials for 7 days.
 */
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

        // 1. Verify Token: Check if the Refresh Token is authentic and valid
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh'));

        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, decoded.id)
            .query('SELECT * FROM Users WHERE UserID = @UserID');

        const user = result.recordset[0];
        if (!user) return res.status(401).json({ message: "User not found" });

        // 2. Issue New Token: Generate a fresh Access Token with user details
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