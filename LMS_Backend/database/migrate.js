const { sql, getPool } = require('../config/db');

/**
 * Run database migrations on startup.
 * These are idempotent — safe to run multiple times.
 */
const runMigrations = async () => {
    try {
        const pool = await getPool();
        console.log('Running database migrations...');

        // 1. Add FilePath column to Submission (if it doesn't exist)
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Submission' AND COLUMN_NAME = 'FilePath'
            )
            BEGIN
                ALTER TABLE Submission ADD FilePath VARCHAR(255);
                PRINT 'Added FilePath column to Submission table.';
            END
        `);
        console.log('✅ Migration 1: Submission.FilePath column ensured.');

        // 2. Ensure the seeded instructor exists in Instructors table
        await pool.request().query(`
            IF EXISTS (
                SELECT u.UserID FROM Users u 
                WHERE u.UserType = 'Instructor' 
                AND u.UserID NOT IN (SELECT UserID FROM Instructors)
            )
            BEGIN
                INSERT INTO Instructors (UserID)
                SELECT u.UserID FROM Users u 
                WHERE u.UserType = 'Instructor' 
                AND u.UserID NOT IN (SELECT UserID FROM Instructors);
                PRINT 'Inserted missing instructor(s) into Instructors table.';
            END
        `);
        console.log('✅ Migration 2: Instructors table synced with Users.');

        // Migration 3: Add ProfilePicture column to Users
        const checkPicColumn = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ProfilePicture'");
        if (checkPicColumn.recordset.length === 0) {
            await pool.request().query("ALTER TABLE Users ADD ProfilePicture VARCHAR(MAX) NULL");
            console.log("✅ Migration 3: ProfilePicture column added to Users.");
        }

        // Migration 4: Create CourseMaterials table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CourseMaterials')
            BEGIN
                CREATE TABLE CourseMaterials (
                    MaterialID INT IDENTITY(1,1) PRIMARY KEY,
                    CourseID INT NOT NULL,
                    Title VARCHAR(200) NOT NULL,
                    Description VARCHAR(500),
                    FileUrl VARCHAR(500),
                    FileType VARCHAR(50),
                    UploadedBy INT NOT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
                    FOREIGN KEY (UploadedBy) REFERENCES Users(UserID)
                );
            END
        `);
        console.log('✅ Migration 4: CourseMaterials table ensured.');

        // Migration 5: Create Announcements table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Announcements')
            BEGIN
                CREATE TABLE Announcements (
                    AnnouncementID INT IDENTITY(1,1) PRIMARY KEY,
                    CourseID INT NOT NULL,
                    Title VARCHAR(200) NOT NULL,
                    Content VARCHAR(MAX) NOT NULL,
                    PostedBy INT NOT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
                    FOREIGN KEY (PostedBy) REFERENCES Users(UserID)
                );
            END
        `);
        console.log('✅ Migration 5: Announcements table ensured.');

        // Migration 6: Add database indexes for performance
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email')
                CREATE INDEX IX_Users_Email ON Users(Email);
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Enrollment_StudentID')
                CREATE INDEX IX_Enrollment_StudentID ON Enrollment(StudentID);
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Enrollment_CourseID')
                CREATE INDEX IX_Enrollment_CourseID ON Enrollment(CourseID);
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Submission_AssignmentID')
                CREATE INDEX IX_Submission_AssignmentID ON Submission(AssignmentID);
        `);
        console.log('✅ Migration 6: Database indexes ensured.');

        // 7. Discussion Forums tables
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DiscussionPosts')
            CREATE TABLE DiscussionPosts (
                PostID INT IDENTITY(1,1) PRIMARY KEY,
                CourseID INT NOT NULL FOREIGN KEY REFERENCES Course(CourseID),
                UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                Title NVARCHAR(255) NOT NULL,
                Content NVARCHAR(MAX) NOT NULL,
                IsPinned BIT DEFAULT 0,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        `);
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DiscussionReplies')
            CREATE TABLE DiscussionReplies (
                ReplyID INT IDENTITY(1,1) PRIMARY KEY,
                PostID INT NOT NULL FOREIGN KEY REFERENCES DiscussionPosts(PostID),
                UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                Content NVARCHAR(MAX) NOT NULL,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        `);
        console.log('✅ Migration 7: Discussion forum tables ensured.');

        // 8. Notifications table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Notifications')
            CREATE TABLE Notifications (
                NotificationID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                Type NVARCHAR(50) NOT NULL,
                Title NVARCHAR(255) NOT NULL,
                Message NVARCHAR(MAX),
                Link NVARCHAR(500),
                IsRead BIT DEFAULT 0,
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        `);
        console.log('✅ Migration 8: Notifications table ensured.');

        // 9. Audit Log table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AuditLog')
            CREATE TABLE AuditLog (
                LogID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT,
                Action NVARCHAR(100) NOT NULL,
                Details NVARCHAR(MAX),
                IPAddress NVARCHAR(50),
                CreatedAt DATETIME DEFAULT GETDATE()
            );
        `);
        console.log('✅ Migration 9: AuditLog table ensured.');

        // 10. Account Lockout columns on Users
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'FailedLoginAttempts'
            )
            ALTER TABLE Users ADD FailedLoginAttempts INT DEFAULT 0;
        `);
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LockedUntil'
            )
            ALTER TABLE Users ADD LockedUntil DATETIME NULL;
        `);
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ResetPasswordToken'
            )
            ALTER TABLE Users ADD ResetPasswordToken VARCHAR(255) NULL;
        `);
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ResetPasswordExpires'
            )
            ALTER TABLE Users ADD ResetPasswordExpires DATETIME NULL;
        `);
        console.log('✅ Migration 10: Account lockout and reset columns ensured.');

        // 11. Add Feedback column to Submission
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Submission' AND COLUMN_NAME = 'Feedback'
            )
            ALTER TABLE Submission ADD Feedback NVARCHAR(MAX) NULL;
        `);
        console.log('✅ Migration 11: Submission.Feedback column ensured.');

        // 12. Add StudentCode column to Students
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Students' AND COLUMN_NAME = 'StudentCode'
            )
            ALTER TABLE Students ADD StudentCode VARCHAR(20) UNIQUE;
        `);
        // Migration 13: Sync Course_Grades with Enrollment
        await pool.request().query(`
            INSERT INTO Course_Grades (StudentID, CourseID)
            SELECT e.StudentID, e.CourseID
            FROM Enrollment e
            WHERE NOT EXISTS (
                SELECT 1 FROM Course_Grades cg 
                WHERE cg.StudentID = e.StudentID AND cg.CourseID = e.CourseID
            );
        `);
        // 14. Messages table
        const checkMessages = await pool.request().query("SELECT * FROM sys.tables WHERE name = 'Messages'");
        if (checkMessages.recordset.length === 0) {
            console.log("Running Migration 14: Creating Messages table...");
            await pool.request().query(`
                CREATE TABLE Messages (
                    MessageID INT IDENTITY(1,1) PRIMARY KEY,
                    SenderID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                    ReceiverID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                    Content NVARCHAR(MAX) NOT NULL,
                    IsRead BIT DEFAULT 0,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
            `);
        }
        console.log('✅ Migration 14: Messages table ensured.');

        // Migration 15: Grade Weighting in Course table
        const checkCourseWeights = await pool.request().query("SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Course') AND name = 'AssignmentWeight'");
        if (checkCourseWeights.recordset.length === 0) {
            console.log("Running Migration 15: Adding weight columns to Course table...");
            await pool.request().query(`
                ALTER TABLE Course ADD AssignmentWeight INT DEFAULT 40;
                ALTER TABLE Course ADD QuizWeight INT DEFAULT 20;
                ALTER TABLE Course ADD AttendanceWeight INT DEFAULT 10;
                ALTER TABLE Course ADD FinalWeight INT DEFAULT 30;
            `);
        }
        console.log('✅ Migration 15: Grade weight columns added to Course table.');

        console.log('All migrations completed successfully.');
    } catch (err) {
        console.error('Migration error:', err.message);
        // Don't crash the server — just log the error
    }
};

module.exports = runMigrations;
