const { sql, getPool } = require('../config/db');

/**
 * Log an action to the AuditLog table.
 * @param {number|null} userId - The user performing the action
 * @param {string} action - e.g. 'LOGIN', 'GRADE_SUBMISSION', 'CREATE_COURSE'
 * @param {string} details - Free-text description
 * @param {string} ipAddress - Client IP
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
 * Create an in-app notification for a user.
 * @param {number} userId - Target user
 * @param {string} type - 'grade', 'announcement', 'assignment', 'discussion', 'system'
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 * @param {string} link - Optional navigation link
 */
const createNotification = async (userId, type, title, message = '', link = '') => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('Type', sql.NVarChar, type)
            .input('Title', sql.NVarChar, title)
            .input('Message', sql.NVarChar, message)
            .input('Link', sql.NVarChar, link)
            .query(`INSERT INTO Notifications (UserID, Type, Title, Message, Link) 
                    OUTPUT INSERTED.NotificationID, INSERTED.CreatedAt, INSERTED.IsRead
                    VALUES (@UserID, @Type, @Title, @Message, @Link)`);

        // Real-time emit
        try {
            const { getIO } = require('../socket');
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
            io.to(`user_${userId}`).emit('notification', notificationData);
        } catch (socketErr) {
            console.error('Socket emit error:', socketErr.message);
        }
    } catch (err) {
        console.error('Notification create error:', err.message);
    }
};

const fs = require('fs');
const path = require('path');

const deleteFile = (relativePath) => {
    if (!relativePath) return;
    try {
        const baseDir = path.join(__dirname, '..', 'uploads');
        // Resolve the absolute path and ensure it's within the uploads directory
        const absolutePath = path.resolve(path.join(__dirname, '..', relativePath));
        
        if (!absolutePath.startsWith(baseDir)) {
            console.error(`Security blocked deletion attempt outside uploads: ${absolutePath}`);
            return;
        }

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`Deleted file: ${absolutePath}`);
        }
    } catch (err) {
        console.error(`Error deleting file ${relativePath}:`, err.message);
    }
};

module.exports = { logAudit, createNotification, deleteFile };
