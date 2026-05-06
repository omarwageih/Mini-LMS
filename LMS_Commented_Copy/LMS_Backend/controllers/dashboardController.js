/**
 * DASHBOARD CONTROLLER
 * Fetches high-level summary statistics for the user's dashboard.
 * Logic varies depending on the user's role (Instructor, Assistant, or Student).
 */
const { sql, getPool } = require('../config/db');

/**
 * GET DASHBOARD STATS
 * Aggregates counts and performance metrics to display as "stat cards" on the home screen.
 */
const getStats = async (req, res) => {
    try {
        const pool = await getPool();
        const { id, type } = req.user; // Get user info from the authentication token
        let stats = [];

        // ---------------------------------------------------------
        // ROLE: INSTRUCTOR (Owner of courses)
        // ---------------------------------------------------------
        if (type === 'Instructor') {
            // 1. Total Students: Count unique students across all courses this instructor teaches
            const studentCount = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT COUNT(DISTINCT StudentID) as total 
                    FROM Enrollment e
                    JOIN Course c ON e.CourseID = c.CourseID
                    WHERE c.InstructorID = @id
                `);
            
            // 2. Average GPA: Get the performance average of all students in their courses
            const avgGPA = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT AVG(s.GPA) as avg 
                    FROM Students s
                    JOIN Enrollment e ON s.UserID = e.StudentID
                    JOIN Course c ON e.CourseID = c.CourseID
                    WHERE c.InstructorID = @id
                `);
            
            // 3. Pending Reviews: Count submissions that haven't been graded yet (Score is NULL)
            const pending = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT COUNT(sub.SubID) as total 
                    FROM Submission sub
                    JOIN Assignment a ON sub.AssignmentID = a.AssignmentID
                    JOIN Course c ON a.CourseID = c.CourseID
                    WHERE c.InstructorID = @id AND sub.Score IS NULL
                `);

            // Assemble the data for the frontend display
            stats = [
                { label: 'Total Students', val: studentCount.recordset[0].total.toString(), icon: 'Users', color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/instructor/students' },
                { label: 'Avg Performance', val: (avgGPA.recordset[0].avg || 0).toFixed(2), icon: 'Award', color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/instructor/students' },
                { label: 'Pending Reviews', val: pending.recordset[0].total.toString(), icon: 'ClipboardList', color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/instructor/submissions' }
            ];

        // ---------------------------------------------------------
        // ROLE: ASSISTANT (Helping in courses)
        // ---------------------------------------------------------
        } else if (type === 'Assistant') {
            // 1. Assigned Courses: Count how many courses this assistant is supporting
            const courses = await pool.request()
                .input('id', sql.Int, id)
                .query("SELECT COUNT(*) as total FROM Course_Assistants WHERE AssistantID = @id");
            
            // 2. Unscored Tasks: Count submissions in assigned courses that still need a grade
            const pending = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT COUNT(s.SubID) as total 
                    FROM Submission s
                    JOIN Assignment a ON s.AssignmentID = a.AssignmentID
                    JOIN Course_Assistants ca ON a.CourseID = ca.CourseID
                    WHERE ca.AssistantID = @id AND s.Score IS NULL
                `);

            stats = [
                { label: 'Assigned Courses', val: courses.recordset[0].total.toString(), icon: 'BookOpen', color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/assistant/courses' },
                { label: 'Unscored Tasks', val: pending.recordset[0].total.toString(), icon: 'ClipboardList', color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/assistant/submissions' },
                { label: 'Active Status', val: 'Online', icon: 'Activity', color: 'text-green-500', bg: 'bg-green-500/10', path: '/assistant' }
            ];

        // ---------------------------------------------------------
        // ROLE: STUDENT (Learning in courses)
        // ---------------------------------------------------------
        } else {
            // 1. Registered Courses: How many courses the student is currently enrolled in
            const courses = await pool.request()
                .input('id', sql.Int, id)
                .query("SELECT COUNT(*) as total FROM Enrollment WHERE StudentID = @id");
            
            // 2. GPA: The student's current Grade Point Average from their profile
            const studentInfo = await pool.request()
                .input('id', sql.Int, id)
                .query("SELECT GPA FROM Students WHERE UserID = @id");
            
            // 3. Pending Tasks: Count assignments that have NOT been submitted yet
            const pending = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT COUNT(a.AssignmentID) as total 
                    FROM Assignment a
                    JOIN Enrollment e ON a.CourseID = e.CourseID
                    WHERE e.StudentID = @id 
                    AND NOT EXISTS (SELECT 1 FROM Submission s WHERE s.AssignmentID = a.AssignmentID AND s.StudentID = @id)
                `);

            stats = [
                { label: 'Registered Courses', val: courses.recordset[0].total.toString(), icon: 'BookOpen', color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/courses' },
                { label: 'Current GPA', val: (studentInfo.recordset[0]?.GPA || 0).toFixed(2), icon: 'Award', color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/grades' },
                { label: 'Pending Tasks', val: pending.recordset[0].total.toString(), icon: 'ClipboardList', color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/assignments' }
            ];
        }

        // Return the formatted statistics to the UI
        res.json(stats);

    } catch (err) {
        console.error("Get Dashboard Stats Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching dashboard stats." });
    }
};

module.exports = { getStats };
