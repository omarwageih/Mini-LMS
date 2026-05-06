require('dotenv').config();
const { getPool } = require('../config/db');
const sql = require('mssql');

async function check() {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM Material');
        console.log('Materials:', JSON.stringify(result.recordset, null, 2));
        
        const courseMaterials = await pool.request().query('SELECT * FROM CourseMaterials');
        console.log('CourseMaterials:', JSON.stringify(courseMaterials.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

check();
