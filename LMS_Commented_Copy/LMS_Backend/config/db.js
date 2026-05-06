/**
 * Database Configuration & Connection Pool
 * This file handles the connection to the SQL Server database using mssql.
 */

const sql = require('mssql');

// Determine authentication mode based on environment variables
// If DB_USER is empty, the app will attempt to use Windows Authentication (NTLM/Trusted Connection)
const useWindowsAuth = !process.env.DB_USER || process.env.DB_USER.trim() === '';

const config = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS', // Server instance name
    database: process.env.DB_NAME || 'MiniLMS',              // Database name
    port: parseInt(process.env.DB_PORT) || 1433,              // Default SQL Server port
    options: {
        encrypt: false,                                       // Set to true if using Azure or encryption
        trustServerCertificate: true,                        // Required for self-signed certificates in dev
        trustedConnection: useWindowsAuth                     // Flag for Windows Auth
    }
};

// Only add SQL credentials when not using Windows Auth
if (!useWindowsAuth) {
    config.user     = process.env.DB_USER;
    config.password = process.env.DB_PASSWORD;
}

let pool; // Singleton connection pool instance

/**
 * Retrieves the database connection pool
 * Connects to the server if a pool doesn't exist yet.
 * @returns {Promise<sql.ConnectionPool>}
 */
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

