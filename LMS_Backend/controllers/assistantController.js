const { sql, getPool } = require('../config/db');
const { deleteFile } = require('../utils/helpers');

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
                SELECT 
                    c.CourseID, 
                    c.Name AS CourseName, 
                    u.FullName AS InstructorName,
                    (SELECT COUNT(*) FROM Enrollment WHERE CourseID = c.CourseID) AS StudentCount
                FROM Course_Assistants ca
                INNER JOIN Course c ON ca.CourseID = c.CourseID
                LEFT JOIN Users u ON c.InstructorID = u.UserID
                WHERE ca.AssistantID = @userID
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("Get Assigned Courses Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching assigned courses." });
    }
};

// =============================================
//  CREATE ASSIGNMENT (for assigned courses only)
// =============================================
const createAssignment = async (req, res) => {
    try {
        const { courseId, title, maxScore, deadline } = req.body;

        if (!courseId || !title || !maxScore) {
            return res.status(400).json({ message: "courseId, title, and maxScore are required." });
        }

        const pool = await getPool();
        await pool.request()
            .input('courseID', sql.Int, courseId)
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
        console.error("Create Assignment Error:", err);
        res.status(500).json({ message: "An internal server error occurred while creating assignment." });
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
        console.error("Get Submissions Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching submissions." });
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
        console.error("Grade Submission Error:", err);
        res.status(500).json({ message: "An internal server error occurred while grading submission." });
    }
};

// =============================================
//  COURSE MATERIALS (for assigned courses only)
// =============================================
const getCourseMaterials = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();
        const result = await pool.request()
            .input('courseId', sql.Int, courseId)
            .query(`
                SELECT cm.*, u.FullName AS UploaderName
                FROM CourseMaterials cm
                INNER JOIN Users u ON cm.UploadedBy = u.UserID
                WHERE cm.CourseID = @courseId
                ORDER BY cm.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Assistant Get Course Materials Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching materials." });
    }
};

const uploadCourseMaterial = async (req, res) => {
    try {
        const { courseId, title, description, fileType } = req.body;
        const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : (req.body.fileUrl || null);
        const uploadedBy = req.user.id;

        if (!courseId || !title || !fileUrl) {
            return res.status(400).json({ message: "courseId, title, and file are required." });
        }

        const pool = await getPool();
        await pool.request()
            .input('courseId', sql.Int, courseId)
            .input('title', sql.VarChar, title)
            .input('description', sql.VarChar, description || null)
            .input('fileUrl', sql.VarChar, fileUrl)
            .input('fileType', sql.VarChar, fileType || 'document')
            .input('uploadedBy', sql.Int, uploadedBy)
            .query(`INSERT INTO CourseMaterials (CourseID, Title, Description, FileUrl, FileType, UploadedBy) 
                    VALUES (@courseId, @title, @description, @fileUrl, @fileType, @uploadedBy)`);

        res.status(201).json({ message: "Material uploaded successfully." });
    } catch (err) {
        console.error("Assistant Upload Course Material Error:", err);
        res.status(500).json({ message: "An internal server error occurred while uploading material." });
    }
};

const deleteCourseMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const assistantID = req.user.id;
        const pool = await getPool();

        // Check if material belongs to a course assigned to this assistant
        const check = await pool.request()
            .input('materialID', sql.Int, id)
            .input('assistantID', sql.Int, assistantID)
            .query(`
                SELECT cm.MaterialID 
                FROM CourseMaterials cm
                INNER JOIN Course_Assistants ca ON cm.CourseID = ca.CourseID
                WHERE cm.MaterialID = @materialID AND ca.AssistantID = @assistantID
            `);

        if (check.recordset.length === 0) {
            return res.status(403).json({ message: "You are not authorized to delete this material." });
        }

        // Fetch file URL before deleting record
        const materialRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT FileUrl FROM CourseMaterials WHERE MaterialID = @id');
        
        if (materialRes.recordset.length > 0) {
            const fileUrl = materialRes.recordset[0].FileUrl;
            deleteFile(fileUrl);
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM CourseMaterials WHERE MaterialID = @id');

        res.json({ message: "Material deleted successfully." });
    } catch (err) {
        console.error("Assistant Delete Course Material Error:", err);
        res.status(500).json({ message: "An internal server error occurred while deleting material." });
    }
};

const getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const assistantID = req.user.id;
        console.log(`[DEBUG] getCourseDetails: CourseID=${id}, AssistantID=${assistantID}`);
        const pool = await getPool();

        // 1. Basic Course Info
        const courseRes = await pool.request()
            .input('id', sql.Int, id)
            .input('assistantID', sql.Int, assistantID)
            .query(`
                SELECT c.*, u.FullName AS InstructorName
                FROM Course c
                LEFT JOIN Users u ON c.InstructorID = u.UserID
                INNER JOIN Course_Assistants ca ON c.CourseID = ca.CourseID
                WHERE c.CourseID = @id AND ca.AssistantID = @assistantID
            `);

        console.log(`[DEBUG] Course Query Result:`, courseRes.recordset);

        if (courseRes.recordset.length === 0) {
            console.warn(`[DEBUG] Course not found or access denied for AssistantID=${assistantID} on CourseID=${id}`);
            return res.status(404).json({ message: "Course terminal not found or access denied." });
        }

        const course = courseRes.recordset[0];

        // 2. Weeks & Materials (Legacy)
        const weeksRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM StudyWeek WHERE CourseID = @id ORDER BY Week_Number');
        
        const weeks = weeksRes.recordset;
        console.log(`[DEBUG] Weeks found: ${weeks.length}`);
        
        for (let week of weeks) {
            const materialsRes = await pool.request()
                .input('weekID', sql.Int, week.Week_ID)
                .query('SELECT * FROM Material WHERE Week_ID = @weekID');
            week.materials = materialsRes.recordset;
            console.log(`[DEBUG] Week ${week.Week_Number} materials: ${week.materials.length}`);
        }

        // 3. Lectures
        const lecturesRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Lecture WHERE CourseID = @id ORDER BY Date DESC');

        // 4. Assignments
        const assignmentsRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Assignment WHERE CourseID = @id ORDER BY Deadline ASC');

        // 5. Enrollment Count
        const countRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) AS count FROM Enrollment WHERE CourseID = @id');

        console.log(`[DEBUG] Final result count - Lectures: ${lecturesRes.recordset.length}, Assignments: ${assignmentsRes.recordset.length}`);

        res.json({
            course,
            weeks,
            lectures: lecturesRes.recordset,
            assignments: assignmentsRes.recordset,
            enrolledCount: countRes.recordset[0].count
        });
    } catch (err) {
        console.error("Assistant Get Course Details Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getAssignedCourses,
    getCourseDetails,
    createAssignment,
    getSubmissions,
    gradeSubmission,
    getCourseMaterials,
    uploadCourseMaterial,
    deleteCourseMaterial
};
