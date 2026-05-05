require('dotenv').config();
const { sql, getPool } = require('../config/db');
async function run() {
    const pool = await getPool();
    await pool.request()
        .input('Email', sql.VarChar, 'dr@mini.edu.eg')
        .query("UPDATE Users SET FailedLoginAttempts = 0, LockedUntil = NULL WHERE Email = @Email");
    console.log('✅ Instructor account unlocked!');
    process.exit(0);
}
run();
