require('dotenv').config();
const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function run() {
    const pool = await getPool();
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.request()
        .input('Email', sql.VarChar, 'dr@mini.edu.eg')
        .input('Password', sql.VarChar, hashedPassword)
        .query("UPDATE Users SET Password = @Password, FailedLoginAttempts = 0, LockedUntil = NULL WHERE Email = @Email");
    
    console.log('✅ Instructor password reset to "123456" and account unlocked!');
    process.exit(0);
}
run();
