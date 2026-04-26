const { sql, getPool } = require('../config/db');

// =============================================
//  GET ASSIGNED COURSES
// =============================================
const getAssignedCourses = async (req, res) => {
    try {
        const userID = req.user.id; // Assistant's UserID
        const pool = await getPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT c.CourseID, c.Name AS CourseName, u.FullName AS InstructorName
                FROM Course_Assistants ca
                INNER JOIN Course c ON ca.CourseID = c.CourseID
                LEFT JOIN Users u ON c.InstructorID = u.UserID
                WHERE ca.AssistantID = @userID
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  CREATE ASSIGNMENT (for assigned courses only)
// =============================================
const createAssignment = async (req, res) => {
    try {
        const { courseID, title, maxScore, deadline } = req.body;

        if (!courseID || !title || !maxScore) {
            return res.status(400).json({ message: "courseID, title, and maxScore are required." });
        }

        // Course_Assistants check is done by middleware (requireCourseAssistant)
        const pool = await getPool();
        await pool.request()
            .input('courseID', sql.Int, courseID)
            .input('title', sql.VarChar, title)
            .input('maxScore', sql.Decimal(5, 2), maxScore)
            .input('deadline', sql.DateTime, deadline || null)
            .input('createdBy', sql.Int, req.user.id)
            .query(`
                INSERT INTO Assignment (CourseID, Title, Max_Score, Deadline, Created_By)
                VALUES (@courseID, @title, @maxScore, @deadline, @createdBy)
            `);

        res.json({ message: "Assignment created successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  GET SUBMISSIONS (for assigned courses only)
// =============================================
const getSubmissions = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT 
                    sub.SubID AS SubmissionID,
                    sub.FilePath,
                    sub.Score,
                    sub.SubmittedAt AS SubmissionDate,
                    u.FullName AS StudentName,
                    a.Title AS AssignmentTitle, a.AssignmentID,
                    c.Name AS CourseName, c.CourseID,
                    corrector.FullName AS CorrectedByName
                FROM Submission sub
                INNER JOIN Users u ON sub.StudentID = u.UserID
                INNER JOIN Assignment a ON sub.AssignmentID = a.AssignmentID
                INNER JOIN Course c ON a.CourseID = c.CourseID
                INNER JOIN Course_Assistants ca ON ca.CourseID = c.CourseID AND ca.AssistantID = @userID
                LEFT JOIN Users corrector ON sub.CorrectedBy = corrector.UserID
                ORDER BY sub.SubmittedAt DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  GRADE SUBMISSION
// =============================================
const gradeSubmission = async (req, res) => {
    try {
        const { submissionID, score } = req.body;
        const correctedBy = req.user.id;

        if (submissionID === undefined || score === undefined) {
            return res.status(400).json({ message: "submissionID and score are required." });
        }

        const pool = await getPool();

        // Verify this submission belongs to an assigned course
        const check = await pool.request()
            .input('subID', sql.Int, submissionID)
            .input('userID', sql.Int, correctedBy)
            .query(`
                SELECT sub.SubID
                FROM Submission sub
                INNER JOIN Assignment a ON sub.AssignmentID = a.AssignmentID
                INNER JOIN Course_Assistants ca ON ca.CourseID = a.CourseID AND ca.AssistantID = @userID
                WHERE sub.SubID = @subID
            `);

        if (check.recordset.length === 0) {
            return res.status(403).json({ message: "You cannot grade this submission." });
        }

        await pool.request()
            .input('subID', sql.Int, submissionID)
            .input('score', sql.Decimal(5, 2), score)
            .input('correctedBy', sql.Int, correctedBy)
            .query(`
                UPDATE Submission 
                SET Score = @score, CorrectedBy = @correctedBy
                WHERE SubID = @subID
            `);

        res.json({ message: "Submission graded successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAssignedCourses,
    createAssignment,
    getSubmissions,
    gradeSubmission
};
