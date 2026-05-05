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
        const courseId = req.params.courseId || req.body.courseId;

        if (!courseId) {
            console.log("requireCourseAssistant: Course ID missing for URL:", req.originalUrl);
            return res.status(400).json({ message: "Course ID is required." });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('AssistantID', sql.Int, assistantID)
            .input('CourseID', sql.Int, courseId)
            .query('SELECT * FROM Course_Assistants WHERE AssistantID = @AssistantID AND CourseID = @CourseID');

        if (result.recordset.length === 0) {
            return res.status(403).json({ message: "You are not assigned to this course." });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ================= STUDENT ENROLLMENT AUTHORIZATION =================
// Checks if the student is enrolled in the course
const requireEnrollment = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        // Check params or body for courseId or assignmentId
        let courseId = req.params.courseId || (req.body && req.body.courseId);
        const assignmentId = req.body && (req.body.assignmentId || req.body.assignmentID);

        const pool = await getPool();

        // If assignmentId is provided but not courseId, fetch courseId from Assignment table
        if (!courseId && assignmentId) {
            const assignResult = await pool.request()
                .input('id', sql.Int, assignmentId)
                .query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
            
            if (assignResult.recordset.length > 0) {
                courseId = assignResult.recordset[0].CourseID;
            }
        }

        if (!courseId) {
            console.log("requireEnrollment: Course ID missing for URL:", req.originalUrl);
            return res.status(400).json({ message: "Course ID or Assignment ID is required for enrollment check." });
        }

        const result = await pool.request()
            .input('studentId', sql.Int, studentId)
            .input('courseId', sql.Int, courseId)
            .query('SELECT 1 FROM Enrollment WHERE StudentID = @studentId AND CourseID = @courseId');

        if (result.recordset.length === 0) {
            return res.status(403).json({ message: "Access denied. You are not enrolled in this course." });
        }

        next();
    } catch (err) {
        res.status(500).json({ message: "Authorization error", error: err.message });
    }
};

// ================= INSTRUCTOR COURSE OWNERSHIP AUTHORIZATION =================
// Checks if the instructor owns the course
const requireCourseOwner = async (req, res, next) => {
    try {
        const instructorID = req.user.id;
        let courseId = req.params.courseId || req.body.courseId;
        const pool = await getPool();

        // If courseId is not direct, try to derive from weekId
        if (!courseId) {
            const weekId = req.body.weekId;
            if (weekId) {
                const weekRes = await pool.request()
                    .input('wId', sql.Int, weekId)
                    .query('SELECT CourseID FROM StudyWeek WHERE Week_ID = @wId');
                if (weekRes.recordset.length > 0) {
                    courseId = weekRes.recordset[0].CourseID;
                }
            }
        }

        if (!courseId) {
            console.log(`[Auth] Course ID missing for ${req.method} ${req.originalUrl}`);
            return res.status(400).json({ message: "Course ID is required for authorization." });
        }

        const result = await pool.request()
            .input('InstructorID', sql.Int, instructorID)
            .input('CourseID', sql.Int, courseId)
            .query('SELECT 1 FROM Course WHERE CourseID = @CourseID AND InstructorID = @InstructorID');

        if (result.recordset.length === 0) {
            console.warn(`[Auth] Unauthorized access attempt by Instructor ${instructorID} to Course ${courseId}`);
            return res.status(403).json({ message: "Access denied. You do not own this course." });
        }

        next();
    } catch (err) {
        console.error("[Auth Error]", err);
        res.status(500).json({ error: "Internal authorization error" });
    }
};

module.exports = { verifyToken, requireRole, requireCourseAssistant, requireCourseOwner, requireEnrollment };

