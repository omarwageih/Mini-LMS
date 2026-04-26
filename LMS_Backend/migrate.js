const { sql, getPool } = require('./config/db');

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

        console.log('All migrations completed successfully.');
    } catch (err) {
        console.error('Migration error:', err.message);
        // Don't crash the server — just log the error
    }
};

module.exports = runMigrations;
