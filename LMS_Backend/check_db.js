require('dotenv').config();
const { getPool, sql } = require('./config/db');

async function checkDb() {
    try {
        const pool = await getPool();
        
        console.log("--- Checking Course 1 ---");
        const course = await pool.request().input('id', sql.Int, 1).query('SELECT * FROM Course WHERE CourseID = @id');
        console.log(JSON.stringify(course.recordset[0], null, 2));
        
        console.log("\n--- Checking Course_Assistants for Course 1 ---");
        const assistants = await pool.request().input('id', sql.Int, 1).query('SELECT * FROM Course_Assistants WHERE CourseID = @id');
        console.log(JSON.stringify(assistants.recordset, null, 2));
        
        console.log("\n--- Checking Instructors table ---");
        const instructors = await pool.request().query('SELECT * FROM Instructors');
        console.log(JSON.stringify(instructors.recordset, null, 2));

        console.log("\n--- Checking Assistants table ---");
        const asstTable = await pool.request().query('SELECT * FROM Assistants');
        console.log(JSON.stringify(asstTable.recordset, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDb();
