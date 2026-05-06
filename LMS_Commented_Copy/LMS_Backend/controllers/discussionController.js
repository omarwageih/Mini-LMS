/**
 * DISCUSSION CONTROLLER
 * Manages course forum functionality, allowing students and staff to post questions
 * and reply to each other.
 */
const { sql, getPool } = require('../config/db');

/**
 * FETCH DISCUSSION POSTS
 * Retrieves all main forum topics for a specific course.
 */
const getDiscussionPosts = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();
        
        // Fetch posts joined with user details to show who posted them
        const result = await pool.request()
            .input('CourseID', sql.Int, courseId)
            .query(`
                SELECT dp.*, u.FullName AS AuthorName, u.UserType, u.ProfilePicture,
                    (SELECT COUNT(*) FROM DiscussionReplies WHERE PostID = dp.PostID) AS ReplyCount
                FROM DiscussionPosts dp
                JOIN Users u ON dp.UserID = u.UserID
                WHERE dp.CourseID = @CourseID
                ORDER BY dp.IsPinned DESC, dp.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Get Discussion Posts Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

/**
 * CREATE DISCUSSION POST
 * Starts a new thread/topic in the course forum.
 */
const createDiscussionPost = async (req, res) => {
    try {
        const { courseId, title, content } = req.body;
        const userID = req.user.id; // From the auth token
        const pool = await getPool();

        // Save the new post to the database
        await pool.request()
            .input('CourseID', sql.Int, courseId)
            .input('UserID', sql.Int, userID)
            .input('Title', sql.NVarChar, title)
            .input('Content', sql.NVarChar, content)
            .query(`INSERT INTO DiscussionPosts (CourseID, UserID, Title, Content) VALUES (@CourseID, @UserID, @Title, @Content)`);
        
        res.json({ message: "Post created successfully" });
    } catch (err) {
        console.error("Create Discussion Post Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

/**
 * FETCH DISCUSSION REPLIES
 * Retrieves all comments/responses for a specific post.
 */
const getDiscussionReplies = async (req, res) => {
    try {
        const { postId } = req.params;
        const pool = await getPool();
        
        // Fetch replies sorted by time (oldest first for chronological reading)
        const result = await pool.request()
            .input('PostID', sql.Int, postId)
            .query(`
                SELECT dr.*, u.FullName AS AuthorName, u.UserType, u.ProfilePicture
                FROM DiscussionReplies dr
                JOIN Users u ON dr.UserID = u.UserID
                WHERE dr.PostID = @PostID
                ORDER BY dr.CreatedAt ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Get Discussion Replies Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

/**
 * CREATE DISCUSSION REPLY
 * Adds a comment to an existing post and notifies the post owner.
 */
const createDiscussionReply = async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userID = req.user.id;
        const pool = await getPool();
        
        // 1. Database Insert: Save the reply
        await pool.request()
            .input('PostID', sql.Int, postId)
            .input('UserID', sql.Int, userID)
            .input('Content', sql.NVarChar, content)
            .query(`INSERT INTO DiscussionReplies (PostID, UserID, Content) VALUES (@PostID, @UserID, @Content)`);

        // 2. Notification System: Alert the person who started the post
        try {
            // Find who wrote the original post
            const postResult = await pool.request()
                .input('pId', sql.Int, postId)
                .query('SELECT UserID, Title FROM DiscussionPosts WHERE PostID = @pId');
            
            const post = postResult.recordset[0];
            
            // If the replier is not the same person as the poster, send a notification
            if (post && post.UserID !== userID) {
                const { createNotification } = require('../utils/helpers');
                
                // Get the name of the person who replied
                const userResult = await pool.request()
                    .input('uId', sql.Int, userID)
                    .query('SELECT FullName FROM Users WHERE UserID = @uId');
                const replierName = userResult.recordset[0]?.FullName || 'Someone';

                // Send the alert
                await createNotification(
                    post.UserID,
                    'discussion',
                    `New reply to: ${post.Title}`,
                    `${replierName} replied to your post.`,
                    `/discussions/post/${postId}`
                );
            }
        } catch (notifErr) {
            // We don't want to crash the whole reply process if just the notification fails
            console.error("Discussion reply notification failed:", notifErr.message);
        }

        res.json({ message: "Reply posted successfully" });
    } catch (err) {
        console.error("Create Discussion Reply Error:", err);
        res.status(500).json({ message: "An internal server error occurred." });
    }
};

module.exports = {
    getDiscussionPosts,
    createDiscussionPost,
    getDiscussionReplies,
    createDiscussionReply
};
