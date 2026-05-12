const { getPool, sql } = require('../config/db');
const { getIO } = require('../socket');

/**
 * Send a direct message to another user
 */
const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = parseInt(req.user.id);
        const targetId = parseInt(receiverId);

        if (!targetId || !content) {
            return res.status(400).json({ message: "Receiver ID and content are required." });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('senderId', sql.Int, senderId)
            .input('receiverId', sql.Int, targetId)
            .input('content', sql.NVarChar, content)
            .query(`
                INSERT INTO Messages (SenderID, ReceiverID, Content)
                OUTPUT INSERTED.*
                VALUES (@senderId, @receiverId, @content)
            `);

        const newMessage = result.recordset[0];

        // Create notification for receiver
        try {
            const senderName = req.user.name || 'User';
            await pool.request()
                .input('uId', sql.Int, targetId)
                .input('type', sql.NVarChar, 'Message')
                .input('title', sql.NVarChar, 'New Message')
                .input('msg', sql.NVarChar, `${senderName} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`)
                .input('link', sql.NVarChar, '/messages')
                .query(`
                    INSERT INTO Notifications (UserID, Type, Title, Message, Link)
                    VALUES (@uId, @type, @title, @msg, @link)
                `);
        } catch (notifErr) {
            console.error('Failed to create notification:', notifErr);
        }

        // Emit via Socket.io
        try {
            const io = getIO();
            const senderName = req.user.name || 'User';
            
            // Notify receiver
            io.to(`user_${targetId}`).emit('receive_message', {
                ...newMessage,
                SenderName: senderName
            });
            // Emit notification event
            io.to(`user_${targetId}`).emit('notification', {
                Type: 'Message',
                Title: 'New Message',
                Message: `${senderName} sent you a message.`,
                Link: '/messages',
                CreatedAt: new Date().toISOString(),
                IsRead: false
            });
            // Also notify sender (for multi-device sync)
            io.to(`user_${senderId}`).emit('message_sent', newMessage);
        } catch (socketErr) {
            console.error('Socket emission failed:', socketErr);
            // Don't fail the whole request if only socket fails
        }

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Send message error details:', {
            error: err.message,
            stack: err.stack,
            body: req.body,
            user: req.user
        });
        res.status(500).json({ message: "Failed to send message.", details: err.message });
    }
};

/**
 * Get conversation history with a specific user
 */
const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user.id;

        const pool = await getPool();
        const result = await pool.request()
            .input('myId', sql.Int, myId)
            .input('otherId', sql.Int, userId)
            .query(`
                SELECT m.*, u.FullName as SenderName, u.ProfilePicture as SenderAvatar
                FROM Messages m
                JOIN Users u ON m.SenderID = u.UserID
                WHERE (SenderID = @myId AND ReceiverID = @otherId)
                   OR (SenderID = @otherId AND ReceiverID = @myId)
                ORDER BY CreatedAt ASC
            `);

        // Mark messages as read
        await pool.request()
            .input('myId', sql.Int, myId)
            .input('otherId', sql.Int, userId)
            .query(`
                UPDATE Messages 
                SET IsRead = 1 
                WHERE ReceiverID = @myId AND SenderID = @otherId AND IsRead = 0
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Get conversation error:', err);
        res.status(500).json({ message: "Failed to fetch messages." });
    }
};

/**
 * Get list of all conversations for the current user
 */
const getChatList = async (req, res) => {
    try {
        const myId = parseInt(req.user.id);
        if (isNaN(myId)) {
            console.error('Invalid User ID in getChatList:', req.user.id);
            return res.status(401).json({ message: "Invalid user session." });
        }

        const pool = await getPool();
        
        const result = await pool.request()
            .input('myId', sql.Int, myId)
            .query(`
                WITH LastMessages AS (
                    SELECT 
                        CASE WHEN SenderID = @myId THEN ReceiverID ELSE SenderID END as OtherUserID,
                        Content,
                        CreatedAt,
                        IsRead,
                        SenderID,
                        ROW_NUMBER() OVER (PARTITION BY CASE WHEN SenderID = @myId THEN ReceiverID ELSE SenderID END ORDER BY CreatedAt DESC) as rn
                    FROM Messages
                    WHERE SenderID = @myId OR ReceiverID = @myId
                )
                SELECT 
                    lm.OtherUserID as UserID,
                    u.FullName,
                    u.ProfilePicture,
                    u.UserType,
                    lm.Content as LastMessage,
                    lm.CreatedAt as LastMessageAt,
                    lm.IsRead,
                    lm.SenderID,
                    (SELECT COUNT(*) FROM Messages WHERE SenderID = lm.OtherUserID AND ReceiverID = @myId AND IsRead = 0) as UnreadCount
                FROM LastMessages lm
                JOIN Users u ON lm.OtherUserID = u.UserID
                WHERE lm.rn = 1
                ORDER BY lm.CreatedAt DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Get chat list error [500]:', err.message);
        console.error(err.stack);
        res.status(500).json({ message: "Failed to fetch conversations.", details: err.message });
    }
};

/**
 * Send a file attachment
 */
const sendAttachment = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        
        const receiverId = parseInt(req.body.receiverId);
        const senderId = parseInt(req.user.id);
        const fileName = req.file.originalname;
        const fileUrl = `/uploads/messages/${req.file.filename}`;
        
        const pool = await getPool();
        const result = await pool.request()
            .input('senderId', sql.Int, senderId)
            .input('receiverId', sql.Int, receiverId)
            .input('content', sql.NVarChar, `[FILE:${fileName}](${fileUrl})`)
            .query(`
                INSERT INTO Messages (SenderID, ReceiverID, Content)
                OUTPUT INSERTED.*
                VALUES (@senderId, @receiverId, @content)
            `);

        const newMessage = result.recordset[0];

        try {
            const io = getIO();
            io.to(`user_${receiverId}`).emit('receive_message', {
                ...newMessage,
                SenderName: req.user.name
            });
            io.to(`user_${senderId}`).emit('message_sent', newMessage);
        } catch (sErr) {}

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Attachment upload error:', err);
        res.status(500).json({ message: "Failed to upload file." });
    }
};

module.exports = {
    sendMessage,
    getConversation,
    getChatList,
    sendAttachment
};
