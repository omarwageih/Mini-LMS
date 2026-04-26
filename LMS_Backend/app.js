require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Routes =====
const authRoutes = require('./routes/authRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const studentRoutes = require('./routes/studentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/student', studentRoutes);

const runMigrations = require('./migrate');

app.listen(3000, async () => {
    console.log("Server running on port 3000");
    await runMigrations();
});