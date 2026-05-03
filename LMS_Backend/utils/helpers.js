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
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('Type', sql.NVarChar, type)
            .input('Title', sql.NVarChar, title)
            .input('Message', sql.NVarChar, message)
            .input('Link', sql.NVarChar, link)
            .query(`INSERT INTO Notifications (UserID, Type, Title, Message, Link) VALUES (@UserID, @Type, @Title, @Message, @Link)`);
    } catch (err) {
        console.error('Notification create error:', err.message);
    }
};

module.exports = { logAudit, createNotification };
