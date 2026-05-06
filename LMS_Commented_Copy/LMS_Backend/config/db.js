/**
 * DATABASE CONNECTION CONFIGURATION
 * This file establishes the bridge between the Node.js application and 
 * the Microsoft SQL Server database.
 */

const sql = require('mssql');

// 1. AUTHENTICATION MODE DETECTION
// We support two ways to connect:
// A. Windows Authentication (using your computer's login) - used if DB_USER is empty.
// B. SQL Authentication (using a username/password) - used if DB_USER is provided.
const useWindowsAuth = !process.env.DB_USER || process.env.DB_USER.trim() === '';

// 2. CONNECTION PARAMETERS
const config = {
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS', // The network address of the SQL instance
    database: process.env.DB_NAME || 'MiniLMS',              // The specific database we want to use
    port: parseInt(process.env.DB_PORT) || 1433,              // The communication port (1433 is standard)
    options: {
        encrypt: false,                                       // Should be true for cloud-hosted DBs (like Azure)
        trustServerCertificate: true,                        // Allows local dev connections without SSL certs
        trustedConnection: useWindowsAuth                     // Enables Windows-native login logic
    }
};

// Apply SQL-specific login details only if Windows Auth is NOT being used
if (!useWindowsAuth) {
    config.user     = process.env.DB_USER;
    config.password = process.env.DB_PASSWORD;
}

/**
 * CONNECTION POOL (SINGLETON)
 * Opening a new connection for every single request is slow. 
 * A "Pool" keeps several connections open and "recycles" them for better speed.
 */
let pool; 

const getPool = async () => {
    try {
        // Only connect if we don't already have an active pool
        if (!pool) {
            pool = await sql.connect(config);
            console.log(`✅ Database Linked successfully via ${useWindowsAuth ? 'Windows Authentication' : 'SQL Login'}`);
        }
        return pool;
    } catch (err) {
        console.error('❌ Database Link Failed:', err.message);
        throw err; // Rethrow to prevent app from running without a database
    }
};

module.exports = { sql, getPool };

