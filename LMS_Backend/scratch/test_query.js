require('dotenv').config();
const { sql, getPool } = require('./config/db');

async function testQuery() {
    try {
        const pool = await getPool();
        const submissionId = 11; // From screenshot
        const assistantId = 2; // Assuming this is the assistant ID

        const subCheckQuery = `SELECT sub.SubID, sub.StudentID, a.Title, a.CourseID 
                FROM Submission sub 
                JOIN Assignment a ON sub.AssignmentID = a.AssignmentID 
                JOIN Course_Assistants ca ON a.CourseID = ca.CourseID 
                WHERE sub.SubID = @sId AND ca.AssistantID = @uId`;

        console.log("Running Query:", subCheckQuery);
        const result = await pool.request()
            .input('sId', sql.Int, submissionId)
            .input('uId', sql.Int, assistantId)
            .query(subCheckQuery);
        
        console.log("Result:", JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("SQL Error:", err);
        process.exit(1);
    }
}

testQuery();
