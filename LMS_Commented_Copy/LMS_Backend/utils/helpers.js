/**
 * GLOBAL HELPER UTILITIES
 * Contains reusable functions used across multiple controllers for common tasks
 * like logging, sending alerts, and cleaning up files.
 */
const { sql, getPool } = require('../config/db');

/**
 * AUDIT LOGGING
 * Records every sensitive action (Login, Delete, Grade) into a permanent ledger.
 * This is crucial for security audits and tracking who did what and when.
 */
const logAudit = async (userId, action, details = '', ipAddress = '') => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('Action', sql.NVarChar, action)
            .input('Details', sql.NVarChar, details)
            .input('IPAddress', sql.NVarChar, ipAddress)
            .query(`INSERT INTO AuditLog (UserID, Action, Details, IPAddress) VALUES (@UserID, @Action, @Details, @IPAddress)`);
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
};

/**
 * CREATE NOTIFICATION
 * 1. Saves an alert message to the database so the user sees it when they log in.
 * 2. Uses Socket.io to "push" the alert immediately if the user is currently online.
 */
const createNotification = async (userId, type, title, message = '', link = '') => {
    try {
        const pool = await getPool();
        // Save to DB
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('Type', sql.NVarChar, type)
            .input('Title', sql.NVarChar, title)
            .input('Message', sql.NVarChar, message)
            .input('Link', sql.NVarChar, link)
            .query(`INSERT INTO Notifications (UserID, Type, Title, Message, Link) 
                    OUTPUT INSERTED.NotificationID, INSERTED.CreatedAt, INSERTED.IsRead
                    VALUES (@UserID, @Type, @Title, @Message, @Link)`);

        // Real-time Push via WebSocket
        try {
            const { getIO } = require('../socket'); // Lazy-load to avoid circular dependency
            const io = getIO();
            const notificationData = {
                NotificationID: result.recordset[0].NotificationID,
                UserID: userId,
                Type: type,
                Title: title,
                Message: message,
                Link: link,
                IsRead: result.recordset[0].IsRead,
                CreatedAt: result.recordset[0].CreatedAt
            };
            // Send ONLY to the specific user's room
            io.to(`user_${userId}`).emit('notification', notificationData);
        } catch (socketErr) {
            console.error('Socket emit error (Notification still saved in DB):', socketErr.message);
        }
    } catch (err) {
        console.error('Notification creation failed:', err.message);
    }
};

const fs = require('fs');
const path = require('path');

/**
 * SECURE FILE DELETION
 * Removes a file from the server's hard drive.
 * Includes security checks to prevent "Path Traversal" attacks (deleting system files).
 */
const deleteFile = (relativePath) => {
    if (!relativePath) return;
    try {
        // Define the boundary: Files can only be deleted inside the 'uploads' folder
        const baseDir = path.join(__dirname, '..', 'uploads');
        
        // Resolve path and verify it stays inside the boundary
        const absolutePath = path.resolve(path.join(__dirname, '..', relativePath));
        
        if (!absolutePath.startsWith(baseDir)) {
            console.error(`SECURITY ALERT: Blocked attempt to delete file outside uploads: ${absolutePath}`);
            return;
        }

        // Physically remove the file if it exists
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`System cleaned up file: ${absolutePath}`);
        }
    } catch (err) {
        console.error(`File deletion error for ${relativePath}:`, err.message);
    }
};

module.exports = { logAudit, createNotification, deleteFile };
