const { sql, poolPromise } = require('../config/dbConfig');

// GET /api/assistant/dashboard — Assistant dashboard with assigned courses
exports.getAssistantDashboard = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('AssistantID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    C.CourseID, C.Name AS CourseName, C.Description,
                    U.FullName AS InstructorName,
                    COUNT(DISTINCT E.StudentID) AS EnrolledStudents,
                    (SELECT COUNT(*) FROM Submissions Sub 
                     JOIN Assignments A ON Sub.AssignmentID = A.AssignmentID 
                     WHERE A.CourseID = C.CourseID AND Sub.Score IS NULL) AS PendingGrading
                FROM Courses C
                JOIN Course_Assistants CA ON C.CourseID = CA.CourseID
                LEFT JOIN Instructors I ON C.InstructorID = I.UserID
                LEFT JOIN Users U ON I.UserID = U.UserID
                LEFT JOIN Enrollment E ON C.CourseID = E.CourseID
                WHERE CA.AssistantID = @AssistantID AND C.DeletedAt IS NULL
                GROUP BY C.CourseID, C.Name, C.Description, U.FullName
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/assistant/courses/:courseId/submissions — Pending submissions for grading
exports.getCourseSubmissions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CourseID', sql.Int, req.params.courseId)
            .input('AssistantID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    Sub.SubmissionID, Sub.Score, Sub.SubmittedAt, Sub.GradedAt, Sub.FilePath,
                    A.AssignmentID, A.Title AS AssignmentTitle, A.MaxScore,
                    U.UserID AS StudentID, U.FullName AS StudentName
                FROM Submissions Sub
                JOIN Assignments A ON Sub.AssignmentID = A.AssignmentID
                JOIN Users U ON Sub.StudentID = U.UserID
                WHERE A.CourseID = @CourseID 
                    AND A.DeletedAt IS NULL
                    AND EXISTS (SELECT 1 FROM Course_Assistants CA WHERE CA.CourseID = @CourseID AND CA.AssistantID = @AssistantID)
                ORDER BY Sub.SubmittedAt DESC
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/assistant/grade-submission — Grade a student's submission
exports.gradeSubmission = async (req, res) => {
    try {
        const { submissionId, score } = req.body;
        if (submissionId === undefined || score === undefined) {
            return res.status(400).json({ message: 'submissionId and score are required' });
        }

        const pool = await poolPromise;

        // Update the submission score
        const result = await pool.request()
            .input('SubmissionID', sql.Int, submissionId)
            .input('Score', sql.Decimal(5, 2), score)
            .input('CorrectedBy', sql.Int, req.user.id)
            .query(`
                UPDATE Submissions 
                SET Score = @Score, CorrectedBy = @CorrectedBy, GradedAt = GETDATE()
                OUTPUT inserted.StudentID, inserted.AssignmentID
                WHERE SubmissionID = @SubmissionID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        const { StudentID, AssignmentID } = result.recordset[0];

        // Log the activity
        await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .input('Action', sql.NVarChar, 'GRADE_SUBMISSION')
            .input('TargetTable', sql.NVarChar, 'Submissions')
            .input('TargetID', sql.Int, submissionId)
            .input('Details', sql.NVarChar, `Graded submission #${submissionId} — Score: ${score}`)
            .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID, Details) VALUES (@UserID, @Action, @TargetTable, @TargetID, @Details)");

        // Notify the student
        await pool.request()
            .input('UserID', sql.Int, StudentID)
            .input('Title', sql.NVarChar, 'Assignment Graded')
            .input('Message', sql.NVarChar, `Your submission has been graded. Score: ${score}`)
            .query("INSERT INTO Notifications (UserID, Title, Message) VALUES (@UserID, @Title, @Message)");

        res.status(200).json({ message: 'Submission graded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
