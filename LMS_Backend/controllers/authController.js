const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// ================= REGISTER =================
const register = async (req, res) => {
    try {
        const { fullName, email, password, userType } = req.body;

        if (!fullName || !email || !password || !userType) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const pool = await getPool();

        // Only one instructor allowed
        if (userType === "Instructor") {
            const existing = await pool.request()
                .input('type', sql.VarChar, 'Instructor')
                .query('SELECT * FROM Users WHERE UserType = @type');

            if (existing.recordset.length > 0) {
                return res.status(400).json({ message: "Only one instructor allowed" });
            }
        }

        // Check duplicate email
        const dup = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');
        if (dup.recordset.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await pool.request()
            .input('fullName', sql.VarChar, fullName)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('userType', sql.VarChar, userType)
            .query(`
                INSERT INTO Users (FullName, Email, Password, UserType)
                OUTPUT INSERTED.UserID
                VALUES (@fullName, @email, @password, @userType)
            `);

        const userID = userResult.recordset[0].UserID;

        // Insert into role-specific table
        if (userType === "Instructor") {
            await pool.request()
                .input('userID', sql.Int, userID)
                .query('INSERT INTO Instructors (UserID) VALUES (@userID)');
        } else if (userType === "Assistant") {
            await pool.request()
                .input('userID', sql.Int, userID)
                .query('INSERT INTO Assistants (UserID) VALUES (@userID)');
        } else if (userType === "Student") {
            await pool.request()
                .input('userID', sql.Int, userID)
                .query('INSERT INTO Students (UserID) VALUES (@userID)');
        }

        res.json({ message: "User registered successfully", userID });

    } catch (err) {
        res.status(500).json({ error: err.message });
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
            return res.status(400).json({ message: "User not found" });
        }

        // Check password: support both hashed (bcrypt) and plain-text (seeded data)
        let isMatch = false;
        if (user.Password.startsWith('$2')) {
            // bcrypt hash
            isMatch = await bcrypt.compare(password, user.Password);
        } else {
            // Plain text (e.g., seeded instructor '123456')
            isMatch = (password === user.Password);
        }

        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password" });
        }

        const token = jwt.sign(
            { 
                id: user.UserID, 
                type: user.UserType,
                name: user.FullName,
                email: user.Email
            },
            "secretkey",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login success",
            token
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, login };