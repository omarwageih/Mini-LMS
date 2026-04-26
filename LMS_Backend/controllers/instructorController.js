const { sql, getPool } = require('../config/db');
const bcrypt = require('bcryptjs');

// =============================================
//  ASSISTANTS MANAGEMENT
// =============================================

// GET all assistants
const getAssistants = async (req, res) => {
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
        res.status(500).json({ error: err.message });
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

        // Check if email already exists
        const existing = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: "Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into Users
        const userResult = await pool.request()
            .input('fullName', sql.VarChar, fullName)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('userType', sql.VarChar, 'Assistant')
            .query(`
                INSERT INTO Users (FullName, Email, Password, UserType)
                OUTPUT INSERTED.UserID
                VALUES (@fullName, @email, @password, @userType)
            `);

        const userID = userResult.recordset[0].UserID;

        // Insert into Assistants (UserID is PK)
        await pool.request()
            .input('userID', sql.Int, userID)
            .query('INSERT INTO Assistants (UserID) VALUES (@userID)');

        res.json({ message: "Assistant added successfully", userID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE assistant
const deleteAssistant = async (req, res) => {
    try {
        const { id } = req.params; // id = UserID
        const pool = await getPool();

        // Delete from Course_Assistants first (FK)
        await pool.request()
            .input('userID', sql.Int, id)
            .query('DELETE FROM Course_Assistants WHERE AssistantID = @userID');

        // Delete from Assistants (PK = UserID)
        await pool.request()
            .input('userID', sql.Int, id)
            .query('DELETE FROM Assistants WHERE UserID = @userID');

        // Delete from Users
        await pool.request()
            .input('userID', sql.Int, id)
            .query("DELETE FROM Users WHERE UserID = @userID AND UserType = 'Assistant'");

        res.json({ message: "Assistant deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ASSIGN assistant to course
const assignAssistantToCourse = async (req, res) => {
    try {
        const { assistantID, courseID } = req.body;
        // assistantID = UserID of assistant

        if (!assistantID || !courseID) {
            return res.status(400).json({ message: "assistantID and courseID are required." });
        }

        const pool = await getPool();

        // Check if already assigned
        const existing = await pool.request()
            .input('assistantID', sql.Int, assistantID)
            .input('courseID', sql.Int, courseID)
            .query('SELECT * FROM Course_Assistants WHERE AssistantID = @assistantID AND CourseID = @courseID');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: "Assistant already assigned to this course." });
        }

        await pool.request()
            .input('assistantID', sql.Int, assistantID)
            .input('courseID', sql.Int, courseID)
            .query('INSERT INTO Course_Assistants (AssistantID, CourseID) VALUES (@assistantID, @courseID)');

        res.json({ message: "Assistant assigned to course successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
                   s.GPA, s.Academic_Year, s.Major
            FROM Users u
            INNER JOIN Students s ON u.UserID = s.UserID
            WHERE u.UserType = 'Student'
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADD student
const addStudent = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "fullName, email, and password are required." });
        }

        const pool = await getPool();

        // Check if email already exists
        const existing = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: "Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into Users
        const userResult = await pool.request()
            .input('fullName', sql.VarChar, fullName)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('userType', sql.VarChar, 'Student')
            .query(`
                INSERT INTO Users (FullName, Email, Password, UserType)
                OUTPUT INSERTED.UserID
                VALUES (@fullName, @email, @password, @userType)
            `);

        const userID = userResult.recordset[0].UserID;

        // Insert into Students (UserID is PK)
        await pool.request()
            .input('userID', sql.Int, userID)
            .query('INSERT INTO Students (UserID) VALUES (@userID)');

        res.json({ message: "Student added successfully", userID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE student
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params; // id = UserID
        const pool = await getPool();

        // Delete related submissions first
        await pool.request()
            .input('userID', sql.Int, id)
            .query('DELETE FROM Submission WHERE StudentID = @userID');

        // Delete from Enrollment
        await pool.request()
            .input('userID', sql.Int, id)
            .query('DELETE FROM Enrollment WHERE StudentID = @userID');

        // Delete from Course_Grades
        await pool.request()
            .input('userID', sql.Int, id)
            .query('DELETE FROM Course_Grades WHERE StudentID = @userID');

        // Delete from Students (PK = UserID)
        await pool.request()
            .input('userID', sql.Int, id)
            .query('DELETE FROM Students WHERE UserID = @userID');

        // Delete from Users
        await pool.request()
            .input('userID', sql.Int, id)
            .query("DELETE FROM Users WHERE UserID = @userID AND UserType = 'Student'");

        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ENROLL student in course
const enrollStudent = async (req, res) => {
    try {
        const { studentID, courseID } = req.body;
        // studentID = UserID of student

        if (!studentID || !courseID) {
            return res.status(400).json({ message: "studentID and courseID are required." });
        }

        const pool = await getPool();

        // Check if already enrolled
        const existing = await pool.request()
            .input('studentID', sql.Int, studentID)
            .input('courseID', sql.Int, courseID)
            .query('SELECT * FROM Enrollment WHERE StudentID = @studentID AND CourseID = @courseID');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: "Student already enrolled in this course." });
        }

        await pool.request()
            .input('studentID', sql.Int, studentID)
            .input('courseID', sql.Int, courseID)
            .query('INSERT INTO Enrollment (StudentID, CourseID) VALUES (@studentID, @courseID)');

        res.json({ message: "Student enrolled successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
};

// CREATE course
const createCourse = async (req, res) => {
    try {
        const { courseName, maxMarks } = req.body;
        const instructorID = req.user.id;

        if (!courseName) {
            return res.status(400).json({ message: "courseName is required." });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('name', sql.VarChar, courseName)
            .input('maxMarks', sql.Int, maxMarks || 100)
            .input('instructorID', sql.Int, instructorID)
            .query(`
                INSERT INTO Course (Name, Max_Marks, InstructorID)
                OUTPUT INSERTED.CourseID
                VALUES (@name, @maxMarks, @instructorID)
            `);

        res.json({ message: "Course created successfully", courseID: result.recordset[0].CourseID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  CONTENT MANAGEMENT (Weeks, Materials, Lectures)
// =============================================

// ADD week to course
const addWeek = async (req, res) => {
    try {
        const { courseID, weekNumber, title } = req.body;

        if (!courseID || !weekNumber || !title) {
            return res.status(400).json({ message: "courseID, weekNumber, and title are required." });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('courseID', sql.Int, courseID)
            .input('weekNumber', sql.Int, weekNumber)
            .input('title', sql.VarChar, title)
            .query(`
                INSERT INTO StudyWeek (CourseID, Week_Number, Title)
                OUTPUT INSERTED.Week_ID
                VALUES (@courseID, @weekNumber, @title)
            `);

        res.json({ message: "Week added successfully", weekID: result.recordset[0].Week_ID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADD material to week
const addMaterial = async (req, res) => {
    try {
        const { weekID, title } = req.body;
        const createdBy = req.user.id;

        if (!weekID || !title) {
            return res.status(400).json({ message: "weekID and title are required." });
        }

        const pool = await getPool();
        await pool.request()
            .input('weekID', sql.Int, weekID)
            .input('title', sql.VarChar, title)
            .input('createdBy', sql.Int, createdBy)
            .query('INSERT INTO Material (Week_ID, Title, Created_By) VALUES (@weekID, @title, @createdBy)');

        res.json({ message: "Material added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADD lecture
const addLecture = async (req, res) => {
    try {
        const { courseID, title, date, startTime, endTime } = req.body;
        const instructorID = req.user.id;

        if (!courseID || !title || !date) {
            return res.status(400).json({ message: "courseID, title, and date are required." });
        }

        const pool = await getPool();
        await pool.request()
            .input('title', sql.VarChar, title)
            .input('date', sql.Date, date)
            .input('startTime', sql.VarChar, startTime || null)
            .input('endTime', sql.VarChar, endTime || null)
            .input('courseID', sql.Int, courseID)
            .input('instructorID', sql.Int, instructorID)
            .query(`
                INSERT INTO Lecture (Title, Date, Start_Time, End_Time, CourseID, InstructorID)
                VALUES (@title, @date, @startTime, @endTime, @courseID, @instructorID)
            `);

        res.json({ message: "Lecture added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
//  ASSIGNMENTS
// =============================================

// CREATE assignment
const createAssignment = async (req, res) => {
    try {
        const { courseID, title, maxScore, deadline } = req.body;

        if (!courseID || !title || !maxScore) {
            return res.status(400).json({ message: "courseID, title, and maxScore are required." });
        }

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
        res.status(500).json({ error: err.message });
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
            weeks.push({ ...week, materials: materialsResult.recordset });
        }

        // Get lectures
        const lecturesResult = await pool.request()
            .input('courseID', sql.Int, courseId)
            .query(`
                SELECT LectureID, Title, Date, Start_Time, End_Time
                FROM Lecture 
                WHERE CourseID = @courseID 
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
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAssistants, addAssistant, deleteAssistant, assignAssistantToCourse,
    getStudents, addStudent, deleteStudent, enrollStudent,
    getCourses, createCourse,
    addWeek, addMaterial, addLecture,
    createAssignment,
    getSubmissions,
    getCourseContent
};
