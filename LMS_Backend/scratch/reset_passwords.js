const bcrypt = require('bcryptjs');
const { sql, getPool } = require('./config/db');
require('dotenv').config();

async function resetPasswords() {
    try {
        const pool = await getPool();
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await pool.request()
            .input('password', sql.VarChar, hashedPassword)
            .query('UPDATE Users SET Password = @password');
            
        console.log("All passwords reset to: password123");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPasswords();
