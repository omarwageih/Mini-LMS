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
            type: decoded.type,
            name: decoded.name
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
const requireCourseAssistant = async (req, res, next) => {
    try {
        const assistantID = req.user.id;
        let courseId = req.params.courseId || req.body?.courseId;

        // Derive courseId if missing
        if (!courseId) {
            const pool = await getPool();
            const lectureId = req.body?.lectureId;
            const assignmentId = req.body?.assignmentId;
            const weekId = req.body?.weekId;
            const materialId = req.params.id;

            if (lectureId) {
                console.log(`[SQL] Querying CourseID for Lecture: ${lectureId}`);
                const qRes = await pool.request().input('id', sql.Int, lectureId).query('SELECT CourseID FROM Lecture WHERE LectureID = @id');
                courseId = qRes.recordset[0]?.CourseID;
            } else if (assignmentId) {
                console.log(`[SQL] Querying CourseID for Assignment: ${assignmentId}`);
                const qRes = await pool.request().input('id', sql.Int, assignmentId).query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
                courseId = qRes.recordset[0]?.CourseID;
            } else if (weekId) {
                console.log(`[SQL] Querying CourseID for StudyWeek: ${weekId}`);
                const qRes = await pool.request().input('id', sql.Int, weekId).query('SELECT CourseID FROM StudyWeek WHERE Week_ID = @id');
                courseId = qRes.recordset[0]?.CourseID;
            } else if (materialId && req.originalUrl.includes('materials')) {
                console.log(`[SQL] Querying CourseID for Material: ${materialId}`);
                const qRes1 = await pool.request().input('id', sql.Int, materialId).query('SELECT CourseID FROM CourseMaterials WHERE MaterialID = @id');
                courseId = qRes1.recordset[0]?.CourseID;
                if (!courseId) {
                    const qRes2 = await pool.request().input('id', sql.Int, materialId).query('SELECT CourseID FROM StudyWeek sw JOIN Material m ON sw.Week_ID = m.Week_ID WHERE m.Material_ID = @id');
                    courseId = qRes2.recordset[0]?.CourseID;
                }
            }
        }

        if (!courseId) {
            return res.status(400).json({ message: "Course ID is required for authorization." });
        }

        const pool = await getPool();
        console.log(`[SQL] Verifying Assistant ${assistantID} for Course ${courseId}`);
        const result = await pool.request()
            .input('AssistantID', sql.Int, assistantID)
            .input('CourseID', sql.Int, courseId)
            .query('SELECT 1 FROM Course_Assistants WHERE AssistantID = @AssistantID AND CourseID = @CourseID');

        if (result.recordset.length === 0) {
            console.warn(`[AUTH] Access denied for Assistant ${assistantID} to Course ${courseId}`);
            return res.status(403).json({ message: "Access denied. You are not assigned to this course." });
        }

        next();
    } catch (err) {
        console.error("[CRITICAL] requireCourseAssistant failed:", err);
        res.status(500).json({ error: "Authorization failure", details: err.message });
    }
};

// ================= STUDENT ENROLLMENT AUTHORIZATION =================
const requireEnrollment = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        let courseId = req.params.courseId || req.body?.courseId;
        const assignmentId = req.params.id || (req.body && (req.body.assignmentId || req.body.assignmentID));

        const pool = await getPool();

        if (!courseId && assignmentId) {
            const assignResult = await pool.request()
                .input('id', sql.Int, assignmentId)
                .query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
            courseId = assignResult.recordset[0]?.CourseID;
        }

        if (!courseId) {
            return res.status(400).json({ message: "Course ID is required for enrollment check." });
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
        res.status(500).json({ error: "Authorization failure", details: err.message });
    }
};

// ================= INSTRUCTOR COURSE OWNERSHIP AUTHORIZATION =================
const requireCourseOwner = async (req, res, next) => {
    console.log(`[DEBUG] requireCourseOwner checking: ${req.method} ${req.originalUrl}`);
    try {
        const instructorID = req.user.id;
        let courseId = req.params.courseId || req.body?.courseId;
        const pool = await getPool();

        // Derive courseId if missing
        if (!courseId) {
            const lectureId = req.body?.lectureId;
            const assignmentId = req.body?.assignmentId;
            const weekId = req.body?.weekId;
            const materialId = req.params.id;

            if (lectureId) {
                const dbRes = await pool.request().input('id', sql.Int, lectureId).query('SELECT CourseID FROM Lecture WHERE LectureID = @id');
                courseId = dbRes.recordset[0]?.CourseID;
            } else if (assignmentId || (req.params.id && req.originalUrl.includes('assignments'))) {
                const id = assignmentId || req.params.id;
                const dbRes = await pool.request().input('id', sql.Int, id).query('SELECT CourseID FROM Assignment WHERE AssignmentID = @id');
                courseId = dbRes.recordset[0]?.CourseID;
            } else if (weekId || (req.params.id && req.originalUrl.includes('weeks'))) {
                const id = weekId || req.params.id;
                const dbRes = await pool.request().input('id', sql.Int, id).query('SELECT CourseID FROM StudyWeek WHERE Week_ID = @id');
                courseId = dbRes.recordset[0]?.CourseID;
            } else if (materialId && req.originalUrl.includes('materials')) {
                // Try primary Material table first
                const dbRes2 = await pool.request().input('id', sql.Int, materialId).query('SELECT CourseID FROM StudyWeek sw JOIN Material m ON sw.Week_ID = m.Week_ID WHERE m.Material_ID = @id');
                courseId = dbRes2.recordset[0]?.CourseID;
                
                // Fallback to legacy CourseMaterials if not found
                if (!courseId) {
                    const dbRes1 = await pool.request().input('id', sql.Int, materialId).query('SELECT CourseID FROM CourseMaterials WHERE MaterialID = @id');
                    courseId = dbRes1.recordset[0]?.CourseID;
                }
            } else if (req.params.id && req.originalUrl.includes('lectures')) {
                const dbRes = await pool.request().input('id', sql.Int, req.params.id).query('SELECT CourseID FROM Lecture WHERE LectureID = @id');
                courseId = dbRes.recordset[0]?.CourseID;
            }
        }

        if (!courseId) {
            return res.status(400).json({ message: "Course ID is required for ownership check." });
        }

        const result = await pool.request()
            .input('InstructorID', sql.Int, instructorID)
            .input('CourseID', sql.Int, courseId)
            .query('SELECT 1 FROM Course WHERE CourseID = @CourseID AND InstructorID = @InstructorID');

        if (result.recordset.length === 0) {
            console.warn(`[AUTH] Access denied for Instructor ${instructorID} to Course ${courseId}`);
            return res.status(403).json({ message: "Access denied. You do not own this course." });
        }

        next();
    } catch (err) {
        console.error("[CRITICAL] requireCourseOwner failed:", {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            user: req.user
        });
        res.status(500).json({ error: "Authorization failure", details: err.message });
    }
};

module.exports = { verifyToken, requireRole, requireCourseAssistant, requireCourseOwner, requireEnrollment };

