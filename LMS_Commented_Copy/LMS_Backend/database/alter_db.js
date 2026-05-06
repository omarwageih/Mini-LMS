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

async function alterTable() {
    try {
        await sql.connect(dbConfig);
        console.log("Connected to DB!");
        
        // Check if Week_ID already exists
        const checkResult = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Lecture' AND COLUMN_NAME = 'Week_ID'
        `);
        
        if (checkResult.recordset.length === 0) {
            await sql.query(`
                ALTER TABLE Lecture 
                ADD Week_ID INT NULL;
                
                ALTER TABLE Lecture 
                ADD CONSTRAINT FK_Lecture_Week 
                FOREIGN KEY (Week_ID) REFERENCES StudyWeek(Week_ID) ON DELETE NO ACTION;
            `);
            console.log("Week_ID added to Lecture table.");
        } else {
            console.log("Week_ID already exists in Lecture table.");
        }
        
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}
alterTable();
