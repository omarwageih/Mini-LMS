require('dotenv').config();
const { getPool } = require('../config/db');
const sql = require('mssql');

async function checkGradesData() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TOP 10 * FROM Course_Grades
        `);
        console.log("Course_Grades Sample Data:");
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkGradesData();
