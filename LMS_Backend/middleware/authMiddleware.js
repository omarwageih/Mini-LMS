const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/db');

// ================= VERIFY JWT TOKEN =================
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            type: decoded.type
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

// ================= ROLE CHECK =================
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated." });
        }

        if (!roles.includes(req.user.type)) {
            return res.status(403).json({ message: "Access denied. Insufficient permissions." });
        }

        next();
    };
};

// ================= ASSISTANT COURSE AUTHORIZATION =================
// Checks if assistant is assigned to the course via Course_Assistants table
const requireCourseAssistant = async (req, res, next) => {
    try {
        const assistantID = req.user.id;
        const courseID = req.params.courseId || req.body.courseId || req.body.CourseID;

        if (!courseID) {
            return res.status(400).json({ message: "Course ID is required." });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('AssistantID', sql.Int, assistantID)
            .input('CourseID', sql.Int, courseID)
            .query('SELECT * FROM Course_Assistants WHERE AssistantID = @AssistantID AND CourseID = @CourseID');

        if (result.recordset.length === 0) {
            return res.status(403).json({ message: "You are not assigned to this course." });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { verifyToken, requireRole, requireCourseAssistant };
