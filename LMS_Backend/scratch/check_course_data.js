require('dotenv').config();
const { getPool } = require('../config/db');

async function checkCourseData() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT CourseID, InstructorID FROM Course
        `);
        console.log("Course Table Data:");
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCourseData();
