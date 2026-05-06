require('dotenv').config();
const { getPool } = require('./config/db');
const sql = require('mssql');

async function testAllQueries() {
    try {
        const pool = await getPool();
        const courseId = 1;
        
        console.log("--- Testing getCourseGrades ---");
        const gradesQuery = `
            SELECT u.FullName, u.Email, cg.GradeID, cg.StudentID, cg.CourseID,
                   cg.AssignmentTotal,
                   cg.QuizTotal,
                   cg.AttendanceTotal,
                   cg.FinalGrade,
                   (ISNULL(cg.AssignmentTotal, 0) + ISNULL(cg.QuizTotal, 0) + ISNULL(cg.AttendanceTotal, 0) + ISNULL(cg.FinalGrade, 0)) AS TotalScore
            FROM Course_Grades cg 
            INNER JOIN Users u ON cg.StudentID = u.UserID 
            WHERE cg.CourseID = @cId
        `;
        const gradesResult = await pool.request().input('cId', sql.Int, courseId).query(gradesQuery);
        console.log("Grades Success! Rows:", gradesResult.recordset.length);

        console.log("--- Testing getCourseQuizzes ---");
        const quizzesQuery = `
            SELECT q.*, w.Week_Number
            FROM Quizzes q
            INNER JOIN StudyWeek w ON q.WeekID = w.Week_ID
            WHERE w.CourseID = @cId
            ORDER BY w.Week_Number
        `;
        try {
            const quizzesResult = await pool.request().input('cId', sql.Int, courseId).query(quizzesQuery);
            console.log("Quizzes Success! Rows:", quizzesResult.recordset.length);
        } catch (e) {
            console.error("Quizzes Failed:", e.message);
        }

        console.log("--- Testing getCalendarEvents ---");
        const calendarQuery = `
                SELECT l.Title, l.Date, 'lecture' AS Type, c.Name AS CourseName,
                       0 AS IsSubmitted
                FROM Lecture l
                INNER JOIN StudyWeek w ON l.Week_ID = w.Week_ID
                INNER JOIN Enrollment e ON w.CourseID = e.CourseID
                INNER JOIN Course c ON w.CourseID = c.CourseID
                WHERE e.StudentID = 5
        `; // Assuming student 5 exists
        const calendarResult = await pool.request().query(calendarQuery);
        console.log("Calendar Success! Rows:", calendarResult.recordset.length);

    } catch (err) {
        console.error("Unexpected failure:", err.message);
    } finally {
        process.exit();
    }
}

testAllQueries();
