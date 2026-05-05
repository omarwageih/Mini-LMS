require('dotenv').config();
const { sql, getPool } = require('../config/db');

async function migrate() {
    try {
        const pool = await getPool();
        console.log("Running Performance & Consistency Migrations...");

        // 1. Add indices for common foreign key lookups
        const indices = [
            { table: 'Enrollment', column: 'CourseID', name: 'IX_Enrollment_CourseID' },
            { table: 'Enrollment', column: 'StudentID', name: 'IX_Enrollment_StudentID' },
            { table: 'Submission', column: 'AssignmentID', name: 'IX_Submission_AssignmentID' },
            { table: 'Submission', column: 'StudentID', name: 'IX_Submission_StudentID' },
            { table: 'Material', column: 'Week_ID', name: 'IX_Material_WeekID' },
            { table: 'Lecture', column: 'CourseID', name: 'IX_Lecture_CourseID' },
            { table: 'Lecture', column: 'Week_ID', name: 'IX_Lecture_WeekID' },
            { table: 'DiscussionPosts', column: 'CourseID', name: 'IX_DiscussionPosts_CourseID' },
            { table: 'DiscussionReplies', column: 'PostID', name: 'IX_DiscussionReplies_PostID' },
            { table: 'Notifications', column: 'UserID', name: 'IX_Notifications_UserID' }
        ];

        for (const idx of indices) {
            const checkQuery = `
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.name}' AND object_id = OBJECT_ID('${idx.table}'))
                BEGIN
                    CREATE INDEX ${idx.name} ON ${idx.table} (${idx.column});
                    PRINT 'Created index ${idx.name}';
                END
            `;
            await pool.request().query(checkQuery);
        }

        // 2. Ensure default data consistency
        // (Optional: Add any missing default values or constraints if necessary)

        console.log("Migrations completed successfully.");
    } catch (err) {
        console.error("Migration Error:", err);
    }
}

if (require.main === module) {
    migrate();
}

module.exports = migrate;
