const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function validateSchema() {
    try {
        await sql.connect(dbConfig);
        console.log("--- TABLE LIST ---");
        const tables = await sql.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        for (let table of tables.recordset) {
            console.log(`Table: ${table.TABLE_NAME}`);
            const columns = await sql.query(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table.TABLE_NAME}'`);
            columns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE})`);
            });
        }
        process.exit(0);
    } catch (err) {
        console.error("Validation Error:", err.message);
        process.exit(1);
    }
}
validateSchema();
