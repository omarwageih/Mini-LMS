const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
    getDashboard,
    getMyCourses,
    getCourseContent,
    getAssignments,
    submitAssignment,
    getGrades
} = require('../controllers/studentController');

// All routes require Student role
router.use(verifyToken, requireRole('Student'));

// ===== Dashboard =====
router.get('/dashboard', getDashboard);

// ===== Courses =====
router.get('/courses', getMyCourses);
router.get('/courses/:courseId/content', getCourseContent);

// ===== Assignments =====
router.get('/assignments', getAssignments);
router.post('/assignments/submit', upload.single('file'), submitAssignment);

// ===== Grades =====
router.get('/grades', getGrades);

module.exports = router;
