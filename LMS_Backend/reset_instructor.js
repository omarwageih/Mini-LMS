require('dotenv').config();
const { getPool, sql } = require('./config/db');

async function promoteUser() {
    try {
        const pool = await getPool();
        const email = 'dr@mini.edu.eg';
        const password = 'Password123!';
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.request()
            .input('email', sql.VarChar, email)
            .input('pass', sql.VarChar, hashedPassword)
            .query('UPDATE Users SET Password = @pass WHERE Email = @email');
            
        console.log(`Password for ${email} updated to Password123!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
promoteUser();
