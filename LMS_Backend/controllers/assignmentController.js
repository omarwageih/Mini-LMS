const { sql, getPool } = require('../config/db');
const { createNotification, logAudit, checkCourseAccess } = require('../utils/helpers');
const { success, error, badRequest, forbidden } = require('../utils/responseHandler');



/**
 * POST /api/instructor/assignments OR /api/assistant/assignments
 */
const createAssignment = async (req, res) => {
    const { courseId, title, maxScore, deadline, type } = req.body;
    if (!courseId || !title || !maxScore) return badRequest(res, "courseId, title, and maxScore are required.");

    try {
        const pool = await getPool();
        const hasAccess = await checkCourseAccess(pool, courseId, req.user.id, req.user.type);
        if (!hasAccess) return forbidden(res, "You are not authorized to create assignments for this course.");

        await pool.request()
            .input('courseID', sql.Int, courseId)
            .input('title', sql.VarChar, title)
            .input('maxScore', sql.Decimal(5, 2), maxScore)
            .input('deadline', sql.DateTime, deadline || null)
            .input('type', sql.VarChar, type || 'Assignment')
            .input('createdBy', sql.Int, req.user.id)
            .query(`INSERT INTO Assignment (CourseID, Title, Max_Score, Deadline, Type, Created_By) 
                    VALUES (@courseID, @title, @maxScore, @deadline, @type, @createdBy)`);

        await logAudit(req.user.id, 'CREATE_ASSIGNMENT', `Created ${type || 'assignment'}: ${title} for Course ${courseId}`, req.ip);
        return success(res, { message: "Assignment created successfully" }, "Success", 201);
    } catch (err) {
        return error(res, "Failed to create assignment", 500, err);
    }
};

/**
 * PUT /api/instructor/assignments/:id
 */
const updateAssignment = async (req, res) => {
    const { id } = req.params;
    const { title, maxScore, deadline, type } = req.body;

    try {
        const pool = await getPool();
        // Verify ownership/access via course
        const assignCheck = await pool.request().input('id', sql.Int, id).query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
        if (assignCheck.recordset.length === 0) return error(res, "Assignment not found", 404);
        
        const hasAccess = await checkCourseAccess(pool, assignCheck.recordset[0].CourseID, req.user.id, req.user.type);
        if (!hasAccess) return forbidden(res, "You are not authorized to update this assignment.");

        await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.VarChar, title)
            .input('maxScore', sql.Decimal(5, 2), maxScore)
            .input('deadline', sql.DateTime, deadline || null)
            .input('type', sql.VarChar, type || 'Assignment')
            .query(`UPDATE Assignment SET Title = @title, Max_Score = @maxScore, Deadline = @deadline, Type = @type WHERE AssignmentID = @id`);

        return success(res, { message: "Assignment updated successfully" });
    } catch (err) {
        return error(res, "Failed to update assignment", 500, err);
    }
};

/**
 * DELETE /api/instructor/assignments/:id
 */
const deleteAssignment = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        const assignCheck = await pool.request().input('id', sql.Int, id).query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
        if (assignCheck.recordset.length === 0) return error(res, "Assignment not found", 404);
        
        const hasAccess = await checkCourseAccess(pool, assignCheck.recordset[0].CourseID, req.user.id, req.user.type);
        if (!hasAccess) return forbidden(res, "You are not authorized to delete this assignment.");

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const request = new sql.Request(transaction);
            request.input('id', sql.Int, id);
            
            // Cascade delete submissions
            await request.query('DELETE FROM Submission WHERE AssignmentID = @id');
            // Delete the assignment
            await request.query('DELETE FROM Assignment WHERE AssignmentID = @id');
            
            await transaction.commit();
            return success(res, { message: "Assignment deleted successfully" });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        return error(res, "Failed to delete assignment", 500, err);
    }
};

/**
 * GET /api/instructor/submissions OR /api/assistant/submissions
 */
const getSubmissions = async (req, res) => {
    try {
        const pool = await getPool();
        let query = `
            SELECT sub.SubID AS SubmissionID, sub.FilePath, sub.Score, sub.SubmittedAt AS SubmissionDate,
                   u.FullName AS StudentName, a.Title AS AssignmentTitle, a.AssignmentID, a.AssignmentID as assignmentId,
                   c.Name AS CourseName, c.CourseID, c.CourseID as courseId, corr.FullName AS CorrectedByName
            FROM Submission sub
            INNER JOIN Users u ON sub.StudentID = u.UserID
            INNER JOIN Assignment a ON sub.AssignmentID = a.AssignmentID
            INNER JOIN Course c ON a.CourseID = c.CourseID
            LEFT JOIN Users corr ON sub.CorrectedBy = corr.UserID
        `;

        const request = pool.request().input('uId', sql.Int, req.user.id);

        if (req.user.type === 'Instructor') {
            query += ` WHERE c.InstructorID = @uId `;
        } else if (req.user.type === 'Assistant') {
            query += ` INNER JOIN Course_Assistants ca ON ca.CourseID = c.CourseID AND ca.AssistantID = @uId `;
        } else {
            return forbidden(res);
        }

        query += ` ORDER BY sub.SubmittedAt DESC `;
        const result = await request.query(query);
        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch submissions", 500, err);
    }
};

/**
 * POST /api/instructor/submissions/grade OR /api/assistant/submissions/grade
 */
const gradeSubmission = async (req, res) => {
    const { submissionId, score } = req.body;
    if (submissionId === undefined || score === undefined) return badRequest(res, "submissionId and score are required.");
    if (isNaN(parseFloat(score))) return badRequest(res, "Score must be a valid number.");

    try {
        const pool = await getPool();
        
        // 1. Authorization Check
        const subCheckQuery = req.user.type === 'Instructor' 
            ? `SELECT sub.SubID, sub.StudentID, a.Title, c.CourseID 
               FROM Submission sub 
               JOIN Assignment a ON sub.AssignmentID = a.AssignmentID 
               JOIN Course c ON a.CourseID = c.CourseID 
               WHERE sub.SubID = @sId AND c.InstructorID = @uId`
            : `SELECT sub.SubID, sub.StudentID, a.Title, a.CourseID 
               FROM Submission sub 
               JOIN Assignment a ON sub.AssignmentID = a.AssignmentID 
               JOIN Course_Assistants ca ON a.CourseID = ca.CourseID 
               WHERE sub.SubID = @sId AND ca.AssistantID = @uId`;

        const check = await pool.request()
            .input('sId', sql.Int, submissionId)
            .input('uId', sql.Int, req.user.id)
            .query(subCheckQuery);

        if (check.recordset.length === 0) return forbidden(res, "You are not authorized to grade this submission.");

        const { StudentID, Title, CourseID } = check.recordset[0];

        // 2. Update Grade
        await pool.request()
            .input('sId', sql.Int, submissionId)
            .input('score', sql.Decimal(5, 2), score)
            .input('correctedBy', sql.Int, req.user.id)
            .query(`UPDATE Submission SET Score = @score, CorrectedBy = @correctedBy WHERE SubID = @sId`);

        // 3. Notify Student
        await createNotification(
            StudentID, 'grade', 'Assignment Graded', 
            `Your submission for "${Title}" has been graded: ${score}`, 
            `/course/${CourseID}`
        );

        await logAudit(req.user.id, 'GRADE_SUBMISSION', `Graded submission #${submissionId} with score ${score}`, req.ip);
        return success(res, { message: "Submission graded successfully" });
    } catch (err) {
        return error(res, "Failed to grade submission", 500, err);
    }
};

module.exports = {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getSubmissions,
    gradeSubmission
};
