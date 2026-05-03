const { sql, poolPromise } = require('../config/dbConfig');

// GET /api/notifications — Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .query(`
                SELECT NotificationID, Title, Message, IsRead, CreatedAt
                FROM Notifications
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/notifications/unread-count — Count of unread notifications
exports.getUnreadCount = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .query('SELECT COUNT(*) AS UnreadCount FROM Notifications WHERE UserID = @UserID AND IsRead = 0');
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/notifications/:id/read — Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('NotificationID', sql.Int, req.params.id)
            .input('UserID', sql.Int, req.user.id)
            .query('UPDATE Notifications SET IsRead = 1 WHERE NotificationID = @NotificationID AND UserID = @UserID');
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/notifications/read-all — Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .query('UPDATE Notifications SET IsRead = 1 WHERE UserID = @UserID AND IsRead = 0');
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
