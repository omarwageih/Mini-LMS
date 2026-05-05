const { sql, getPool } = require('./config/db');

async function migrate() {
    try {
        console.log("Connecting to database...");
        const pool = await getPool();
        
        console.log("Creating DiscussionPosts table...");
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DiscussionPosts' and xtype='U')
            BEGIN
                CREATE TABLE DiscussionPosts (
                    PostID      INT           IDENTITY(1,1) PRIMARY KEY,
                    CourseID    INT           NOT NULL,
                    UserID      INT           NOT NULL,
                    Title       VARCHAR(200)  NOT NULL,
                    Content     VARCHAR(MAX)  NOT NULL,
                    IsPinned    BIT           DEFAULT 0,
                    CreatedAt   DATETIME      DEFAULT GETDATE(),
                    FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE,
                    FOREIGN KEY (UserID)   REFERENCES Users(UserID)
                )
            END
        `);
        console.log("DiscussionPosts created or already exists.");

        console.log("Creating DiscussionReplies table...");
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DiscussionReplies' and xtype='U')
            BEGIN
                CREATE TABLE DiscussionReplies (
                    ReplyID     INT           IDENTITY(1,1) PRIMARY KEY,
                    PostID      INT           NOT NULL,
                    UserID      INT           NOT NULL,
                    Content     VARCHAR(MAX)  NOT NULL,
                    CreatedAt   DATETIME      DEFAULT GETDATE(),
                    FOREIGN KEY (PostID) REFERENCES DiscussionPosts(PostID) ON DELETE CASCADE,
                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                )
            END
        `);
        console.log("DiscussionReplies created or already exists.");

        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
