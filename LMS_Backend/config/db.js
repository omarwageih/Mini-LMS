const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'lms_user',
    password: process.env.DB_PASSWORD || 'MiniLms2024',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'Mini_University_LMS',
    port: parseInt(process.env.DB_PORT) || 60563,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// 🔥 الحل الصح
let pool;

const getPool = async () => {
    try {
        if (!pool) {
            pool = await sql.connect(config);
            console.log("Connected to SQL Server");
        }
        return pool;
    } catch (err) {
        console.log("DB Error:", err);
        throw err; // 🔴 مهم عشان يظهر error صح
    }
};

module.exports = { sql, getPool };
