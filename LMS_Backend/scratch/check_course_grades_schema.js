require('dotenv').config();
const { getPool } = require('../config/db');

async function checkSchema() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Course_Grades'
        `);
        if (result.recordset.length === 0) {
            console.log("Table 'Course_Grades' does NOT exist!");
        } else {
            console.log("Course_Grades Columns:");
            console.log(JSON.stringify(result.recordset, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
