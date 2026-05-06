/**
 * ASSIGNMENT CONTROLLER
 * Handles the creation, management, and grading of course assignments.
 */
const { sql, getPool } = require('../config/db');
const { createNotification, logAudit } = require('../utils/helpers'); // Helpers for alerts and logging
const { success, error, badRequest, forbidden } = require('../utils/responseHandler'); // API response helpers

/**
 * AUTHORIZATION HELPER
 * Verifies if the logged-in user has permission to manage assignments for a specific course.
 */
const checkCourseAccess = async (pool, courseId, userId, userType) => {
    if (userType === 'Instructor') {
        // Does the instructor own this course?
        const check = await pool.request()
            .input('cId', sql.Int, courseId)
            .input('uId', sql.Int, userId)
            .query('SELECT 1 FROM Course WHERE CourseID = @cId AND InstructorID = @uId');
        return check.recordset.length > 0;
    } else if (userType === 'Assistant') {
        // Is the assistant assigned to this course?
        const check = await pool.request()
            .input('cId', sql.Int, courseId)
            .input('uId', sql.Int, userId)
            .query('SELECT 1 FROM Course_Assistants WHERE CourseID = @cId AND AssistantID = @uId');
        return check.recordset.length > 0;
    }
    return false;
};

/**
 * CREATE ASSIGNMENT
 * Adds a new assignment to a course syllabus.
 */
const createAssignment = async (req, res) => {
    const { courseId, title, maxScore, deadline } = req.body;
    
    // 1. Basic Validation
    if (!courseId || !title || !maxScore) return badRequest(res, "courseId, title, and maxScore are required.");

    try {
        const pool = await getPool();
        
        // 2. Security: Verify that the user actually has access to this course
        const hasAccess = await checkCourseAccess(pool, courseId, req.user.id, req.user.type);
        if (!hasAccess) return forbidden(res, "You are not authorized to create assignments for this course.");

        // 3. Database Insert
        await pool.request()
            .input('courseID', sql.Int, courseId)
            .input('title', sql.VarChar, title)
            .input('maxScore', sql.Decimal(5, 2), maxScore)
            .input('deadline', sql.DateTime, deadline || null)
            .input('createdBy', sql.Int, req.user.id)
            .query(`INSERT INTO Assignment (CourseID, Title, Max_Score, Deadline, Created_By) 
                    VALUES (@courseID, @title, @maxScore, @deadline, @createdBy)`);

        // 4. Audit: Log the action
        await logAudit(req.user.id, 'CREATE_ASSIGNMENT', `Created assignment: ${title} for Course ${courseId}`, req.ip);
        
        return success(res, { message: "Assignment created successfully" }, "Success", 201);
    } catch (err) {
        return error(res, "Failed to create assignment", 500, err);
    }
};

/**
 * UPDATE ASSIGNMENT
 * Modifies an existing assignment's details.
 */
const updateAssignment = async (req, res) => {
    const { id } = req.params;
    const { title, maxScore, deadline } = req.body;

    try {
        const pool = await getPool();
        
        // 1. Fetch Assignment: Find which course this assignment belongs to
        const assignCheck = await pool.request().input('id', sql.Int, id).query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
        if (assignCheck.recordset.length === 0) return error(res, "Assignment not found", 404);
        
        // 2. Security Check: Use the fetched CourseID to verify access
        const hasAccess = await checkCourseAccess(pool, assignCheck.recordset[0].CourseID, req.user.id, req.user.type);
        if (!hasAccess) return forbidden(res, "You are not authorized to update this assignment.");

        // 3. Update Database
        await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.VarChar, title)
            .input('maxScore', sql.Decimal(5, 2), maxScore)
            .input('deadline', sql.DateTime, deadline || null)
            .query(`UPDATE Assignment SET Title = @title, Max_Score = @maxScore, Deadline = @deadline WHERE AssignmentID = @id`);

        return success(res, { message: "Assignment updated successfully" });
    } catch (err) {
        return error(res, "Failed to update assignment", 500, err);
    }
};

/**
 * DELETE ASSIGNMENT
 * Removes an assignment from the course.
 */
const deleteAssignment = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        
        // 1. Find Course: Same as update, find the parent course first
        const assignCheck = await pool.request().input('id', sql.Int, id).query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
        if (assignCheck.recordset.length === 0) return error(res, "Assignment not found", 404);
        
        // 2. Security Check
        const hasAccess = await checkCourseAccess(pool, assignCheck.recordset[0].CourseID, req.user.id, req.user.type);
        if (!hasAccess) return forbidden(res, "You are not authorized to delete this assignment.");

        // 3. Delete
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Assignment WHERE AssignmentID = @id');
        
        return success(res, { message: "Assignment deleted successfully" });
    } catch (err) {
        return error(res, "Failed to delete assignment", 500, err);
    }
};

/**
 * GET SUBMISSIONS
 * Fetches all student submissions for courses the user (Instructor/Assistant) manages.
 */
const getSubmissions = async (req, res) => {
    try {
        const pool = await getPool();
        
        // Base Query: Joining multiple tables to get a complete view of a submission
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

        // Filter Logic: Ensure users only see submissions for THEIR courses
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
 * GRADE SUBMISSION
 * Records a score for a student's submission and notifies them.
 */
const gradeSubmission = async (req, res) => {
    const { submissionId, score } = req.body;
    
    // 1. Validation
    if (submissionId === undefined || score === undefined) return badRequest(res, "submissionId and score are required.");
    if (isNaN(parseFloat(score))) return badRequest(res, "Score must be a valid number.");

    try {
        const pool = await getPool();
        
        // 2. Authorization: Complex check to ensure the grader actually manages the course this submission belongs to
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

        // 3. Update Database: Set the score and record who graded it
        await pool.request()
            .input('sId', sql.Int, submissionId)
            .input('score', sql.Decimal(5, 2), score)
            .input('correctedBy', sql.Int, req.user.id)
            .query(`UPDATE Submission SET Score = @score, CorrectedBy = @correctedBy WHERE SubID = @sId`);

        // 4. Notification: Send an alert to the student so they know their work was reviewed
        await createNotification(
            StudentID, 'grade', 'Assignment Graded', 
            `Your submission for "${Title}" has been graded: ${score}`, 
            `/course/${CourseID}`
        );

        // 5. Audit Log
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
