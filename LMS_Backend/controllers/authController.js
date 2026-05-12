const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');
const { logAudit, createNotification } = require('../utils/helpers');
const { success, notFound } = require('../utils/responseHandler');


const register = async (req, res) => {
    try {
        const { fullName, email, password, userType } = req.body;

        if (!fullName || !email || !password || !userType) {
            return res.status(400).json({ message: "All fields are required" });
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
                // Generate a random student code to avoid unique constraint issues
                const studentCode = 'S' + Math.floor(100000 + Math.random() * 900000);
                await request.input('sCode', sql.VarChar, studentCode).query('INSERT INTO Students (UserID, StudentCode) VALUES (@userID, @sCode)');
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
        console.error("[CRITICAL] Register Error:", {
            message: err.message,
            stack: err.stack,
            body: { ...req.body, password: '[REDACTED]' }
        });
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
                profilePicture: user.ProfilePicture,
                userCode: user.UserCode 
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { id: user.UserID },
            process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh'),
            { expiresIn: "7d" }
        );

        await logAudit(user.UserID, 'LOGIN_SUCCESS', `Login from ${req.ip}`, req.ip);

        res.json({
            token,
            refreshToken,
            user: {
                UserID: user.UserID,
                FullName: user.FullName,
                Email: user.Email,
                UserType: user.UserType,
                ProfilePicture: user.ProfilePicture,
                UserCode: user.UserCode
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        const filePath = `/uploads/profiles/${req.file.filename}`;
        
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.user.id)
            .input('pic', sql.VarChar, filePath)
            .query('UPDATE Users SET ProfilePicture = @pic WHERE UserID = @id');

        res.json({ message: "Profile picture updated", profilePicture: filePath });
    } catch (err) {
        console.error("Update Profile Pic Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { fullName, email, phone, userCode } = req.body;
        const userId = req.user.id;

        const pool = await getPool();
        
        // Update main Users table
        await pool.request()
            .input('id', sql.Int, userId)
            .input('name', sql.VarChar, fullName)
            .input('email', sql.VarChar, email)
            .input('phone', sql.VarChar, phone)
            .input('code', sql.VarChar, userCode)
            .query(`
                UPDATE Users 
                SET FullName = @name, Email = @email, Phone = @phone, UserCode = @code 
                WHERE UserID = @id
            `);

        // If user is a student, sync with Students table StudentCode for backward compatibility
        if (req.user.type === 'Student') {
            await pool.request()
                .input('id', sql.Int, userId)
                .input('code', sql.VarChar, userCode)
                .query('UPDATE Students SET StudentCode = @code WHERE UserID = @id');
        }

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT UserID FROM Users WHERE Email = @Email');

        const user = result.recordset[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        const crypto = require('crypto');
        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await pool.request()
            .input('Token', sql.VarChar, token)
            .input('Expires', sql.DateTime, expires)
            .input('UserID', sql.Int, user.UserID)
            .query('UPDATE Users SET ResetPasswordToken = @Token, ResetPasswordExpires = @Expires WHERE UserID = @UserID');

        res.json({ message: "Password reset link generated", token });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const pool = await getPool();
        const result = await pool.request()
            .input('Token', sql.VarChar, token)
            .query('SELECT UserID, ResetPasswordExpires FROM Users WHERE ResetPasswordToken = @Token');

        const user = result.recordset[0];
        if (!user || new Date(user.ResetPasswordExpires) < new Date()) {
            return res.status(400).json({ message: "Token is invalid or has expired." });
        }

        const id = user.UserID;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

const getMe = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .query('SELECT UserID, FullName, Email, Phone, UserType, ProfilePicture, UserCode FROM Users WHERE UserID = @UserID');

        const user = result.recordset[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // If student, also get student-specific fields
        if (user.UserType === 'Student') {
            const studentResult = await pool.request()
                .input('UserID', sql.Int, req.user.id)
                .query('SELECT StudentCode, GPA, Academic_Year, Major FROM Students WHERE UserID = @UserID');
            Object.assign(user, studentResult.recordset[0]);
        }

        res.json(user);
    } catch (err) {
        console.error("Get Me Error:", err);
        res.status(500).json({ message: "Internal server error" });
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
            { id: user.UserID, type: user.UserType, name: user.FullName, email: user.Email, profilePicture: user.ProfilePicture, userCode: user.UserCode },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ token: newToken });
    } catch (err) {
        console.error("Refresh Token Error:", err.message);
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: "Invalid user ID" });
        
        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, parseInt(id))
            .query('SELECT UserID, FullName, Email, Phone, UserType, ProfilePicture, UserCode FROM Users WHERE UserID = @UserID');

        const user = result.recordset[0];
        if (!user) return notFound(res, "User not found");

        // Role-specific profile data
        let extraInfo = {};
        if (user.UserType === 'Student') {
            const studentRes = await pool.request()
                .input('UserID', sql.Int, id)
                .query(`
                    SELECT StudentCode, Major, GPA, 
                           (SELECT COUNT(*) FROM Enrollment WHERE StudentID = @UserID) as CourseCount
                    FROM Students WHERE UserID = @UserID
                `);
            extraInfo = studentRes.recordset[0] || {};
        } else if (user.UserType === 'Instructor') {
            const coursesRes = await pool.request()
                .input('UserID', sql.Int, id)
                .query('SELECT CourseID, Name FROM Course WHERE InstructorID = @UserID');
            
            const infoRes = await pool.request()
                .input('UserID', sql.Int, id)
                .query('SELECT Office_Location FROM Instructors WHERE UserID = @UserID');
                
            extraInfo = { 
                CourseCount: coursesRes.recordset.length,
                ManagedCourses: coursesRes.recordset,
                ...(infoRes.recordset[0] || {})
            };
        } else if (user.UserType === 'Assistant') {
            const coursesRes = await pool.request()
                .input('UserID', sql.Int, parseInt(id))
                .query(`
                    SELECT c.CourseID, c.Name 
                    FROM Course_Assistants ca
                    JOIN Course c ON ca.CourseID = c.CourseID
                    WHERE ca.AssistantID = @UserID
                `);
            
            const infoRes = await pool.request()
                .input('UserID', sql.Int, parseInt(id))
                .query('SELECT Office_Location FROM Assistants WHERE UserID = @UserID');
                
            extraInfo = { 
                CourseCount: coursesRes.recordset.length,
                ManagedCourses: coursesRes.recordset,
                ...(infoRes.recordset[0] || {})
            };

            // Emergency debug: If this is Bilal and still 0, check if he's in any courses at all
            if (extraInfo.CourseCount === 0) {
                const fallbackRes = await pool.request()
                    .input('UserID', sql.Int, parseInt(id))
                    .query('SELECT COUNT(*) as cnt FROM Course_Assistants WHERE AssistantID = @UserID');
                if (fallbackRes.recordset[0].cnt > 0) {
                    extraInfo.CourseCount = fallbackRes.recordset[0].cnt;
                    extraInfo.ManagedCourses = [{ CourseID: 0, Name: "Assigned (Syncing...)" }];
                }
            }
        }

        const fullProfile = { ...user, ...extraInfo };
        return success(res, fullProfile);
    } catch (err) {
        console.error("Get User Profile Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { register, login, updateProfile, updateProfilePicture, getMe, getUserProfile, forgotPassword, resetPassword, refreshAccessToken };