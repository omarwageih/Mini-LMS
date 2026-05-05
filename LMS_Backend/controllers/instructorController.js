const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { createNotification, logAudit, deleteFile } = require('../utils/helpers');

// =============================================
//  ASSISTANTS MANAGEMENT
// =============================================

// GET all assistants
const getAssistants = async (req, res) => {
    console.log("GET /api/instructor/assistants called. User:", req.user);
    if (!req.user || req.user.type !== 'Instructor') {
        console.error("Unauthorized role access attempt to getAssistants:", req.user?.type);
        return res.status(403).json({ message: "Access denied. Instructor role required." });
    }
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT u.UserID, u.UserID AS AssistantID, u.FullName, u.Email, a.Office_Location
            FROM Users u
            INNER JOIN Assistants a ON u.UserID = a.UserID
            WHERE u.UserType = 'Assistant'
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("GET Assistants Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching assistants." });
    }
};

// ADD assistant (create user + link to Assistants)
const addAssistant = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "fullName, email, and password are required." });
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // Check if email already exists
            const existing = await request
                .input('email', sql.VarChar, email)
                .query('SELECT * FROM Users WHERE Email = @email');

            if (existing.recordset.length > 0) {
                await transaction.rollback();
                return res.status(400).json({ message: "Email already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into Users
            const userResult = await request
                .input('fullName', sql.VarChar, fullName)
                .input('emailParam', sql.VarChar, email)
                .input('password', sql.VarChar, hashedPassword)
                .input('userType', sql.VarChar, 'Assistant')
                .query(`
                    INSERT INTO Users (FullName, Email, Password, UserType)
                    OUTPUT INSERTED.UserID
                    VALUES (@fullName, @emailParam, @password, @userType)
                `);

            const userID = userResult.recordset[0].UserID;

            // Insert into Assistants (UserID is PK)
            await request
                .input('userID', sql.Int, userID)
                .query('INSERT INTO Assistants (UserID) VALUES (@userID)');

            await transaction.commit();
            await logAudit(req.user.id, 'ADD_ASSISTANT', `Added assistant: ${fullName} (${email})`, req.ip);

            res.json({ message: "Assistant added successfully", userID });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        console.error("Add Assistant Error details:", err.message, err.code, err.number);
        res.status(500).json({ message: err.message || "An internal server error occurred while adding assistant." });
    }
};

// DELETE assistant
const deleteAssistant = async (req, res) => {
    try {
        const { id } = req.params; // id = UserID
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('userID', sql.Int, id);

            // Delete from Course_Assistants first (FK)
            await request.query('DELETE FROM Course_Assistants WHERE AssistantID = @userID');

            // Delete from Assistants (PK = UserID)
            await request.query('DELETE FROM Assistants WHERE UserID = @userID');

            // Delete from Users
            await request.query("DELETE FROM Users WHERE UserID = @userID AND UserType = 'Assistant'");

            await transaction.commit();
            await logAudit(req.user.id, 'DELETE_ASSISTANT', `Deleted assistant with UserID: ${id}`, req.ip);
            res.json({ message: "Assistant deleted successfully" });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        console.error("Delete Assistant Error:", err);
        res.status(500).json({ message: "An internal server error occurred while deleting assistant." });
    }
};

// ASSIGN assistant to course
const assignAssistantToCourse = async (req, res) => {
    try {
        const { assistantId, courseId } = req.body;
        // assistantId = UserID of assistant

        if (!assistantId || !courseId) {
            return res.status(400).json({ message: "assistantId and courseId are required." });
        }

        const pool = await getPool();

        // Check if already assigned
        const existing = await pool.request()
            .input('assistantID', sql.Int, assistantId)
            .input('courseID', sql.Int, courseId)
            .query('SELECT * FROM Course_Assistants WHERE AssistantID = @assistantID AND CourseID = @courseID');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: "Assistant already assigned to this course." });
        }

        await pool.request()
            .input('assistantID', sql.Int, assistantId)
            .input('courseID', sql.Int, courseId)
            .query('INSERT INTO Course_Assistants (AssistantID, CourseID) VALUES (@assistantID, @courseID)');

        await logAudit(req.user.id, 'ASSIGN_ASSISTANT', `Assigned assistant ${assistantId} to course ${courseId}`, req.ip);

        res.json({ message: "Assistant assigned to course successfully" });
    } catch (err) {
        console.error("Assign Assistant Error:", err);
        res.status(500).json({ message: "An internal server error occurred while assigning assistant." });
    }
};

// =============================================
//  STUDENTS MANAGEMENT
// =============================================

// GET all students
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
        res.json(result.recordset);
    } catch (err) {
        console.error("Get Students Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching students." });
    }
};

// ADD student
const addStudent = async (req, res) => {
    try {
        const { fullName, email, password, studentCode } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "fullName, email, and password are required." });
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // Check if email already exists
            const existing = await request
                .input('email', sql.VarChar, email)
                .query('SELECT * FROM Users WHERE Email = @email');

            if (existing.recordset.length > 0) {
                await transaction.rollback();
                return res.status(400).json({ message: "Email already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert into Users
            const userResult = await request
                .input('fullName', sql.VarChar, fullName)
                .input('emailParam', sql.VarChar, email)
                .input('password', sql.VarChar, hashedPassword)
                .input('userType', sql.VarChar, 'Student')
                .query(`
                    INSERT INTO Users (FullName, Email, Password, UserType)
                    OUTPUT INSERTED.UserID
                    VALUES (@fullName, @emailParam, @password, @userType)
                `);

            const userID = userResult.recordset[0].UserID;

            // Insert into Students (UserID is PK)
            await request
                .input('userID', sql.Int, userID)
                .input('studentCode', sql.VarChar, studentCode || null)
                .query('INSERT INTO Students (UserID, StudentCode) VALUES (@userID, @studentCode)');

            await transaction.commit();
            await logAudit(req.user.id, 'ADD_STUDENT', `Added student: ${fullName} (${email})`, req.ip);

            res.json({ message: "Student added successfully", userID });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        console.error("Add Student Error:", err);
        res.status(500).json({ message: err.message || "An internal server error occurred while adding student." });
    }
};

// DELETE student
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params; // id = UserID
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('userID', sql.Int, id);

            // Delete related submissions first
            await request.query('DELETE FROM Submission WHERE StudentID = @userID');

            // Delete from DiscussionReplies (UserID)
            await request.query('DELETE FROM DiscussionReplies WHERE UserID = @userID');

            // Delete from DiscussionPosts (UserID)
            await request.query('DELETE FROM DiscussionPosts WHERE UserID = @userID');

            // Delete from Quiz_Result
            await request.query('DELETE FROM Quiz_Result WHERE StudentID = @userID');

            // Delete from Attendance
            await request.query('DELETE FROM Attendance WHERE StudentID = @userID');

            // Delete from Enrollment
            await request.query('DELETE FROM Enrollment WHERE StudentID = @userID');

            // Delete from Course_Grades
            await request.query('DELETE FROM Course_Grades WHERE StudentID = @userID');

            // Delete from Students (PK = UserID)
            await request.query('DELETE FROM Students WHERE UserID = @userID');

            // Delete from Users
            await request.query("DELETE FROM Users WHERE UserID = @userID AND UserType = 'Student'");

            await transaction.commit();
            await logAudit(req.user.id, 'DELETE_STUDENT', `Deleted student with UserID: ${id}`, req.ip);
            res.json({ message: "Student deleted successfully" });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (err) {
        console.error("Delete Student Error:", err.message, err.stack);
        res.status(500).json({ message: "An internal server error occurred while deleting student.", error: err.message });
    }
};

// ENROLL student in course
const enrollStudent = async (req, res) => {
    try {
        const { studentId, courseId } = req.body;
        // studentId = UserID of student

        if (!studentId || !courseId) {
            return res.status(400).json({ message: "studentId and courseId are required." });
        }

        const pool = await getPool();

        // Check if already enrolled
        const existing = await pool.request()
            .input('studentID', sql.Int, studentId)
            .input('courseID', sql.Int, courseId)
            .query('SELECT * FROM Enrollment WHERE StudentID = @studentID AND CourseID = @courseID');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: "Student already enrolled in this course." });
        }

        await pool.request()
            .input('studentID', sql.Int, studentId)
            .input('courseID', sql.Int, courseId)
            .query('INSERT INTO Enrollment (StudentID, CourseID) VALUES (@studentID, @courseID)');

        // Notify student
        try {
            const courseResult = await pool.request()
                .input('cId', sql.Int, courseId)
                .query('SELECT Name FROM Course WHERE CourseID = @cId');
            const courseName = courseResult.recordset[0]?.Name || 'a new course';
            
            await createNotification(
                studentId,
                'system',
                `Enrolled in ${courseName}`,
                `You have been enrolled in ${courseName}. You can now access the course content.`,
                `/course/${courseId}`
            );
        } catch (notifErr) {
            console.error("Enrollment notification failed:", notifErr.message);
        }

        await logAudit(req.user.id, 'ENROLL_STUDENT', `Enrolled student ${studentId} in course ${courseId}`, req.ip);

        res.json({ message: "Student enrolled successfully" });
    } catch (err) {
        console.error("Enroll Student Error:", err);
        res.status(500).json({ message: "An internal server error occurred while enrolling student." });
    }
};

// =============================================
//  COURSES MANAGEMENT
// =============================================

// GET all courses
const getCourses = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT c.CourseID, c.Name AS CourseName, c.Max_Marks,
                   u.FullName AS InstructorName
            FROM Course c
            LEFT JOIN Users u ON c.InstructorID = u.UserID
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Get Courses Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching courses." });
    }
};

// CREATE course
const createCourse = async (req, res) => {
    try {
        const { name, maxMarks } = req.body;
        const instructorID = req.user.id;

        if (!name) {
            return res.status(400).json({ message: "name is required." });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('name', sql.VarChar, name)
            .input('maxMarks', sql.Int, maxMarks || 100)
            .input('instructorID', sql.Int, instructorID)
            .query(`
                INSERT INTO Course (Name, Max_Marks, InstructorID)
                OUTPUT INSERTED.CourseID
                VALUES (@name, @maxMarks, @instructorID)
            `);

        const courseID = result.recordset[0].CourseID;
        await logAudit(req.user.id, 'CREATE_COURSE', `Created course: ${name} (ID: ${courseID})`, req.ip);

        res.json({ message: "Course created successfully", courseID });
    } catch (err) {
        console.error("Create Course Error:", err);
        res.status(500).json({ message: "An internal server error occurred while creating course." });
    }
};

// =============================================
//  CONTENT MANAGEMENT (Weeks, Materials, Lectures)
// =============================================

// ADD week to course
const addWeek = async (req, res) => {
    try {
        const { courseId, weekNumber, title } = req.body;

        if (!courseId || !weekNumber || !title) {
            return res.status(400).json({ message: "courseId, weekNumber, and title are required." });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('courseID', sql.Int, courseId)
            .input('weekNumber', sql.Int, weekNumber)
            .input('title', sql.VarChar, title)
            .query(`
                INSERT INTO StudyWeek (CourseID, Week_Number, Title)
                OUTPUT INSERTED.Week_ID
                VALUES (@courseID, @weekNumber, @title)
            `);

        res.json({ message: "Week added successfully", weekID: result.recordset[0].Week_ID });
    } catch (err) {
        console.error("Add Week Error:", err);
        res.status(500).json({ message: "An internal server error occurred while adding week." });
    }
};

// ADD material to week
const addMaterial = async (req, res) => {
    try {
        const { weekId, title } = req.body;
        const createdBy = req.user.id;

        if (!weekId || !title) {
            return res.status(400).json({ message: "weekId and title are required." });
        }

        let fileUrl = null;
        let type = 'Text';
        if (req.file) {
            fileUrl = `/uploads/materials/${req.file.filename}`;
            const mime = req.file.mimetype;
            if (mime.includes('pdf')) type = 'PDF';
            else if (mime.includes('image')) type = 'Image';
            else if (mime.includes('video')) type = 'Video';
            else type = 'File';
        }

        const pool = await getPool();
        await pool.request()
            .input('weekID', sql.Int, weekId)
            .input('title', sql.VarChar, title)
            .input('type', sql.VarChar, type)
            .input('fileUrl', sql.VarChar, fileUrl)
            .input('createdBy', sql.Int, createdBy)
            .query('INSERT INTO Material (Week_ID, Title, Type, FileURL, Created_By) VALUES (@weekID, @title, @type, @fileUrl, @createdBy)');

        res.json({ message: "Material added successfully" });
    } catch (err) {
        console.error("Add Material Error:", err.message, err.stack);
        res.status(500).json({ message: "An internal server error occurred while adding material.", error: err.message });
    }
};

// ADD lecture
const addLecture = async (req, res) => {
    try {
        const { courseId, title, date, startTime, endTime, weekId } = req.body;
        const instructorID = req.user.id;

        if (!courseId || !title || !date) {
            return res.status(400).json({ message: "courseId, title, and date are required." });
        }

        const pool = await getPool();
        await pool.request()
            .input('title', sql.VarChar, title)
            .input('date', sql.Date, date)
            .input('startTime', sql.VarChar, startTime || null)
            .input('endTime', sql.VarChar, endTime || null)
            .input('courseID', sql.Int, courseId)
            .input('instructorID', sql.Int, instructorID)
            .input('weekID', sql.Int, weekId || null)
            .query(`
                INSERT INTO Lecture (Title, Date, Start_Time, End_Time, CourseID, InstructorID, Week_ID)
                VALUES (@title, @date, @startTime, @endTime, @courseID, @instructorID, @weekID)
            `);

        res.json({ message: "Lecture added successfully" });
    } catch (err) {
        console.error("Add Lecture Error:", err);
        res.status(500).json({ message: "An internal server error occurred while adding lecture." });
    }
};

// =============================================
//  ASSIGNMENTS
// =============================================

// CREATE assignment
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

        // Notify enrolled students
        try {
            const courseResult = await pool.request()
                .input('cId', sql.Int, courseId)
                .query('SELECT Name FROM Course WHERE CourseID = @cId');
            const courseName = courseResult.recordset[0]?.Name || 'Unknown Course';

            const studentsResult = await pool.request()
                .input('cId', sql.Int, courseId)
                .query('SELECT StudentID FROM Enrollment WHERE CourseID = @cId');
            
            for (const student of studentsResult.recordset) {
                await createNotification(
                    student.StudentID,
                    'assignment',
                    `New Assignment: ${title}`,
                    `A new assignment has been posted in ${courseName}. Deadline: ${deadline ? new Date(deadline).toLocaleString() : 'No deadline'}`,
                    `/course/${courseId}/assignments`
                );
            }
        } catch (notifErr) {
            console.error("Assignment notification failed:", notifErr.message);
        }

        res.json({ message: "Assignment created successfully" });
    } catch (err) {
        console.error("Create Assignment Error:", err);
        res.status(500).json({ message: "An internal server error occurred while creating assignment." });
    }
};

// =============================================
//  SUBMISSIONS REVIEW
// =============================================

// GET all submissions (instructor sees everything)
const getSubmissions = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                sub.SubID AS SubmissionID,
                sub.FilePath,
                sub.Score,
                sub.SubmittedAt AS SubmissionDate,
                u.FullName AS StudentName,
                a.Title AS AssignmentTitle,
                c.Name AS CourseName,
                corrector.FullName AS CorrectedByName
            FROM Submission sub
            INNER JOIN Users u ON sub.StudentID = u.UserID
            INNER JOIN Assignment a ON sub.AssignmentID = a.AssignmentID
            INNER JOIN Course c ON a.CourseID = c.CourseID
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
//  COURSE CONTENT VIEW (Instructor - no enrollment check)
// =============================================
const getCourseContent = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();

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

        if (courseResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Get weeks
        const weeksResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT Week_ID AS WeekID, CourseID, Week_Number AS WeekNumber, Title, StartDate, EndDate
                FROM StudyWeek 
                WHERE CourseID = @courseID 
                ORDER BY Week_Number
            `);

        // Get materials and lectures for each week
        const weeks = [];
        for (const week of weeksResult.recordset) {
            const materialsResult = await pool.request()
                .input('weekID', sql.Int, week.WeekID)
                .query(`
                    SELECT Material_ID AS MaterialID, Week_ID AS WeekID, Title, Type, FileURL, Created_By
                    FROM Material 
                    WHERE Week_ID = @weekID
                `);
            
            const weekLecturesResult = await pool.request()
                .input('weekID', sql.Int, week.WeekID)
                .query(`
                    SELECT LectureID, Title, Date, Start_Time, End_Time, Week_ID
                    FROM Lecture 
                    WHERE Week_ID = @weekID 
                    ORDER BY Date
                `);
                
            weeks.push({ 
                ...week, 
                materials: materialsResult.recordset,
                lectures: weekLecturesResult.recordset 
            });
        }

        // Get unassigned lectures (optional, or just for reference)
        const lecturesResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT LectureID, Title, Date, Start_Time, End_Time, Week_ID
                FROM Lecture 
                WHERE CourseID = @courseID AND Week_ID IS NULL
                ORDER BY Date
            `);

        // Get assignments
        const assignmentsResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT AssignmentID, Title, Max_Score, Deadline
                FROM Assignment 
                WHERE CourseID = @courseID 
                ORDER BY Deadline
            `);

        // Get enrolled students count
        const enrolledResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query('SELECT COUNT(*) AS total FROM Enrollment WHERE CourseID = @courseID');

        // Get submissions count
        const subsResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT COUNT(*) AS total FROM Submission s
                JOIN Assignment a ON s.AssignmentID = a.AssignmentID
                WHERE a.CourseID = @courseID
            `);

        res.json({
            course: courseResult.recordset[0],
            weeks,
            lectures: lecturesResult.recordset,
            assignments: assignmentsResult.recordset,
            enrolledCount: enrolledResult.recordset[0].total,
            submissionCount: subsResult.recordset[0].total
        });
    } catch (err) {
        console.error("Get Course Content Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching course content." });
    }
};

// =============================================
//  COURSE MATERIALS
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
        console.error("Get Course Materials Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
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

        res.status(201).json({ message: "Material uploaded successfully." });
    } catch (err) {
        console.error("Upload Course Material Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

const deleteCourseMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

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
        console.error("Delete Course Material Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

// =============================================
//  ANNOUNCEMENTS
// =============================================
const getAnnouncements = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();
        const result = await pool.request()
            .input('courseId', sql.Int, courseId)
            .query(`
                SELECT a.*, u.FullName AS PosterName
                FROM Announcements a
                INNER JOIN Users u ON a.PostedBy = u.UserID
                WHERE a.CourseID = @courseId
                ORDER BY a.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Get Announcements Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const { courseId, title, content } = req.body;
        const postedBy = req.user.id;

        const pool = await getPool();
        await pool.request()
            .input('courseId', sql.Int, courseId)
            .input('title', sql.VarChar, title)
            .input('content', sql.VarChar, content)
            .input('postedBy', sql.Int, postedBy)
            .query(`INSERT INTO Announcements (CourseID, Title, Content, PostedBy) 
                    VALUES (@courseId, @title, @content, @postedBy)`);

        // Notify enrolled students
        try {
            const courseResult = await pool.request()
                .input('cId', sql.Int, courseId)
                .query('SELECT Name FROM Course WHERE CourseID = @cId');
            const courseName = courseResult.recordset[0]?.Name || 'Unknown Course';

            const studentsResult = await pool.request()
                .input('cId', sql.Int, courseId)
                .query('SELECT StudentID FROM Enrollment WHERE CourseID = @cId');
            
            for (const student of studentsResult.recordset) {
                await createNotification(
                    student.StudentID,
                    'announcement',
                    `New Announcement: ${title}`,
                    `${courseName}: ${content.substring(0, 50)}...`,
                    `/course/${courseId}/announcements`
                );
            }
        } catch (notifErr) {
            console.error("Announcement notification failed:", notifErr.message);
        }

        res.status(201).json({ message: "Announcement posted successfully." });
    } catch (err) {
        console.error("Create Announcement Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Announcements WHERE AnnouncementID = @id');
        res.json({ message: "Announcement deleted successfully." });
    } catch (err) {
        console.error("Delete Announcement Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

// =============================================
//  GRADE SUBMISSION (with email notification)
// =============================================
const gradeSubmission = async (req, res) => {
    try {
        const { submissionId, score, feedback } = req.body;
        const instructorId = req.user.id;
        const pool = await getPool();

        // 1. Verify this submission belongs to a course owned by this instructor
        const check = await pool.request()
            .input('subId', sql.Int, submissionId)
            .input('instructorId', sql.Int, instructorId)
            .query(`
                SELECT s.SubID
                FROM Submission s
                INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
                INNER JOIN Course c ON a.CourseID = c.CourseID
                WHERE s.SubID = @subId AND c.InstructorID = @instructorId
            `);

        if (check.recordset.length === 0) {
            return res.status(403).json({ message: "You are not authorized to grade this submission." });
        }

        // 2. Update grade
        await pool.request()
            .input('subId', sql.Int, submissionId)
            .input('score', sql.Float, score)
            .input('feedback', sql.VarChar, feedback || null)
            .query('UPDATE Submission SET Score = @score, Feedback = @feedback WHERE SubID = @subId');

        // 3. Get student email for notification
        try {
            const { sendEmail } = require('../utils/emailService');
            const result = await pool.request()
                .input('subId', sql.Int, submissionId)
                .query(`
                    SELECT u.Email, u.FullName, a.Title AS AssignmentTitle, c.Name AS CourseName
                    FROM Submission s
                    INNER JOIN Users u ON s.StudentID = u.UserID
                    INNER JOIN Assignment a ON s.AssignmentID = a.AssignmentID
                    INNER JOIN Course c ON a.CourseID = c.CourseID
                    WHERE s.SubID = @subId
                `);
            
            if (result.recordset.length > 0) {
                const { Email, FullName, AssignmentTitle, CourseName } = result.recordset[0];
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
                        <h2 style="color: #1e293b;">Grade Posted 🎓</h2>
                        <p style="color: #64748b;">Hello <strong>${FullName}</strong>,</p>
                        <p style="color: #64748b;">Your submission for <strong>${AssignmentTitle}</strong> in <strong>${CourseName}</strong> has been graded.</p>
                        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                            <p style="font-size: 32px; font-weight: bold; margin: 0;">${score}</p>
                            <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">Your Grade</p>
                        </div>
                        ${feedback ? `<p style="color: #64748b;"><strong>Feedback:</strong> ${feedback}</p>` : ''}
                        <p style="color: #94a3b8; font-size: 12px;">— Mini LMS</p>
                    </div>
                `;
                await sendEmail(Email, `Grade Posted: ${AssignmentTitle} — Mini LMS`, '', html);

                // Also create in-app notification
                const studentResult = await pool.request()
                    .input('subId2', sql.Int, submissionId)
                    .query('SELECT StudentID FROM Submission WHERE SubID = @subId2');
                if (studentResult.recordset.length > 0) {
                    await createNotification(
                        studentResult.recordset[0].StudentID,
                        'grade',
                        `Grade Posted: ${AssignmentTitle}`,
                        `You received ${score} on ${AssignmentTitle} in ${CourseName}${feedback ? '. Feedback: ' + feedback : ''}`,
                        '/grades'
                    );
                }
            }
        } catch (emailErr) {
            console.error("Grade email notification failed:", emailErr.message);
            // Don't fail the request if email fails
        }

        await logAudit(req.user.id, 'GRADE_SUBMISSION', `Graded submission #${submissionId}: ${score}`, req.ip);

        res.json({ message: "Submission graded successfully." });
    } catch (err) {
        console.error("Grade Submission Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

// ================= DELETE COURSE =================
const deleteCourse = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const courseId = req.params.id;

        const pool = await getPool();

        // Check if course belongs to this instructor
        const courseCheck = await pool.request()
            .input('courseId', sql.Int, courseId)
            .input('instId', sql.Int, instructorId)
            .query('SELECT CourseID FROM Course WHERE CourseID = @courseId AND InstructorID = @instId');

        if (courseCheck.recordset.length === 0) {
            return res.status(403).json({ message: "Course not found or unauthorized to delete." });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('courseId', sql.Int, courseId);

            // Manual cascade for tables lacking ON DELETE CASCADE
            await request.query('DELETE FROM CourseMaterials WHERE CourseID = @courseId');
            await request.query('DELETE FROM Announcements WHERE CourseID = @courseId');
            await request.query(`
                DELETE FROM DiscussionReplies 
                WHERE PostID IN (SELECT PostID FROM DiscussionPosts WHERE CourseID = @courseId)
            `);
            // The remaining tables should have ON DELETE CASCADE or can be deleted manually just in case
            await request.query('DELETE FROM Course_Assistants WHERE CourseID = @courseId');
            await request.query('DELETE FROM Enrollment WHERE CourseID = @courseId');
            
            // Delete the course itself
            await request.query('DELETE FROM Course WHERE CourseID = @courseId');

            await transaction.commit();

            await logAudit(instructorId, 'DELETE_COURSE', `Deleted course ID: ${courseId}`, req.ip);

            res.json({ message: "Course deleted successfully." });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }

    } catch (err) {
        console.error("Delete Course Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

module.exports = {
    getAssistants, addAssistant, deleteAssistant, assignAssistantToCourse,
    getStudents, addStudent, deleteStudent, enrollStudent,
    getCourses, createCourse, deleteCourse,
    addWeek, addMaterial, addLecture,
    createAssignment,
    getSubmissions,
    getCourseContent,
    getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    gradeSubmission
};
