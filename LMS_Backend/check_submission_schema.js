require('dotenv').config();
const { getPool } = require('./config/db');

async function checkSubmissionSchema() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Submission'
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSubmissionSchema();
