require('dotenv').config();
const { getPool, sql } = require('./config/db');

async function checkUsers() {
    try {
        const pool = await getPool();
        const users = await pool.request().query('SELECT UserID, FullName, Email, UserType FROM Users');
        console.log(JSON.stringify(users.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUsers();
