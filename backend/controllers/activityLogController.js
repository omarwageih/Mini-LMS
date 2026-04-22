const { sql, poolPromise } = require('../config/dbConfig');

// GET /api/activity-log — Get activity log (Instructor only)
exports.getActivityLog = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { limit = 50, userId, action } = req.query;

        let query = `
            SELECT TOP (@Limit)
                AL.LogID, AL.Action, AL.TargetTable, AL.TargetID, AL.Details, AL.IPAddress, AL.Timestamp,
                U.FullName AS UserName, U.UserType
            FROM Activity_Log AL
            JOIN Users U ON AL.UserID = U.UserID
            WHERE 1=1
        `;

        const request = pool.request().input('Limit', sql.Int, parseInt(limit));

        if (userId) {
            query += ' AND AL.UserID = @FilterUserID';
            request.input('FilterUserID', sql.Int, userId);
        }
        if (action) {
            query += ' AND AL.Action = @FilterAction';
            request.input('FilterAction', sql.NVarChar, action);
        }

        query += ' ORDER BY AL.Timestamp DESC';

        const result = await request.query(query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/activity-log/my — Get the logged-in user's own activity
exports.getMyActivity = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .query(`
                SELECT TOP 50 LogID, Action, TargetTable, TargetID, Details, Timestamp
                FROM Activity_Log
                WHERE UserID = @UserID
                ORDER BY Timestamp DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
