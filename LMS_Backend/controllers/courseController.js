const { sql, getPool } = require('../config/db');
const { createNotification, logAudit, deleteFile } = require('../utils/helpers');
const { success, error, badRequest, forbidden, notFound } = require('../utils/responseHandler');

/**
 * Authorization helper to check if user has access to a course.
 */
const checkCourseAccess = async (pool, courseId, userId, userType) => {
    if (userType === 'Instructor') {
        const check = await pool.request()
            .input('cId', sql.Int, courseId)
            .input('uId', sql.Int, userId)
            .query('SELECT 1 FROM Course WHERE CourseID = @cId AND InstructorID = @uId');
        return check.recordset.length > 0;
    } else if (userType === 'Assistant') {
        const check = await pool.request()
            .input('cId', sql.Int, courseId)
            .input('uId', sql.Int, userId)
            .query('SELECT 1 FROM Course_Assistants WHERE CourseID = @cId AND AssistantID = @uId');
        return check.recordset.length > 0;
    }
    return false;
};

// =============================================
//  COURSE CRUD
// =============================================

const getCourses = async (req, res) => {
    try {
        const pool = await getPool();
        let query = `SELECT c.CourseID, c.Name AS CourseName, c.Max_Marks, u.FullName AS InstructorName FROM Course c LEFT JOIN Users u ON c.InstructorID = u.UserID`;
        if (req.user.type === 'Instructor') {
            // Instructors might want to see ALL courses for some management pages, but let's default to THEIR courses if 'my-courses' is not used
            // Actually, keep it as 'all' for the general list if requested
        }
        const result = await pool.request().query(query);
        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch courses", 500, err);
    }
};

const getMyCourses = async (req, res) => {
    try {
        const pool = await getPool();
        const userId = req.user.id;
        const userType = req.user.type;
        
        let query = "";
        if (userType === 'Instructor') {
            query = `SELECT c.CourseID, c.CourseID as courseId, c.Name AS CourseName, c.Max_Marks, u.FullName AS InstructorName 
                     FROM Course c LEFT JOIN Users u ON c.InstructorID = u.UserID 
                     WHERE c.InstructorID = @uId`;
        } else {
            query = `SELECT c.CourseID, c.CourseID as courseId, c.Name AS CourseName, u.FullName AS InstructorName, 
                     (SELECT COUNT(*) FROM Enrollment WHERE CourseID = c.CourseID) AS StudentCount
                     FROM Course_Assistants ca
                     INNER JOIN Course c ON ca.CourseID = c.CourseID
                     LEFT JOIN Users u ON c.InstructorID = u.UserID
                     WHERE ca.AssistantID = @uId`;
        }
        
        const result = await pool.request().input('uId', sql.Int, userId).query(query);
        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch your courses", 500, err);
    }
};

const createCourse = async (req, res) => {
    const { name, maxMarks } = req.body;
    if (!name) return badRequest(res, "Course name is required.");

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('name', sql.VarChar, name)
            .input('maxMarks', sql.Int, maxMarks || 100)
            .input('instructorID', sql.Int, req.user.id)
            .query(`INSERT INTO Course (Name, Max_Marks, InstructorID) OUTPUT INSERTED.CourseID VALUES (@name, @maxMarks, @instructorID)`);

        const courseID = result.recordset[0].CourseID;
        await logAudit(req.user.id, 'CREATE_COURSE', `Created course: ${name} (ID: ${courseID})`, req.ip);
        return success(res, { message: "Course created successfully", courseID }, "Success", 201);
    } catch (err) {
        return error(res, "Failed to create course", 500, err);
    }
};

const deleteCourse = async (req, res) => {
    const courseId = req.params.id;
    try {
        const pool = await getPool();
        // Only instructors can delete their own courses
        const check = await pool.request().input('cId', sql.Int, courseId).input('uId', sql.Int, req.user.id).query('SELECT 1 FROM Course WHERE CourseID = @cId AND InstructorID = @uId');
        if (check.recordset.length === 0) return forbidden(res, "Unauthorized or course not found.");

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const request = new sql.Request(transaction);
            request.input('courseId', sql.Int, courseId);
            // Cascading deletes for tables without formal foreign key constraints
            await request.query('DELETE FROM CourseMaterials WHERE CourseID = @courseId');
            await request.query('DELETE FROM Announcements WHERE CourseID = @courseId');
            await request.query('DELETE FROM DiscussionReplies WHERE PostID IN (SELECT PostID FROM DiscussionPosts WHERE CourseID = @courseId)');
            await request.query('DELETE FROM DiscussionPosts WHERE CourseID = @courseId');
            await request.query('DELETE FROM Course_Assistants WHERE CourseID = @courseId');
            await request.query('DELETE FROM Enrollment WHERE CourseID = @courseId');
            await request.query('DELETE FROM Course WHERE CourseID = @courseId');

            await transaction.commit();
            await logAudit(req.user.id, 'DELETE_COURSE', `Deleted course ID: ${courseId}`, req.ip);
            return success(res, { message: "Course deleted successfully" });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        return error(res, "Failed to delete course", 500, err);
    }
};

// =============================================
//  COURSE CONTENT (Weeks, Materials, Lectures)
// =============================================

const getCourseContent = async (req, res) => {
    const { courseId } = req.params;
    try {
        const pool = await getPool();
        const hasAccess = await checkCourseAccess(pool, courseId, req.user.id, req.user.type);
        if (!hasAccess && req.user.type !== 'Student') { // Students have separate route or check
             // Actually, for Instructor/Assistant portals, check access.
        }

        // 1. Course Info
        const courseRes = await pool.request().input('cId', sql.Int, courseId).query('SELECT c.*, u.FullName AS InstructorName FROM Course c LEFT JOIN Users u ON c.InstructorID = u.UserID WHERE c.CourseID = @cId');
        if (courseRes.recordset.length === 0) return notFound(res, "Course not found.");

        // 2. Weeks + Materials + Lectures
        const weeksRes = await pool.request().input('cId', sql.Int, courseId).query('SELECT Week_ID AS WeekID, Week_Number AS WeekNumber, Title, StartDate, EndDate FROM StudyWeek WHERE CourseID = @cId ORDER BY Week_Number');
        const weeks = [];
        for (const week of weeksRes.recordset) {
            const mats = await pool.request().input('wId', sql.Int, week.WeekID).query('SELECT Material_ID AS MaterialID, Title, Type, FileURL FROM Material WHERE Week_ID = @wId');
            const lecs = await pool.request().input('wId', sql.Int, week.WeekID).query('SELECT LectureID, Title, Date, Start_Time, End_Time FROM Lecture WHERE Week_ID = @wId ORDER BY Date');
            weeks.push({ ...week, materials: mats.recordset, lectures: lecs.recordset });
        }

        // 3. Stats
        const enrolled = await pool.request().input('cId', sql.Int, courseId).query('SELECT COUNT(*) AS total FROM Enrollment WHERE CourseID = @cId');
        const assignments = await pool.request()
            .input('cId', sql.Int, courseId)
            .query(`
                SELECT a.*, 
                       (SELECT COUNT(*) FROM Submission s WHERE s.AssignmentID = a.AssignmentID) as SubmissionCount,
                       (SELECT COUNT(*) FROM Submission s WHERE s.AssignmentID = a.AssignmentID AND s.Score IS NOT NULL) as GradedCount
                FROM Assignment a 
                WHERE a.CourseID = @cId 
                ORDER BY a.Deadline
            `);

        return success(res, {
            course: courseRes.recordset[0],
            weeks,
            assignments: assignments.recordset,
            enrolledCount: enrolled.recordset[0].total
        });
    } catch (err) {
        return error(res, "Failed to fetch course content", 500, err);
    }
};

const addWeek = async (req, res) => {
    const { courseId, weekNumber, title } = req.body;
    try {
        const pool = await getPool();
        if (!await checkCourseAccess(pool, courseId, req.user.id, req.user.type)) return forbidden(res);
        const result = await pool.request().input('cId', sql.Int, courseId).input('wn', sql.Int, weekNumber).input('t', sql.VarChar, title).query('INSERT INTO StudyWeek (CourseID, Week_Number, Title) OUTPUT INSERTED.Week_ID VALUES (@cId, @wn, @t)');
        return success(res, { message: "Week added", weekID: result.recordset[0].Week_ID });
    } catch (err) { return error(res, "Failed to add week", 500, err); }
};

const deleteWeek = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        await pool.request().input('id', sql.Int, id).query('DELETE FROM StudyWeek WHERE Week_ID = @id');
        return success(res, { message: "Week deleted" });
    } catch (err) { return error(res, "Failed to delete week", 500, err); }
};

const addMaterial = async (req, res) => {
    const { weekId, title, fileType, url } = req.body;
    try {
        const pool = await getPool();
        
        let finalUrl = url || null;
        let finalType = fileType || 'document';

        if (req.file) {
            finalUrl = `/uploads/materials/${req.file.filename}`;
            if (req.file.mimetype.includes('pdf')) finalType = 'PDF';
            else if (req.file.mimetype.includes('image')) finalType = 'Image';
            else if (req.file.mimetype.includes('video')) finalType = 'Video';
            else finalType = 'File';
        } else if (url) {
            // If it's a URL, detect if it's a video or document
            if (url.includes('youtube.com') || url.includes('vimeo.com') || url.match(/\.(mp4|webm|ogg)$/i)) {
                finalType = 'Video';
            } else {
                finalType = 'URL';
            }
        }

        if (!finalUrl) {
            return badRequest(res, "Either a file or a URL is required.");
        }

        await pool.request()
            .input('wId', sql.Int, weekId)
            .input('t', sql.VarChar, title)
            .input('type', sql.VarChar, finalType)
            .input('url', sql.VarChar, finalUrl)
            .input('uId', sql.Int, req.user.id)
            .query('INSERT INTO Material (Week_ID, Title, Type, FileURL, Created_By) VALUES (@wId, @t, @type, @url, @uId)');
            
        return success(res, { message: "Material added successfully" });
    } catch (err) { 
        return error(res, "Failed to add material", 500, err); 
    }
};

const deleteMaterial = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        const mat = await pool.request().input('id', sql.Int, id).query('SELECT FileURL FROM Material WHERE Material_ID = @id');
        if (mat.recordset.length > 0 && mat.recordset[0].FileURL) deleteFile(mat.recordset[0].FileURL);
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Material WHERE Material_ID = @id');
        return success(res, { message: "Material deleted" });
    } catch (err) { return error(res, "Failed to delete material", 500, err); }
};

const addLecture = async (req, res) => {
    const { courseId, title, date, startTime, endTime, weekId } = req.body;
    try {
        const pool = await getPool();
        await pool.request().input('t', sql.VarChar, title).input('d', sql.Date, date).input('s', sql.VarChar, startTime).input('e', sql.VarChar, endTime).input('cId', sql.Int, courseId).input('uId', sql.Int, req.user.id).input('wId', sql.Int, weekId).query('INSERT INTO Lecture (Title, Date, Start_Time, End_Time, CourseID, InstructorID, Week_ID) VALUES (@t, @d, @s, @e, @cId, @uId, @wId)');
        return success(res, { message: "Lecture added" });
    } catch (err) { return error(res, "Failed to add lecture", 500, err); }
};

const deleteLecture = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Lecture WHERE LectureID = @id');
        return success(res, { message: "Lecture deleted" });
    } catch (err) { return error(res, "Failed to delete lecture", 500, err); }
};

// =============================================
//  ADDITIONAL COURSE MATERIALS (Standalone)
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
        return success(res, result.recordset);
    } catch (err) {
        return error(res, "Failed to fetch materials", 500, err);
    }
};

const uploadCourseMaterial = async (req, res) => {
    try {
        const { courseId, title, description, fileType } = req.body;
        const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : (req.body.fileUrl || null);
        const uploadedBy = req.user.id;

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

        return success(res, { message: "Material uploaded successfully" }, "Created", 201);
    } catch (err) {
        return error(res, "Failed to upload material", 500, err);
    }
};

const deleteCourseMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

        const materialRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT FileUrl FROM CourseMaterials WHERE MaterialID = @id');
        
        if (materialRes.recordset.length > 0) {
            const fileUrl = materialRes.recordset[0].FileUrl;
            if (fileUrl) deleteFile(fileUrl);
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM CourseMaterials WHERE MaterialID = @id');

        return success(res, { message: "Material deleted successfully" });
    } catch (err) {
        return error(res, "Failed to delete material", 500, err);
    }
};

// =============================================
//  ANNOUNCEMENTS
// =============================================

const getAnnouncements = async (req, res) => {
    const { courseId } = req.params;
    try {
        const pool = await getPool();
        const result = await pool.request().input('cId', sql.Int, courseId).query('SELECT a.*, u.FullName AS PosterName FROM Announcements a INNER JOIN Users u ON a.PostedBy = u.UserID WHERE a.CourseID = @cId ORDER BY a.CreatedAt DESC');
        return success(res, result.recordset);
    } catch (err) { return error(res, "Failed to fetch announcements", 500, err); }
};

const createAnnouncement = async (req, res) => {
    const { courseId, title, content } = req.body;
    try {
        const pool = await getPool();
        if (!await checkCourseAccess(pool, courseId, req.user.id, req.user.type)) return forbidden(res);
        await pool.request().input('cId', sql.Int, courseId).input('t', sql.VarChar, title).input('c', sql.VarChar, content).input('uId', sql.Int, req.user.id).query('INSERT INTO Announcements (CourseID, Title, Content, PostedBy) VALUES (@cId, @t, @c, @uId)');
        
        // Notify students
        const students = await pool.request().input('cId', sql.Int, courseId).query('SELECT StudentID FROM Enrollment WHERE CourseID = @cId');
        for (const s of students.recordset) {
            await createNotification(s.StudentID, 'announcement', `New Announcement: ${title}`, content.substring(0, 50), `/course/${courseId}`);
        }
        return success(res, { message: "Announcement posted" });
    } catch (err) { return error(res, "Failed to post announcement", 500, err); }
};

const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getPool();
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Announcements WHERE AnnouncementID = @id');
        return success(res, { message: "Announcement deleted" });
    } catch (err) { return error(res, "Failed to delete announcement", 500, err); }
};

// =============================================
//  PARTICIPANTS & GRADES
// =============================================

const getCourseParticipants = async (req, res) => {
    const { courseId } = req.params;
    try {
        const pool = await getPool();
        const result = await pool.request().input('cId', sql.Int, courseId).query(`
            SELECT DISTINCT u.UserID, u.FullName, u.Email, u.UserType, s.Major, s.StudentCode,
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

const getCourseGrades = async (req, res) => {
    const { courseId } = req.params;
    try {
        const pool = await getPool();
        const result = await pool.request().input('cId', sql.Int, courseId).query(`
            SELECT u.FullName, u.Email, cg.GradeID, cg.StudentID, cg.CourseID,
                   cg.AssignmentTotal,
                   cg.QuizTotal,
                   cg.AttendanceTotal,
                   cg.FinalGrade,
                   (cg.AssignmentTotal + cg.QuizTotal + cg.AttendanceTotal + cg.FinalGrade) AS TotalScore
            FROM Course_Grades cg 
            INNER JOIN Users u ON cg.StudentID = u.UserID 
            WHERE cg.CourseID = @cId
        `);
        return success(res, result.recordset);
    } catch (err) { return error(res, "Failed to fetch grades", 500, err); }
};

// =============================================
//  ATTENDANCE & QUIZZES
// =============================================

const getCourseAttendance = async (req, res) => {
    const { courseId } = req.params;
    try {
        const pool = await getPool();
        const result = await pool.request().input('cId', sql.Int, courseId).query(`
            SELECT l.LectureID, l.Title, l.Date, 
                   u.UserID as StudentID, u.FullName as StudentName, 
                   a.Status, a.Score
            FROM Lecture l
            INNER JOIN Enrollment e ON l.CourseID = e.CourseID
            INNER JOIN Users u ON e.StudentID = u.UserID
            LEFT JOIN Attendance a ON l.LectureID = a.LectureID AND u.UserID = a.StudentID
            WHERE l.CourseID = @cId
            ORDER BY l.Date DESC, u.FullName ASC
        `);
        return success(res, result.recordset);
    } catch (err) { return error(res, "Failed to fetch attendance", 500, err); }
};

const markAttendance = async (req, res) => {
    const { lectureId, studentId, status, score } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('lId', sql.Int, lectureId)
            .input('sId', sql.Int, studentId)
            .input('status', sql.VarChar, status)
            .input('score', sql.Decimal(5, 2), score || null)
            .query(`
                IF EXISTS (SELECT 1 FROM Attendance WHERE LectureID = @lId AND StudentID = @sId)
                    UPDATE Attendance SET Status = @status, Score = @score WHERE LectureID = @lId AND StudentID = @sId
                ELSE
                    INSERT INTO Attendance (LectureID, StudentID, Status, Score) VALUES (@lId, @sId, @status, @score)
            `);
        return success(res, { message: "Attendance recorded" });
    } catch (err) { return error(res, "Failed to mark attendance", 500, err); }
};

const getCourseQuizzes = async (req, res) => {
    const { courseId } = req.params;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('cId', sql.Int, courseId)
            .input('uId', sql.Int, req.user.id)
            .query(`
                SELECT q.*, r.Score as StudentScore
                FROM Quizzes q
                LEFT JOIN Quiz_Result r ON q.QuizID = r.QuizID AND r.StudentID = @uId
                WHERE q.CourseID = @cId
            `);
        return success(res, result.recordset);
    } catch (err) { return error(res, "Failed to fetch quizzes", 500, err); }
};

module.exports = {
    getCourses, getMyCourses, createCourse, deleteCourse,
    getCourseContent, addWeek, deleteWeek, addMaterial, deleteMaterial, addLecture, deleteLecture,
    getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    getCourseParticipants, getCourseGrades,
    getCourseAttendance, markAttendance, getCourseQuizzes
};
