require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ===== Security Middleware =====
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Rate Limiting =====
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many password reset requests. Please try again later.' }
});

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Routes =====
const authRoutes = require('./routes/authRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const studentRoutes = require('./routes/studentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Apply rate limiters to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

const runMigrations = require('./migrate');

app.listen(process.env.PORT || 3000, async () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
    await runMigrations();
});