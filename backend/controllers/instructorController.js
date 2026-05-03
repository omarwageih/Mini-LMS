const { sql, poolPromise } = require('../config/dbConfig');

// GET /api/instructor/dashboard — Instructor dashboard with course stats
exports.getInstructorDashboard = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('InstructorID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    C.CourseID, C.Name AS CourseName, C.Description,
                    COUNT(DISTINCT E.StudentID) AS EnrolledStudents,
                    AVG(CASE WHEN CG.UseManualGrade = 1 THEN CG.ManualOverrideGrade ELSE CG.CalculatedGrade END) AS ClassAverageGrade,
                    (SELECT COUNT(*) FROM Lectures L WHERE L.CourseID = C.CourseID AND L.DeletedAt IS NULL) AS TotalLectures,
                    (SELECT COUNT(*) FROM Assignments A WHERE A.CourseID = C.CourseID AND A.DeletedAt IS NULL) AS TotalAssignments,
                    (SELECT COUNT(*) FROM Quizzes Q WHERE Q.CourseID = C.CourseID AND Q.DeletedAt IS NULL) AS TotalQuizzes
                FROM Courses C
                LEFT JOIN Enrollment E ON C.CourseID = E.CourseID
                LEFT JOIN Course_Grades CG ON E.StudentID = CG.StudentID AND C.CourseID = CG.CourseID
                WHERE C.InstructorID = @InstructorID AND C.DeletedAt IS NULL
                GROUP BY C.CourseID, C.Name, C.Description
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/instructor/courses/:courseId/students — List students in a course with grades
exports.getCourseStudents = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CourseID', sql.Int, req.params.courseId)
            .input('InstructorID', sql.Int, req.user.id)
            .query(`
                SELECT 
                    U.UserID, U.FullName, U.Email,
                    S.AcademicYear, S.Major, S.GPA,
                    CG.AssignmentTotal, CG.QuizTotal, CG.AttendanceTotal,
                    CG.CalculatedGrade, CG.ManualOverrideGrade, CG.UseManualGrade,
                    CASE WHEN CG.UseManualGrade = 1 THEN CG.ManualOverrideGrade ELSE CG.CalculatedGrade END AS FinalGrade
                FROM Enrollment E
                JOIN Students S ON E.StudentID = S.UserID
                JOIN Users U ON S.UserID = U.UserID
                LEFT JOIN Course_Grades CG ON E.StudentID = CG.StudentID AND E.CourseID = CG.CourseID
                WHERE E.CourseID = @CourseID 
                    AND EXISTS (SELECT 1 FROM Courses C WHERE C.CourseID = @CourseID AND C.InstructorID = @InstructorID AND C.DeletedAt IS NULL)
                    AND U.DeletedAt IS NULL
                ORDER BY U.FullName
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/instructor/grade — Update a student's grade with activity logging
exports.updateStudentGrade = async (req, res) => {
    try {
        const { studentId, courseId, manualGrade, useManual } = req.body;
        if (!studentId || !courseId) {
            return res.status(400).json({ message: 'studentId and courseId are required' });
        }

        const pool = await poolPromise;
        
        await pool.request()
            .input('StudentID', sql.Int, studentId)
            .input('CourseID', sql.Int, courseId)
            .input('ManualGrade', sql.Decimal(5, 2), manualGrade || null)
            .input('UseManual', sql.Bit, useManual ? 1 : 0)
            .query(`
                UPDATE Course_Grades
                SET ManualOverrideGrade = @ManualGrade, 
                    UseManualGrade = @UseManual,
                    UpdatedAt = GETDATE()
                WHERE StudentID = @StudentID AND CourseID = @CourseID
            `);

        // Log the grading activity
        await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .input('Action', sql.NVarChar, 'GRADE_STUDENT')
            .input('TargetTable', sql.NVarChar, 'Course_Grades')
            .input('TargetID', sql.Int, studentId)
            .input('Details', sql.NVarChar, `Graded student #${studentId} in course #${courseId} — Grade: ${manualGrade}`)
            .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID, Details) VALUES (@UserID, @Action, @TargetTable, @TargetID, @Details)");

        // Send notification to the student
        await pool.request()
            .input('UserID', sql.Int, studentId)
            .input('Title', sql.NVarChar, 'Grade Updated')
            .input('Message', sql.NVarChar, `Your grade in course #${courseId} has been updated by your instructor.`)
            .query("INSERT INTO Notifications (UserID, Title, Message) VALUES (@UserID, @Title, @Message)");

        res.status(200).json({ message: 'Grade updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/instructor/sync-grades — Trigger grade sync for a student
exports.syncGrades = async (req, res) => {
    try {
        const { studentId, courseId } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('p_StudentID', sql.Int, studentId)
            .input('p_CourseID', sql.Int, courseId)
            .execute('sp_SyncGrades');

        res.status(200).json({ message: 'Grades synced successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/instructor/attendance — Record attendance for a lecture
exports.recordAttendance = async (req, res) => {
    try {
        const { lectureId, records } = req.body;
        // records = [{ studentId, status, score }]
        if (!lectureId || !records || !Array.isArray(records)) {
            return res.status(400).json({ message: 'lectureId and records array are required' });
        }

        const pool = await poolPromise;

        for (const record of records) {
            await pool.request()
                .input('LectureID', sql.Int, lectureId)
                .input('StudentID', sql.Int, record.studentId)
                .input('Status', sql.NVarChar, record.status)
                .input('Score', sql.Decimal(5, 2), record.score || 0)
                .query(`
                    MERGE Attendance AS target
                    USING (SELECT @LectureID AS LectureID, @StudentID AS StudentID) AS source
                    ON target.LectureID = source.LectureID AND target.StudentID = source.StudentID
                    WHEN MATCHED THEN
                        UPDATE SET Status = @Status, Score = @Score, RecordedAt = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (LectureID, StudentID, Status, Score) VALUES (@LectureID, @StudentID, @Status, @Score);
                `);
        }

        // Log the activity
        await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .input('Action', sql.NVarChar, 'RECORD_ATTENDANCE')
            .input('TargetTable', sql.NVarChar, 'Attendance')
            .input('TargetID', sql.Int, lectureId)
            .input('Details', sql.NVarChar, `Recorded attendance for ${records.length} students in lecture #${lectureId}`)
            .query("INSERT INTO Activity_Log (UserID, Action, TargetTable, TargetID, Details) VALUES (@UserID, @Action, @TargetTable, @TargetID, @Details)");

        res.status(200).json({ message: 'Attendance recorded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
