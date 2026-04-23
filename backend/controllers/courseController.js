const { sql, poolPromise } = require('../config/dbConfig');

// GET /api/courses — List all active courses
exports.getAllCourses = async (req, res) => {
    try {
        const pool = await poolPromise;
        let result;
        try {
            result = await pool.request().query('SELECT * FROM vw_CourseOverview');
        } catch (viewErr) {
            // Fallback: direct query
            result = await pool.request().query(`
                SELECT 
                    C.CourseID, C.Name AS CourseName, C.Description, C.MaxMarks, C.CreatedAt,
                    U.FullName AS InstructorName,
                    (SELECT COUNT(*) FROM Enrollment E WHERE E.CourseID = C.CourseID) AS StudentCount,
                    (SELECT COUNT(*) FROM Lectures L WHERE L.CourseID = C.CourseID AND L.DeletedAt IS NULL) AS LectureCount,
                    (SELECT COUNT(*) FROM Assignments A WHERE A.CourseID = C.CourseID AND A.DeletedAt IS NULL) AS AssignmentCount,
                    (SELECT COUNT(*) FROM Quizzes Q WHERE Q.CourseID = C.CourseID AND Q.DeletedAt IS NULL) AS QuizCount
                FROM Courses C
                LEFT JOIN Instructors I ON C.InstructorID = I.UserID
                LEFT JOIN Users U ON I.UserID = U.UserID
                WHERE C.DeletedAt IS NULL
            `);
        }
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/courses/:id — Get course details with weeks & materials
exports.getCourseById = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Course info
        const course = await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .query(`
                SELECT C.*, U.FullName AS InstructorName
                FROM Courses C
                LEFT JOIN Instructors I ON C.InstructorID = I.UserID
                LEFT JOIN Users U ON I.UserID = U.UserID
                WHERE C.CourseID = @CourseID AND C.DeletedAt IS NULL
            `);

        if (course.recordset.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Study weeks with materials
        const weeks = await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .query(`
                SELECT 
                    W.WeekID, W.WeekNumber, W.Title AS WeekTitle, W.StartDate, W.EndDate,
                    M.MaterialID, M.Title AS MaterialTitle, M.MaterialType, M.FilePath, M.FileSize
                FROM StudyWeeks W
                LEFT JOIN Materials M ON W.WeekID = M.WeekID AND M.DeletedAt IS NULL
                WHERE W.CourseID = @CourseID AND W.DeletedAt IS NULL
                ORDER BY W.WeekNumber, M.MaterialID
            `);

        res.status(200).json({
            course: course.recordset[0],
            weeks: weeks.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/courses — Create a new course (Instructor only)
exports.createCourse = async (req, res) => {
    try {
        const { name, description, maxMarks } = req.body;
        if (!name) return res.status(400).json({ message: 'Course name is required' });

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Name', sql.NVarChar, name)
            .input('Description', sql.NVarChar, description || null)
            .input('MaxMarks', sql.Int, maxMarks || 100)
            .input('InstructorID', sql.Int, req.user.id)
            .query(`
                INSERT INTO Courses (Name, Description, MaxMarks, InstructorID)
                OUTPUT inserted.CourseID
                VALUES (@Name, @Description, @MaxMarks, @InstructorID)
            `);

        const courseId = result.recordset[0].CourseID;

        // Log
        await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .input('Action', sql.NVarChar, 'CREATE_COURSE')
            .input('TargetTable', sql.NVarChar, 'Courses')
            .input('TargetID', sql.Int, courseId)
            .input('Details', sql.NVarChar, `Created course: ${name}`)
            .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID, Details) VALUES (@UserID, @Action, @TargetTable, @TargetID, @Details)");

        res.status(201).json({ message: 'Course created', CourseID: courseId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/courses/:id — Update course details
exports.updateCourse = async (req, res) => {
    try {
        const { name, description, maxMarks } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .input('Name', sql.NVarChar, name || null)
            .input('Description', sql.NVarChar, description || null)
            .input('MaxMarks', sql.Int, maxMarks || null)
            .query(`
                UPDATE Courses 
                SET Name = ISNULL(@Name, Name),
                    Description = ISNULL(@Description, Description),
                    MaxMarks = ISNULL(@MaxMarks, MaxMarks),
                    UpdatedAt = GETDATE()
                WHERE CourseID = @CourseID AND DeletedAt IS NULL
            `);

        res.status(200).json({ message: 'Course updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/courses/:id — Soft delete a course
exports.deleteCourse = async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .query('UPDATE Courses SET DeletedAt = GETDATE(), UpdatedAt = GETDATE() WHERE CourseID = @CourseID');

        // Log
        await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .input('Action', sql.NVarChar, 'DELETE_COURSE')
            .input('TargetTable', sql.NVarChar, 'Courses')
            .input('TargetID', sql.Int, req.params.id)
            .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID) VALUES (@UserID, @Action, @TargetTable, @TargetID)");

        res.status(200).json({ message: 'Course deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/courses/:id/enroll — Enroll a student in a course
exports.enrollStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('StudentID', sql.Int, studentId)
            .input('CourseID', sql.Int, req.params.id)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Enrollment WHERE StudentID = @StudentID AND CourseID = @CourseID)
                BEGIN
                    INSERT INTO Enrollment (StudentID, CourseID) VALUES (@StudentID, @CourseID);
                    INSERT INTO Course_Grades (StudentID, CourseID) VALUES (@StudentID, @CourseID);
                END
            `);

        // Log
        await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .input('Action', sql.NVarChar, 'ENROLL_STUDENT')
            .input('TargetTable', sql.NVarChar, 'Enrollment')
            .input('TargetID', sql.Int, studentId)
            .input('Details', sql.NVarChar, `Enrolled student #${studentId} in course #${req.params.id}`)
            .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID, Details) VALUES (@UserID, @Action, @TargetTable, @TargetID, @Details)");

        res.status(201).json({ message: 'Student enrolled' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// ANNOUNCEMENTS
// ==========================================

exports.getCourseAnnouncements = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .query('SELECT A.*, U.FullName as CreatorName FROM Announcements A JOIN Users U ON A.CreatedBy = U.UserID WHERE A.CourseID = @CourseID AND A.DeletedAt IS NULL ORDER BY A.CreatedAt DESC');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .input('Title', sql.NVarChar, title)
            .input('Message', sql.NVarChar, message)
            .input('CreatedBy', sql.Int, req.user.id)
            .query('INSERT INTO Announcements (CourseID, Title, Message, CreatedBy) VALUES (@CourseID, @Title, @Message, @CreatedBy)');
        
        res.status(201).json({ message: 'Announcement posted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// DISCUSSION FORUM
// ==========================================

exports.getCourseThreads = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .query('SELECT T.*, U.FullName as AuthorName FROM DiscussionThreads T JOIN Users U ON T.AuthorID = U.UserID WHERE T.CourseID = @CourseID AND T.DeletedAt IS NULL ORDER BY T.UpdatedAt DESC');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createThread = async (req, res) => {
    try {
        const { title, content } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('CourseID', sql.Int, req.params.id)
            .input('Title', sql.NVarChar, title)
            .input('Content', sql.NVarChar, content)
            .input('AuthorID', sql.Int, req.user.id)
            .query('INSERT INTO DiscussionThreads (CourseID, Title, Content, AuthorID) VALUES (@CourseID, @Title, @Content, @AuthorID)');
        
        res.status(201).json({ message: 'Discussion thread created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

