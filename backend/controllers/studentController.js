const { sql, poolPromise } = require('../config/dbConfig');

// GET /api/student/dashboard — Full student dashboard
exports.getStudentDashboard = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        let result;
        try {
            // Try using the SQL view (new schema)
            result = await pool.request()
                .input('StudentID', sql.Int, req.user.id)
                .query('SELECT * FROM vw_StudentDashboard WHERE StudentID = @StudentID');
        } catch (viewErr) {
            // Fallback: direct query for old schema
            result = await pool.request()
                .input('StudentID', sql.Int, req.user.id)
                .query(`
                    SELECT 
                        S.UserID AS StudentID, U.FullName AS StudentName,
                        S.Major, S.AcademicYear,
                        C.CourseID, C.Name AS CourseName,
                        CG.CalculatedGrade AS CourseGrade,
                        CG.AssignmentTotal, CG.QuizTotal, CG.AttendanceTotal,
                        (SELECT COUNT(*) FROM Attendance A2 
                         JOIN Lectures L2 ON A2.LectureID = L2.LectureID 
                         WHERE A2.StudentID = S.UserID AND L2.CourseID = C.CourseID AND A2.Status = 'Present') AS LecturesAttended,
                        (SELECT COUNT(*) FROM Lectures L3 WHERE L3.CourseID = C.CourseID AND L3.DeletedAt IS NULL) AS TotalLectures
                    FROM Students S
                    JOIN Users U ON S.UserID = U.UserID
                    JOIN Enrollment E ON S.UserID = E.StudentID
                    JOIN Courses C ON E.CourseID = C.CourseID
                    LEFT JOIN Course_Grades CG ON E.StudentID = CG.StudentID AND C.CourseID = CG.CourseID
                    WHERE S.UserID = @StudentID AND C.DeletedAt IS NULL AND U.DeletedAt IS NULL
                `);
        }
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/student/courses — Enrolled courses with details
exports.getStudentCourses = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('StudentID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    C.CourseID, C.Name AS CourseName, C.Description,
                    U.FullName AS InstructorName,
                    E.EnrolledAt,
                    CG.CalculatedGrade, CG.ManualOverrideGrade, CG.UseManualGrade,
                    CG.AssignmentTotal, CG.QuizTotal, CG.AttendanceTotal,
                    CASE WHEN CG.UseManualGrade = 1 THEN CG.ManualOverrideGrade ELSE CG.CalculatedGrade END AS FinalGrade
                FROM Enrollment E
                JOIN Courses C ON E.CourseID = C.CourseID
                LEFT JOIN Instructors I ON C.InstructorID = I.UserID
                LEFT JOIN Users U ON I.UserID = U.UserID
                LEFT JOIN Course_Grades CG ON E.StudentID = CG.StudentID AND C.CourseID = CG.CourseID
                WHERE E.StudentID = @StudentID AND C.DeletedAt IS NULL
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/student/attendance — Attendance records for the student
exports.getStudentAttendance = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('StudentID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    A.AttendanceID, A.Status, A.Score, A.RecordedAt,
                    L.Title AS LectureTitle, L.LectureDate, L.StartTime, L.EndTime,
                    C.Name AS CourseName
                FROM Attendance A
                JOIN Lectures L ON A.LectureID = L.LectureID
                JOIN Courses C ON L.CourseID = C.CourseID
                WHERE A.StudentID = @StudentID AND L.DeletedAt IS NULL
                ORDER BY L.LectureDate DESC
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/student/assignments — Assignments & submissions for the student
exports.getStudentAssignments = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('StudentID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    A.AssignmentID, A.Title, A.Description, A.MaxScore, A.Deadline, A.GradingMethod,
                    C.Name AS CourseName,
                    S.SubmissionID, S.Score AS MyScore, S.SubmittedAt, S.GradedAt,
                    CASE WHEN S.SubmissionID IS NOT NULL THEN 1 ELSE 0 END AS IsSubmitted,
                    CASE WHEN A.Deadline < GETDATE() AND S.SubmissionID IS NULL THEN 1 ELSE 0 END AS IsMissed
                FROM Assignments A
                JOIN Courses C ON A.CourseID = C.CourseID
                JOIN Enrollment E ON C.CourseID = E.CourseID AND E.StudentID = @StudentID
                LEFT JOIN Submissions S ON A.AssignmentID = S.AssignmentID AND S.StudentID = @StudentID
                WHERE A.DeletedAt IS NULL AND C.DeletedAt IS NULL
                ORDER BY A.Deadline DESC
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/student/quizzes — Quizzes & results for the student
exports.getStudentQuizzes = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('StudentID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    Q.QuizID, Q.Title, Q.MaxScore, Q.QuizType, Q.DurationMinutes,
                    C.Name AS CourseName,
                    QR.Score AS MyScore, QR.CompletedAt,
                    CASE WHEN QR.ResultID IS NOT NULL THEN 1 ELSE 0 END AS IsCompleted
                FROM Quizzes Q
                JOIN Courses C ON Q.CourseID = C.CourseID
                JOIN Enrollment E ON C.CourseID = E.CourseID AND E.StudentID = @StudentID
                LEFT JOIN Quiz_Results QR ON Q.QuizID = QR.QuizID AND QR.StudentID = @StudentID
                WHERE Q.DeletedAt IS NULL AND C.DeletedAt IS NULL
                ORDER BY QR.CompletedAt DESC
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/student/quizzes/:id/questions — Get questions for a quiz
exports.getQuizQuestions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('QuizID', sql.Int, req.params.id)
            .query('SELECT QuestionID, QuestionText, OptionsJSON FROM QuizQuestions WHERE QuizID = @QuizID');
        
        // Parse JSON options for frontend
        const questions = result.recordset.map(q => ({
            ...q,
            options: JSON.parse(q.OptionsJSON)
        }));

        res.status(200).json(questions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/student/quizzes/:id/submit — Submit quiz answers
exports.submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body; // { questionID: selectedIndex }
        const quizId = req.params.id;
        const studentId = req.user.id;

        const pool = await poolPromise;
        const questions = await pool.request()
            .input('QuizID', sql.Int, quizId)
            .query('SELECT QuestionID, CorrectOption, Points FROM QuizQuestions WHERE QuizID = @QuizID');

        let totalScore = 0;
        questions.recordset.forEach(q => {
            if (answers[q.QuestionID] === q.CorrectOption) {
                totalScore += q.Points;
            }
        });

        // Insert or update result
        await pool.request()
            .input('QuizID', sql.Int, quizId)
            .input('StudentID', sql.Int, studentId)
            .input('Score', sql.Decimal(5, 2), totalScore)
            .query(`
                MERGE Quiz_Results AS target
                USING (SELECT @QuizID AS QuizID, @StudentID AS StudentID) AS source
                ON target.QuizID = source.QuizID AND target.StudentID = source.StudentID
                WHEN MATCHED THEN
                    UPDATE SET Score = @Score, CompletedAt = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (QuizID, StudentID, Score) VALUES (@QuizID, @StudentID, @Score);
            `);

        // Trigger grade sync
        await pool.request()
            .input('p_StudentID', sql.Int, studentId)
            .input('p_CourseID', sql.Int, (await pool.request().input('QuizID', sql.Int, quizId).query('SELECT CourseID FROM Quizzes WHERE QuizID = @QuizID')).recordset[0].CourseID)
            .execute('sp_SyncGrades');

        res.status(200).json({ score: totalScore, message: 'Quiz submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

