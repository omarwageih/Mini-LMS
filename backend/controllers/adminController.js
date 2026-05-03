const { sql, poolPromise } = require('../config/dbConfig');

/**
 * Get system-wide statistics for the Admin Dashboard
 */
exports.getSystemStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM Users WHERE DeletedAt IS NULL) AS TotalUsers,
                    (SELECT COUNT(*) FROM Students WHERE DeletedAt IS NULL) AS TotalStudents,
                    (SELECT COUNT(*) FROM Instructors WHERE DeletedAt IS NULL) AS TotalInstructors,
                    (SELECT COUNT(*) FROM Assistants WHERE DeletedAt IS NULL) AS TotalAssistants,
                    (SELECT COUNT(*) FROM Courses WHERE DeletedAt IS NULL) AS TotalCourses,
                    (SELECT COUNT(*) FROM Enrollment) AS TotalEnrollments,
                    (SELECT COUNT(*) FROM Activity_Log WHERE Timestamp >= DATEADD(day, -7, GETDATE())) AS RecentActivityCount
            `);
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Toggle user active status
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        await pool.request()
            .input('UserID', sql.Int, id)
            .query('UPDATE Users SET IsActive = ~IsActive, UpdatedAt = GETDATE() WHERE UserID = @UserID');

        res.status(200).json({ message: 'User status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get all activity logs with user details
 */
exports.getGlobalActivityLog = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT TOP 100 L.*, U.FullName, U.UserType 
                FROM Activity_Log L
                JOIN Users U ON L.UserID = U.UserID
                ORDER BY L.Timestamp DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
