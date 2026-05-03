const { sql, getPool } = require('../config/db');

// Get all notifications for current user
const getNotifications = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, userID)
            .query(`
                SELECT TOP 50 * FROM Notifications
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Get Notifications Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, userID)
            .query(`SELECT COUNT(*) AS count FROM Notifications WHERE UserID = @UserID AND IsRead = 0`);
        res.json({ count: result.recordset[0].count });
    } catch (err) {
        console.error("Get Unread Count Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userID = req.user.id;
        const pool = await getPool();
        await pool.request()
            .input('NotificationID', sql.Int, notificationId)
            .input('UserID', sql.Int, userID)
            .query(`UPDATE Notifications SET IsRead = 1 WHERE NotificationID = @NotificationID AND UserID = @UserID`);
        res.json({ message: "Marked as read" });
    } catch (err) {
        console.error("Mark As Read Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();
        await pool.request()
            .input('UserID', sql.Int, userID)
            .query(`UPDATE Notifications SET IsRead = 1 WHERE UserID = @UserID AND IsRead = 0`);
        res.json({ message: "All marked as read" });
    } catch (err) {
        console.error("Mark All As Read Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
