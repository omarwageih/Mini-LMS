const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        const pool = await sql.connect(config);
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('Password123', 10);
        await pool.request()
            .input('hash', sql.VarChar, hash)
            .query("UPDATE Users SET Password = @hash WHERE Email = 'dr@mini.edu.eg'");
        console.log("Instructor password updated to Password123");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
