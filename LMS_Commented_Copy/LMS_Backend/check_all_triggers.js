require('dotenv').config();
const { getPool } = require('./config/db');

async function checkAllTriggers() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                t.name AS TriggerName,
                OBJECT_NAME(t.parent_id) AS TableName,
                m.definition AS TriggerDefinition
            FROM sys.triggers t
            INNER JOIN sys.sql_modules m ON t.object_id = m.object_id
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAllTriggers();
