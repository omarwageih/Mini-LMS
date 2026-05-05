const { sql, getPool } = require('../config/db');

/**
 * GET /api/student/discussions/:courseId
 * Fetch all posts for a course.
 */
const getDiscussionPosts = async (req, res) => {
    try {
        const { courseId } = req.params;
        const pool = await getPool();
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
 * POST /api/student/discussions
 * Create a new post.
 */
const createDiscussionPost = async (req, res) => {
    try {
        const { courseId, title, content } = req.body;
        const userID = req.user.id;
        const pool = await getPool();
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
 * GET /api/student/discussions/replies/:postId
 * Fetch all replies for a post.
 */
const getDiscussionReplies = async (req, res) => {
    try {
        const { postId } = req.params;
        const pool = await getPool();
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
 * POST /api/student/discussions/reply
 * Create a new reply.
 */
const createDiscussionReply = async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userID = req.user.id;
        const pool = await getPool();
        
        // Insert reply
        await pool.request()
            .input('PostID', sql.Int, postId)
            .input('UserID', sql.Int, userID)
            .input('Content', sql.NVarChar, content)
            .query(`INSERT INTO DiscussionReplies (PostID, UserID, Content) VALUES (@PostID, @UserID, @Content)`);

        // Notify post owner
        try {
            const postResult = await pool.request()
                .input('pId', sql.Int, postId)
                .query('SELECT UserID, Title FROM DiscussionPosts WHERE PostID = @pId');
            
            const post = postResult.recordset[0];
            if (post && post.UserID !== userID) {
                const { createNotification } = require('../utils/helpers');
                const userResult = await pool.request()
                    .input('uId', sql.Int, userID)
                    .query('SELECT FullName FROM Users WHERE UserID = @uId');
                const replierName = userResult.recordset[0]?.FullName || 'Someone';

                await createNotification(
                    post.UserID,
                    'discussion',
                    `New reply to: ${post.Title}`,
                    `${replierName} replied to your post.`,
                    `/discussions/post/${postId}`
                );
            }
        } catch (notifErr) {
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
