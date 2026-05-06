const { sql, getPool } = require('../config/db');
const { success, error, badRequest, notFound } = require('../utils/responseHandler');

/**
 * GET /api/student/dashboard
 */
const getDashboard = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();

        const userResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT u.FullName, u.Email, s.GPA, s.Academic_Year, s.Major, s.StudentCode
                FROM Users u
                INNER JOIN Students s ON u.UserID = s.UserID
                WHERE u.UserID = @userID
            `);

        if (userResult.recordset.length === 0) return notFound(res, "Student not found.");

        const student = userResult.recordset[0];
        const coursesResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query('SELECT COUNT(*) AS courseCount FROM Enrollment WHERE StudentID = @userID');

        const pendingResult = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT COUNT(*) AS pendingCount
                FROM Assignment a
                INNER JOIN Enrollment e ON a.CourseID = e.CourseID AND e.StudentID = @userID
                LEFT JOIN Submission s ON s.AssignmentID = a.AssignmentID AND s.StudentID = @userID
                WHERE s.SubID IS NULL
            `);

        return success(res, {
            fullName: student.FullName,
            email: student.Email,
            gpa: student.GPA,
            studentCode: student.StudentCode,
            academicYear: student.Academic_Year,
            major: student.Major,
            courseCount: coursesResult.recordset[0].courseCount,
            pendingTasks: pendingResult.recordset[0].pendingCount
        });
    } catch (err) {
        return error(res, "Failed to load dashboard", 500, err);
    }
};

/**
 * GET /api/student/courses
 */
const getMyCourses = async (req, res) => {
    try {
        const userID = req.user.id;
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

        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch courses", 500, err);
    }
};

/**
 * GET /api/student/courses/:courseId/content
 */
const getCourseContent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userID = req.user.id;
        const pool = await getPool();

        // Weeks + Materials + Lectures
        const weeksRes = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query('SELECT Week_ID AS WeekID, Week_Number AS WeekNumber, Title FROM StudyWeek WHERE CourseID = @courseID ORDER BY Week_Number');

        const weeks = [];
        for (const week of weeksRes.recordset) {
            const mats = await pool.request().input('wId', sql.Int, week.WeekID).query('SELECT Material_ID AS MaterialID, Title, Type, FileURL FROM Material WHERE Week_ID = @wId');
            const lecs = await pool.request().input('wId', sql.Int, week.WeekID).query('SELECT LectureID, Title, Date, Start_Time, End_Time FROM Lecture WHERE Week_ID = @wId ORDER BY Date');
            weeks.push({ ...week, materials: mats.recordset, lectures: lecs.recordset });
        }

        // Course Info
        const courseRes = await pool.request().input('cId', sql.Int, courseId).query('SELECT c.*, u.FullName AS InstructorName FROM Course c LEFT JOIN Users u ON c.InstructorID = u.UserID WHERE c.CourseID = @cId');
        if (courseRes.recordset.length === 0) return notFound(res, "Course not found.");

        const assignments = await pool.request().input('cId', sql.Int, courseId).query('SELECT * FROM Assignment WHERE CourseID = @cId ORDER BY Deadline');

        return success(res, { course: courseRes.recordset[0], weeks, assignments: assignments.recordset });
    } catch (err) {
        return error(res, "Failed to fetch course content", 500, err);
    }
};

/**
 * GET /api/student/assignments
 */
const getAssignments = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT a.AssignmentID, a.Title, a.Deadline, a.Max_Score, c.Name AS CourseName,
                       CASE WHEN s.SubID IS NOT NULL THEN 'Submitted' ELSE 'Pending' END AS Status,
                       s.Score, s.SubmittedAt
                FROM Assignment a
                INNER JOIN Enrollment e ON a.CourseID = e.CourseID
                INNER JOIN Course c ON a.CourseID = c.CourseID
                LEFT JOIN Submission s ON s.AssignmentID = a.AssignmentID AND s.StudentID = @userID
                WHERE e.StudentID = @userID
                ORDER BY a.Deadline ASC
            `);

        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch assignments", 500, err);
    }
};

/**
 * POST /api/student/assignments/submit
 */
const submitAssignment = async (req, res) => {
    try {
        const { assignmentId, submissionContent } = req.body;
        const userID = req.user.id;
        const filePath = req.file ? `/uploads/submissions/${req.file.filename}` : null;

        if (!assignmentId) return badRequest(res, "assignmentId is required.");

        const pool = await getPool();

        // Check if already submitted
        const existing = await pool.request()
            .input('aId', sql.Int, assignmentId)
            .input('sId', sql.Int, userID)
            .query('SELECT 1 FROM Submission WHERE AssignmentID = @aId AND StudentID = @sId');

        if (existing.recordset.length > 0) return badRequest(res, "You have already submitted this assignment.");

        await pool.request()
            .input('aId', sql.Int, assignmentId)
            .input('sId', sql.Int, userID)
            .input('path', sql.VarChar, filePath)
            .input('content', sql.VarChar, submissionContent || '')
            .query(`INSERT INTO Submission (AssignmentID, StudentID, FilePath, SubmissionContent) 
                    VALUES (@aId, @sId, @path, @content)`);

        return success(res, { message: "Assignment submitted successfully" });
    } catch (err) {
        return error(res, "Failed to submit assignment", 500, err);
    }
};

/**
 * GET /api/student/grades
 */
const getGrades = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();

        const result = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT c.CourseID, c.CourseID as courseId, c.Name AS CourseName, 
                       cg.AttendanceTotal AS Attendance_Grade, 
                       cg.QuizTotal AS Midterm_Grade, 
                       cg.AssignmentTotal AS Practical_Grade, 
                       cg.FinalGrade AS Final_Grade,
                       (cg.AttendanceTotal + cg.QuizTotal + cg.AssignmentTotal + cg.FinalGrade) AS TotalScore
                FROM Course_Grades cg
                INNER JOIN Course c ON cg.CourseID = c.CourseID
                WHERE cg.StudentID = @userID
            `);

        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch grades", 500, err);
    }
};

/**
 * GET /api/student/courses/:courseId/materials
 */
const getCourseMaterials = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();
        const result = await pool.request()
            .input('cId', sql.Int, courseId)
            .query('SELECT * FROM CourseMaterials WHERE CourseID = @cId ORDER BY CreatedAt DESC');
        return success(res, result.recordset);
    } catch (err) { return error(res, "Failed to fetch materials", 500, err); }
};

/**
 * GET /api/student/courses/:courseId/announcements
 */
const getCourseAnnouncements = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();
        const result = await pool.request()
            .input('cId', sql.Int, courseId)
            .query('SELECT a.*, u.FullName AS PosterName FROM Announcements a INNER JOIN Users u ON a.PostedBy = u.UserID WHERE a.CourseID = @cId ORDER BY a.CreatedAt DESC');
        return success(res, result.recordset);
    } catch (err) { return error(res, "Failed to fetch announcements", 500, err); }
};

/**
 * GET /api/student/calendar
 */
const getCalendarEvents = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();

        const assignments = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT a.Title, a.Deadline AS Date, 'assignment' AS Type, c.Name AS CourseName,
                       CASE WHEN s.SubID IS NOT NULL THEN 1 ELSE 0 END AS IsSubmitted
                FROM Assignment a
                INNER JOIN Enrollment e ON a.CourseID = e.CourseID
                INNER JOIN Course c ON a.CourseID = c.CourseID
                LEFT JOIN Submission s ON s.AssignmentID = a.AssignmentID AND s.StudentID = @userID
                WHERE e.StudentID = @userID
            `);

        const lectures = await pool.request()
            .input('userID', sql.Int, userID)
            .query(`
                SELECT l.Title, l.Date, 'lecture' AS Type, c.Name AS CourseName,
                       0 AS IsSubmitted
                FROM Lecture l
                INNER JOIN Enrollment e ON l.CourseID = e.CourseID
                INNER JOIN Course c ON l.CourseID = c.CourseID
                WHERE e.StudentID = @userID
            `);

        return success(res, [...assignments.recordset, ...lectures.recordset]);
    } catch (err) {
        return error(res, "Failed to fetch calendar events", 500, err);
    }
};

/**
 * PUT /api/student/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const userID = req.user.id;
        const pool = await getPool();

        await pool.request()
            .input('userID', sql.Int, userID)
            .input('fullName', sql.VarChar, fullName)
            .input('email', sql.VarChar, email)
            .query('UPDATE Users SET FullName = ISNULL(@fullName, FullName), Email = ISNULL(@email, Email) WHERE UserID = @userID');

        return success(res, { message: "Profile updated successfully" });
    } catch (err) {
        return error(res, "Failed to update profile", 500, err);
    }
};

/**
 * GET /api/student/courses/:courseId/participants
 */
const getCourseParticipants = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();
        const result = await pool.request()
            .input('cId', sql.Int, courseId)
            .query(`
                SELECT DISTINCT u.UserID, u.FullName, u.Email, u.UserType, u.ProfilePicture, s.Major,
                       CASE WHEN u.UserType = 'Instructor' THEN 1 ELSE 0 END as IsInstructor,
                       CASE WHEN u.UserType = 'Assistant' THEN 1 ELSE 0 END as IsAssistant
                FROM Users u 
                LEFT JOIN Students s ON u.UserID = s.UserID
                WHERE u.UserID IN (
                    SELECT InstructorID FROM Course WHERE CourseID = @cId
                    UNION
                    SELECT AssistantID FROM Course_Assistants WHERE CourseID = @cId
                    UNION
                    SELECT StudentID FROM Enrollment WHERE CourseID = @cId
                )
                ORDER BY IsInstructor DESC, IsAssistant DESC, u.FullName ASC
            `);
        return success(res, result.recordset);
    } catch (err) { return error(res, "Failed to fetch participants", 500, err); }
};

module.exports = {
    getDashboard, getMyCourses, getCourseContent, getAssignments, submitAssignment,
    getGrades, getCourseMaterials, getCourseAnnouncements, getCalendarEvents, updateProfile, getCourseParticipants
};
