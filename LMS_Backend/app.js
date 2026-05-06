/**
 * Main Entry Point for the LMS Backend API
 * This file initializes the Express server, applies middleware, and sets up routes.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize Express application
const app = express();

// ===== Security Middleware =====
// Helmet helps secure the app by setting various HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration to allow requests from the frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parsers for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware: Logs the method, URL, status code, and duration of each request
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// ===== Rate Limiting (Optional/Disabled for Dev) =====
// Prevents brute force and DoS attacks by limiting requests per IP
// const globalLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 10000, // Increased for dev
//     message: { message: 'General API limit reached. Please try again later.' },
//     standardHeaders: true,
//     legacyHeaders: false
// });
// app.use('/api/', globalLimiter);

// ===== Static File Hosting =====
// Serve uploaded files (assignments, submissions) so they can be accessed via URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Route Definitions =====
// Import routes for different modules
const authRoutes = require('./routes/authRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const studentRoutes = require('./routes/studentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Mount routes to the API path
app.use('/api/auth', authRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// ===== Server & Socket Initialization =====
const runMigrations = require('./database/migrate');
const http = require('http');
const { initSocket } = require('./socket');

// Create HTTP server instance
const server = http.createServer(app);

// Initialize WebSockets for real-time notifications/updates
initSocket(server);

// Start the server and run database migrations
server.listen(process.env.PORT || 3000, async () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
    await runMigrations(); // Ensures the database schema is up-to-date
});