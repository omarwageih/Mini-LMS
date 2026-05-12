require('dotenv').config();
const { sql, getPool } = require('../config/db');

async function testDeleteWeek() {
    try {
        const pool = await getPool();
        const weekId = 14;
        console.log(`Testing deletion of Week ID: ${weekId}`);
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const request = new sql.Request(transaction);
            request.input('id', sql.Int, weekId);
            
            console.log("Deleting Attendance...");
            await request.query('DELETE FROM Attendance WHERE LectureID IN (SELECT LectureID FROM Lecture WHERE Week_ID = @id)');
            
            console.log("Deleting Material...");
            await request.query('DELETE FROM Material WHERE Week_ID = @id');
            
            console.log("Deleting Lecture...");
            await request.query('DELETE FROM Lecture WHERE Week_ID = @id');
            
            console.log("Deleting StudyWeek...");
            await request.query('DELETE FROM StudyWeek WHERE Week_ID = @id');
            
            await transaction.commit();
            console.log("Deletion SUCCESS!");
        } catch (err) {
            await transaction.rollback();
            console.error("Deletion FAILED:", err.message);
            if (err.precedingErrors) console.error("Preceding errors:", err.precedingErrors);
        }
    } catch (err) {
        console.error("Pool error:", err.message);
    } finally {
        process.exit();
    }
}

testDeleteWeek();
