const { sql, getPool } = require('../config/db');

// =============================================
//  DASHBOARD (name, GPA, enrolled courses)
// =============================================
const getDashboard = async (req, res) => {
    try {
        const userID = req.user.id;
        // In this schema, Students.UserID = Users.UserID (PK)
        // Enrollment.StudentID = Students.UserID
        const pool = await getPool();

        // Get user info + student GPA
        const userResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT u.FullName, u.Email, s.GPA, s.Academic_Year, s.Major
                FROM Users u
                INNER JOIN Students s ON u.UserID = s.UserID
                WHERE u.UserID = @userID
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: "Student not found." });
        }

        const student = userResult.recordset[0];

        // Get enrolled courses count (Enrollment.StudentID = UserID)
        const coursesResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query('SELECT COUNT(*) AS courseCount FROM Enrollment WHERE StudentID = @userID');

        // Get pending assignments count
        const pendingResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT COUNT(*) AS pendingCount
                FROM Assignment a
                INNER JOIN Enrollment e ON a.CourseID = e.CourseID AND e.StudentID = @userID
                LEFT JOIN Submission s ON s.AssignmentID = a.AssignmentID AND s.StudentID = @userID
                WHERE s.SubID IS NULL
            `);

        res.json({
            fullName: student.FullName,
            email: student.Email,
            gpa: student.GPA,
            academicYear: student.Academic_Year,
            major: student.Major,
            courseCount: coursesResult.recordset[0].courseCount,
            pendingTasks: pendingResult.recordset[0].pendingCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  MY COURSES (via Enrollment)
// =============================================
const getMyCourses = async (req, res) => {
    try {
        const userID = req.user.id;
        // Enrollment.StudentID = Students.UserID = Users.UserID
        const pool = await getPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT c.CourseID, c.Name AS CourseName, u.FullName AS InstructorName
                FROM Enrollment e
                INNER JOIN Course c ON e.CourseID = c.CourseID
                LEFT JOIN Users u ON c.InstructorID = u.UserID
                WHERE e.StudentID = @userID
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  COURSE CONTENT (Weeks + Materials + Lectures)
// =============================================
const getCourseContent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userID = req.user.id;
        const pool = await getPool();

        // Verify enrollment
        const enrollCheck = await pool.request()
            .input('userID', sql.Int, userID)
            .input('courseID', sql.Int, courseId)
            .query('SELECT * FROM Enrollment WHERE StudentID = @userID AND CourseID = @courseID');

        if (enrollCheck.recordset.length === 0) {
            return res.status(403).json({ message: "You are not enrolled in this course." });
        }

        // Get course info
        const courseResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT c.CourseID, c.Name AS CourseName, c.Max_Marks,
                       u.FullName AS InstructorName
                FROM Course c
                LEFT JOIN Users u ON c.InstructorID = u.UserID
                WHERE c.CourseID = @courseID
            `);

        // Get weeks (using correct column names)
        const weeksResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT Week_ID AS WeekID, CourseID, Week_Number AS WeekNumber, Title, StartDate, EndDate
                FROM StudyWeek 
                WHERE CourseID = @courseID 
                ORDER BY Week_Number
            `);

        // Get materials for each week
        const weeks = [];
        for (const week of weeksResult.recordset) {
            const materialsResult = await pool.request()
                .input('weekID', sql.Int, week.WeekID)
                .query(`
                    SELECT Material_ID AS MaterialID, Week_ID AS WeekID, Title, Created_By
                    FROM Material 
                    WHERE Week_ID = @weekID
                `);

            weeks.push({
                ...week,
                materials: materialsResult.recordset,
                lectures: [] // Lectures link to Course, not Week
            });
        }

        // Get lectures for this course (linked directly to Course, not Week)
        const lecturesResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT LectureID, Title, Date, Start_Time, End_Time
                FROM Lecture 
                WHERE CourseID = @courseID 
                ORDER BY Date
            `);

        // Get assignments for this course
        const assignmentsResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT AssignmentID, Title, Max_Score, Deadline
                FROM Assignment 
                WHERE CourseID = @courseID 
                ORDER BY Deadline
            `);

        res.json({
            course: courseResult.recordset[0],
            weeks,
            lectures: lecturesResult.recordset,
            assignments: assignmentsResult.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  GET ASSIGNMENTS (for enrolled courses)
// =============================================
const getAssignments = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT 
                    a.AssignmentID, a.Title, a.Max_Score, a.Deadline,
                    c.Name AS CourseName,
                    sub.SubID AS SubmissionID, sub.Score, sub.FilePath AS SubmissionFile,
                    CASE WHEN sub.SubID IS NOT NULL THEN 'Submitted' ELSE 'Pending' END AS Status
                FROM Assignment a
                INNER JOIN Enrollment e ON a.CourseID = e.CourseID AND e.StudentID = @userID
                INNER JOIN Course c ON a.CourseID = c.CourseID
                LEFT JOIN Submission sub ON sub.AssignmentID = a.AssignmentID AND sub.StudentID = @userID
                ORDER BY a.Deadline
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  SUBMIT ASSIGNMENT (file upload)
// =============================================
const submitAssignment = async (req, res) => {
    try {
        const { assignmentID } = req.body;
        const userID = req.user.id;

        if (!assignmentID) {
            return res.status(400).json({ message: "assignmentID is required." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "File is required (PDF or JPG)." });
        }

        const pool = await getPool();

        // Check if already submitted (UNIQUE constraint: AssignmentID + StudentID)
        const existing = await pool.request()
            .input('assignmentID', sql.Int, assignmentID)
            .input('userID', sql.Int, userID)
            .query('SELECT * FROM Submission WHERE AssignmentID = @assignmentID AND StudentID = @userID');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: "You already submitted this assignment." });
        }

        const filePath = req.file.filename;

        await pool.request()
            .input('assignmentID', sql.Int, assignmentID)
            .input('userID', sql.Int, userID)
            .input('filePath', sql.VarChar, filePath)
            .query(`
                INSERT INTO Submission (AssignmentID, StudentID, FilePath)
                VALUES (@assignmentID, @userID, @filePath)
            `);

        res.json({ message: "Assignment submitted successfully", filePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  GET GRADES
// =============================================
const getGrades = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT 
                    cg.GradeID,
                    cg.AssignmentTotal,
                    cg.QuizTotal,
                    cg.AttendanceTotal,
                    cg.FinalGrade AS TotalScore,
                    c.Name AS CourseName,
                    c.CourseID
                FROM Course_Grades cg
                INNER JOIN Course c ON cg.CourseID = c.CourseID
                WHERE cg.StudentID = @userID
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getDashboard,
    getMyCourses,
    getCourseContent,
    getAssignments,
    submitAssignment,
    getGrades
};
