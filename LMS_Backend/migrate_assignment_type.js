require('dotenv').config();
const { getPool, sql } = require('./config/db');

async function migrate() {
    try {
        const pool = await getPool();
        console.log("Connected to database. Altering Assignment table...");
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Assignment') AND name = 'Type')
            BEGIN
                ALTER TABLE Assignment ADD Type VARCHAR(50) DEFAULT 'Assignment';
            END
        `);
        
        console.log("Migration successful: Type column added to Assignment table.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
