/**
 * USER MANAGEMENT CONTROLLER
 * Handles administrative tasks for instructors, including managing students,
 * teaching assistants, and course enrollments.
 */
const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs'); // For secure password hashing
const { logAudit, createNotification } = require('../utils/helpers'); // Utilities for logging and alerts
const { success, error, badRequest } = require('../utils/responseHandler'); // API response helpers

/**
 * FETCH ASSISTANTS
 * Retrieves a list of all Teaching Assistants in the system.
 */
const getAssistants = async (req, res) => {
    try {
        const pool = await getPool();
        // Joins Users and Assistants table to get full details and office locations
        const result = await pool.request().query(`
            SELECT u.UserID, u.UserID AS AssistantID, u.FullName, u.Email, a.Office_Location
            FROM Users u
            INNER JOIN Assistants a ON u.UserID = a.UserID
            WHERE u.UserType = 'Assistant'
        `);
        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch assistants", 500, err);
    }
};

/**
 * ADD ASSISTANT
 * Creates a new Assistant user account. Uses a Transaction to ensure data consistency
 * across the 'Users' and 'Assistants' tables.
 */
const addAssistant = async (req, res) => {
    const { fullName, email, password } = req.body;
    
    // 1. Validation
    if (!fullName || !email || !password) return badRequest(res, "fullName, email, and password are required.");

    try {
        const pool = await getPool();
        // 2. Transaction Start: Ensures both inserts succeed or both fail
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            
            // 3. Email Check: Prevent duplicate accounts
            const existing = await request.input('email', sql.VarChar, email).query('SELECT 1 FROM Users WHERE Email = @email');

            if (existing.recordset.length > 0) {
                await transaction.rollback();
                return badRequest(res, "Email already exists.");
            }

            // 4. Hashing: Securely store the password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // 5. Insert into Users Table
            const userResult = await request
                .input('fullName', sql.VarChar, fullName)
                .input('emailParam', sql.VarChar, email)
                .input('password', sql.VarChar, hashedPassword)
                .input('userType', sql.VarChar, 'Assistant')
                .query(`INSERT INTO Users (FullName, Email, Password, UserType) OUTPUT INSERTED.UserID VALUES (@fullName, @emailParam, @password, @userType)`);

            const userID = userResult.recordset[0].UserID;
            
            // 6. Insert into Assistants Table: Links the user to the assistant role
            await request.input('userID', sql.Int, userID).query('INSERT INTO Assistants (UserID) VALUES (@userID)');

            // 7. Commit: Save changes permanently
            await transaction.commit();
            
            // 8. Audit Log
            await logAudit(req.user.id, 'ADD_ASSISTANT', `Added assistant: ${fullName} (${email})`, req.ip);

            return success(res, { message: "Assistant added successfully", userID }, "Success", 201);
        } catch (txErr) {
            await transaction.rollback(); // Undo everything on error
            throw txErr;
        }
    } catch (err) {
        return error(res, err.message, 500, err);
    }
};

/**
 * DELETE ASSISTANT
 * Permanently removes an assistant and their course assignments.
 */
const deleteAssistant = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('userID', sql.Int, id);

            // 1. Remove from all course assignments first (Foreign Key cleanup)
            await request.query('DELETE FROM Course_Assistants WHERE AssistantID = @userID');
            // 2. Remove role-specific profile
            await request.query('DELETE FROM Assistants WHERE UserID = @userID');
            // 3. Remove main user account
            await request.query("DELETE FROM Users WHERE UserID = @userID AND UserType = 'Assistant'");

            await transaction.commit();
            await logAudit(req.user.id, 'DELETE_ASSISTANT', `Deleted assistant ID: ${id}`, req.ip);
            return success(res, { message: "Assistant deleted successfully" });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        return error(res, "Failed to delete assistant", 500, err);
    }
};

/**
 * FETCH STUDENTS
 * Retrieves a list of all registered students.
 */
const getStudents = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT u.UserID, u.UserID AS StudentID, u.FullName, u.Email,
                   s.GPA, s.Academic_Year, s.Major, s.StudentCode
            FROM Users u
            INNER JOIN Students s ON u.UserID = s.UserID
            WHERE u.UserType = 'Student'
        `);
        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch students", 500, err);
    }
};

/**
 * ADD STUDENT
 * Manual registration for students (typically by an instructor).
 */
const addStudent = async (req, res) => {
    const { fullName, email, password, studentCode } = req.body;
    if (!fullName || !email || !password) return badRequest(res, "fullName, email, and password are required.");

    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const existing = await request.input('email', sql.VarChar, email).query('SELECT 1 FROM Users WHERE Email = @email');

            if (existing.recordset.length > 0) {
                await transaction.rollback();
                return badRequest(res, "Email already exists.");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userResult = await request
                .input('fullName', sql.VarChar, fullName)
                .input('emailParam', sql.VarChar, email)
                .input('password', sql.VarChar, hashedPassword)
                .input('userType', sql.VarChar, 'Student')
                .query(`INSERT INTO Users (FullName, Email, Password, UserType) OUTPUT INSERTED.UserID VALUES (@fullName, @emailParam, @password, @userType)`);

            const userID = userResult.recordset[0].UserID;
            // Link to the student profile and store their unique ID code
            await request.input('userID', sql.Int, userID).input('studentCode', sql.VarChar, studentCode || null).query('INSERT INTO Students (UserID, StudentCode) VALUES (@userID, @studentCode)');

            await transaction.commit();
            await logAudit(req.user.id, 'ADD_STUDENT', `Added student: ${fullName} (${email})`, req.ip);

            return success(res, { message: "Student added successfully", userID }, "Success", 201);
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        return error(res, err.message, 500, err);
    }
};

/**
 * DELETE STUDENT
 * Heavy operation: Deletes a student and ALL their related data (Grades, Attendance, Submissions).
 */
const deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('userID', sql.Int, id);

            // Manual cascade: We must clean up every table that references this student's ID
            await request.query('DELETE FROM Submission WHERE StudentID = @userID');
            await request.query('DELETE FROM DiscussionReplies WHERE UserID = @userID');
            await request.query('DELETE FROM DiscussionPosts WHERE UserID = @userID');
            await request.query('DELETE FROM Quiz_Result WHERE StudentID = @userID');
            await request.query('DELETE FROM Attendance WHERE StudentID = @userID');
            await request.query('DELETE FROM Enrollment WHERE StudentID = @userID');
            await request.query('DELETE FROM Course_Grades WHERE StudentID = @userID');
            await request.query('DELETE FROM Students WHERE UserID = @userID');
            await request.query("DELETE FROM Users WHERE UserID = @userID AND UserType = 'Student'");

            await transaction.commit();
            await logAudit(req.user.id, 'DELETE_STUDENT', `Deleted student ID: ${id}`, req.ip);
            return success(res, { message: "Student deleted successfully" });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        return error(res, "Failed to delete student", 500, err);
    }
};

/**
 * ASSIGN ASSISTANT TO COURSE
 * Links an Assistant to a course so they can view students and grade work.
 */
const assignAssistantToCourse = async (req, res) => {
    const { assistantId, courseId } = req.body;
    if (!assistantId || !courseId) return badRequest(res, "assistantId and courseId are required.");

    try {
        const pool = await getPool();
        // Check if the assignment already exists
        const existing = await pool.request()
            .input('assistantID', sql.Int, assistantId)
            .input('courseID', sql.Int, courseId)
            .query('SELECT 1 FROM Course_Assistants WHERE AssistantID = @assistantID AND CourseID = @courseID');

        if (existing.recordset.length > 0) return badRequest(res, "Assistant already assigned to this course.");

        // Create the link
        await pool.request()
            .input('assistantID', sql.Int, assistantId)
            .input('courseID', sql.Int, courseId)
            .query('INSERT INTO Course_Assistants (AssistantID, CourseID) VALUES (@assistantID, @courseID)');

        await logAudit(req.user.id, 'ASSIGN_ASSISTANT', `Assigned assistant ${assistantId} to course ${courseId}`, req.ip);
        return success(res, { message: "Assistant assigned to course successfully" });
    } catch (err) {
        return error(res, "Failed to assign assistant", 500, err);
    }
};

/**
 * ENROLL STUDENT
 * Officially registers a student into a course.
 */
const enrollStudent = async (req, res) => {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) return badRequest(res, "studentId and courseId are required.");

    try {
        const pool = await getPool();
        // 1. Prevent duplicate enrollment
        const existing = await pool.request()
            .input('studentID', sql.Int, studentId)
            .input('courseID', sql.Int, courseId)
            .query('SELECT 1 FROM Enrollment WHERE StudentID = @studentID AND CourseID = @courseID');

        if (existing.recordset.length > 0) return badRequest(res, "Student already enrolled in this course.");

        // 2. Insert record
        await pool.request()
            .input('studentID', sql.Int, studentId)
            .input('courseID', sql.Int, courseId)
            .query('INSERT INTO Enrollment (StudentID, CourseID) VALUES (@studentID, @courseID)');

        // 3. Notification: Alert the student that they've been added to a new course
        try {
            const courseResult = await pool.request().input('cId', sql.Int, courseId).query('SELECT Name FROM Course WHERE CourseID = @cId');
            const courseName = courseResult.recordset[0]?.Name || 'a new course';
            await createNotification(studentId, 'system', `Enrolled in ${courseName}`, `You have been enrolled in ${courseName}.`, `/course/${courseId}`);
        } catch (notifErr) { console.error("Enrollment notification failed:", notifErr.message); }

        await logAudit(req.user.id, 'ENROLL_STUDENT', `Enrolled student ${studentId} in course ${courseId}`, req.ip);
        return success(res, { message: "Student enrolled successfully" });
    } catch (err) {
        return error(res, "Failed to enroll student", 500, err);
    }
};

module.exports = {
    getAssistants,
    addAssistant,
    deleteAssistant,
    assignAssistantToCourse,
    getStudents,
    addStudent,
    deleteStudent,
    enrollStudent
};
