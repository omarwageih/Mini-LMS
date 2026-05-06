require('dotenv').config();
const { getPool } = require('./config/db');
const sql = require('mssql');

async function testGradesQuery() {
    try {
        const pool = await getPool();
        const courseId = 1; // Assuming course ID 1 from the error log
        console.log(`Testing grades query for courseId: ${courseId}`);
        
        const query = `
            SELECT u.FullName, u.Email, cg.GradeID, cg.StudentID, cg.CourseID,
                   cg.AssignmentTotal,
                   cg.QuizTotal,
                   cg.AttendanceTotal,
                   cg.FinalGrade,
                   (cg.AssignmentTotal + cg.QuizTotal + cg.AttendanceTotal + cg.FinalGrade) AS TotalScore
            FROM Course_Grades cg 
            INNER JOIN Users u ON cg.StudentID = u.UserID 
            WHERE cg.CourseID = @cId
        `;
        
        const result = await pool.request().input('cId', sql.Int, courseId).query(query);
        console.log("Query success! Rows:", result.recordset.length);
        console.log("First row sample:", result.recordset[0]);
    } catch (err) {
        console.error("Query failed with error:", err.message);
        if (err.originalError) console.error("Original error:", err.originalError.message);
    } finally {
        process.exit();
    }
}

testGradesQuery();
