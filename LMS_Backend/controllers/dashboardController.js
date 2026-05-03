const { sql, getPool } = require('../config/db');

const getStats = async (req, res) => {
    try {
        const pool = await getPool();
        const { id, type } = req.user;
        let stats = [];

        if (type === 'Instructor') {
            // 1. Total Students
            const studentCount = await pool.request().query("SELECT COUNT(*) as total FROM Students");
            
            // 2. Average GPA
            const avgGPA = await pool.request().query("SELECT AVG(GPA) as avg FROM Students");
            
            // 3. Pending Submissions (Score is null)
            const pending = await pool.request().query("SELECT COUNT(*) as total FROM Submission WHERE Score IS NULL");

            stats = [
                { label: 'Total Students', val: studentCount.recordset[0].total.toString(), icon: 'Users', color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/instructor/students' },
                { label: 'Avg Performance', val: (avgGPA.recordset[0].avg || 0).toFixed(2), icon: 'Award', color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/instructor/students' },
                { label: 'Pending Reviews', val: pending.recordset[0].total.toString(), icon: 'ClipboardList', color: 'text-cyan-500', bg: 'bg-cyan-500/10', path: '/instructor/submissions' }
            ];

        } else if (type === 'Assistant') {
            // 1. Assigned Courses
            const courses = await pool.request()
                .input('id', sql.Int, id)
                .query("SELECT COUNT(*) as total FROM Course_Assistants WHERE AssistantID = @id");
            
            // 2. Pending to grade (Submissions in their courses where score is null)
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

        } else {
            // Student
            // 1. Enrolled Courses
            const courses = await pool.request()
                .input('id', sql.Int, id)
                .query("SELECT COUNT(*) as total FROM Enrollment WHERE StudentID = @id");
            
            // 2. GPA
            const studentInfo = await pool.request()
                .input('id', sql.Int, id)
                .query("SELECT GPA FROM Students WHERE UserID = @id");
            
            // 3. Pending Assignments
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

        res.json(stats);
    } catch (err) {
        console.error("Get Dashboard Stats Error:", err);
        res.status(500).json({ message: "An internal server error occurred while fetching dashboard stats." });
    }
};

module.exports = { getStats };
