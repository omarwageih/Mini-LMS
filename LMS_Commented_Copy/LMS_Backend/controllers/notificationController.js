/**
 * NOTIFICATION CONTROLLER
 * Manages the delivery and status (read/unread) of alerts for users.
 * These alerts include grade updates, course materials, and discussion replies.
 */
const { sql, getPool } = require('../config/db');

/**
 * FETCH NOTIFICATIONS
 * Retrieves the 50 most recent alerts for the logged-in user.
 */
const getNotifications = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();
        
        // Fetch historical alerts for the notification tray
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

/**
 * GET UNREAD COUNT
 * Counts how many notifications the user hasn't seen yet.
 * Used for the "red dot" or badge count on the bell icon.
 */
const getUnreadCount = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();
        
        // Simple count of rows where IsRead is false
        const result = await pool.request()
            .input('UserID', sql.Int, userID)
            .query(`SELECT COUNT(*) AS count FROM Notifications WHERE UserID = @UserID AND IsRead = 0`);
        
        res.json({ count: result.recordset[0].count });
    } catch (err) {
        console.error("Get Unread Count Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

/**
 * MARK AS READ
 * Updates a single notification's status when the user clicks on it.
 */
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userID = req.user.id;
        const pool = await getPool();
        
        // Update specific ID, ensuring it belongs to the current user for security
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

/**
 * MARK ALL AS READ
 * Clears all pending alerts at once.
 */
const markAllAsRead = async (req, res) => {
    try {
        const userID = req.user.id;
        const pool = await getPool();
        
        // Batch update all unread notifications for this user
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
