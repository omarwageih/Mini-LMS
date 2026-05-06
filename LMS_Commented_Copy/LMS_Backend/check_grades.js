require('dotenv').config();
const { sql, getPool } = require('./config/db');

async function check() {
    try {
        const pool = await getPool();
        const res = await pool.request().query('SELECT COUNT(*) as count FROM Course_Grades');
        console.log('Course_Grades count:', res.recordset[0].count);
        const res2 = await pool.request().query('SELECT TOP 5 * FROM Course_Grades');
        console.log('Sample grades:', res2.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
check();
