require('dotenv').config();
const { sql, getPool } = require('./config/db');
async function run() {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM Users WHERE UserType='Instructor'");
    console.log(result.recordset);
    process.exit(0);
}
run();
