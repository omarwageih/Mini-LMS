const { sql, poolPromise } = require('../config/dbConfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email AND DeletedAt IS NULL AND IsActive = 1');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.recordset[0];
        
        let validPass = false;
        // Support both old schema (Password) and new schema (PasswordHash)
        const storedHash = user.PasswordHash || user.Password;

        if (!storedHash) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 1. Plain text match (legacy seed data with old Password column)
        if (storedHash === password) {
            validPass = true;
        }

        // 2. Try bcrypt (passwords created via register endpoint)
        if (!validPass) {
            try {
                if (storedHash.startsWith('$2')) {
                    validPass = await bcrypt.compare(password, storedHash);
                }
            } catch (e) { /* not a bcrypt hash */ }
        }

        // 3. Fallback: compare against SHA2_256 hex (new seed data from SQL)
        if (!validPass) {
            try {
                const sha256Result = await pool.request()
                    .input('Password', sql.NVarChar, password)
                    .query("SELECT CONVERT(NVARCHAR(512), HASHBYTES('SHA2_256', @Password), 2) AS Hash");
                const sha256Hash = sha256Result.recordset[0].Hash;
                if (storedHash === sha256Hash) {
                    validPass = true;
                }
            } catch (e) { /* SHA2_256 comparison failed */ }
        }

        if (!validPass) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.UserID, email: user.Email, UserType: user.UserType },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log the login activity (graceful if table doesn't exist)
        try {
            await pool.request()
                .input('UserID', sql.Int, user.UserID)
                .input('Action', sql.NVarChar, 'LOGIN')
                .input('Details', sql.NVarChar, 'User logged in successfully')
                .query("INSERT INTO Activity_Log (UserID, Action, Details) VALUES (@UserID, @Action, @Details)");
        } catch (logErr) { /* Activity_Log table may not exist yet */ }

        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                UserID: user.UserID,
                FullName: user.FullName,
                Email: user.Email,
                UserType: user.UserType
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, phone, userType } = req.body;
        if (!fullName || !email || !password || !userType) {
            return res.status(400).json({ message: 'fullName, email, password, and userType are required' });
        }

        const pool = await poolPromise;

        const checkEmail = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT UserID FROM Users WHERE Email = @Email');

        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Try new schema (PasswordHash) first, fallback to old (Password)
        let result;
        try {
            result = await pool.request()
                .input('FullName', sql.NVarChar, fullName)
                .input('Email', sql.NVarChar, email)
                .input('PasswordHash', sql.NVarChar, hash)
                .input('Phone', sql.NVarChar, phone || null)
                .input('UserType', sql.NVarChar, userType)
                .query(`
                    INSERT INTO Users (FullName, Email, PasswordHash, Phone, UserType) 
                    OUTPUT inserted.UserID
                    VALUES (@FullName, @Email, @PasswordHash, @Phone, @UserType)
                `);
        } catch (colErr) {
            // Fallback for old DB schema with Password column
            result = await pool.request()
                .input('FullName', sql.NVarChar, fullName)
                .input('Email', sql.NVarChar, email)
                .input('Password', sql.NVarChar, hash)
                .input('Phone', sql.NVarChar, phone || null)
                .input('UserType', sql.NVarChar, userType)
                .query(`
                    INSERT INTO Users (FullName, Email, Password, Phone, UserType) 
                    OUTPUT inserted.UserID
                    VALUES (@FullName, @Email, @Password, @Phone, @UserType)
                `);
        }

        const newUserId = result.recordset[0].UserID;
        
        // Insert into role-specific table
        if (userType === 'Student') {
            await pool.request()
                .input('UserID', sql.Int, newUserId)
                .query('INSERT INTO Students (UserID) VALUES (@UserID)');
        } else if (userType === 'Instructor') {
            await pool.request()
                .input('UserID', sql.Int, newUserId)
                .query('INSERT INTO Instructors (UserID) VALUES (@UserID)');
        } else if (userType === 'Assistant') {
            await pool.request()
                .input('UserID', sql.Int, newUserId)
                .query('INSERT INTO Assistants (UserID) VALUES (@UserID)');
        }

        // Log the registration activity (graceful if table doesn't exist)
        try {
            await pool.request()
                .input('UserID', sql.Int, newUserId)
                .input('Action', sql.NVarChar, 'REGISTER')
                .input('Details', sql.NVarChar, `New ${userType} account created`)
                .query("INSERT INTO Activity_Log (UserID, Action, Details) VALUES (@UserID, @Action, @Details)");
        } catch (logErr) { /* Activity_Log table may not exist yet */ }

        res.status(201).json({ message: 'User registered successfully', UserID: newUserId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
