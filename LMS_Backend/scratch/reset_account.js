require('dotenv').config();
const { getPool, sql } = require('../config/db');

async function reset() {
    try {
        const pool = await getPool();
        await pool.request()
            .input('Email', sql.VarChar, 'dr@mini.edu.eg')
            .query('UPDATE Users SET FailedLoginAttempts = 0, LockedUntil = NULL WHERE Email = @Email');
        console.log('Account lockout reset for dr@mini.edu.eg');
    } catch (e) {
        console.error('Reset failed:', e.message);
    } finally {
        process.exit();
    }
}

reset();
