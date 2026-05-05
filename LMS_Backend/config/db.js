const sql = require('mssql');

// If DB_USER is empty, use Windows Authentication (trusted connection)
const useWindowsAuth = !process.env.DB_USER || process.env.DB_USER.trim() === '';

const config = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'MiniLMS',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: useWindowsAuth
    }
};

// Only add user/password when NOT using Windows Auth
if (!useWindowsAuth) {
    config.user     = process.env.DB_USER;
    config.password = process.env.DB_PASSWORD;
}

let pool;

const getPool = async () => {
    try {
        if (!pool) {
            pool = await sql.connect(config);
            console.log(`✅ Connected to SQL Server (${useWindowsAuth ? 'Windows Auth' : 'SQL Auth'})`);
        }
        return pool;
    } catch (err) {
        console.error('❌ DB Connection Error:', err.message);
        throw err;
    }
};

module.exports = { sql, getPool };
