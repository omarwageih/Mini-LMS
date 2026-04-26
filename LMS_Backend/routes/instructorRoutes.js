const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
    getAssistants, addAssistant, deleteAssistant, assignAssistantToCourse,
    getStudents, addStudent, deleteStudent, enrollStudent,
    getCourses, createCourse,
    addWeek, addMaterial, addLecture,
    createAssignment,
    getSubmissions
} = require('../controllers/instructorController');

// All routes require Instructor role
router.use(verifyToken, requireRole('Instructor'));

// ===== Assistants =====
router.get('/assistants', getAssistants);
router.post('/assistants', addAssistant);
router.delete('/assistants/:id', deleteAssistant);
router.post('/assistants/assign-course', assignAssistantToCourse);

// ===== Students =====
router.get('/students', getStudents);
router.post('/students', addStudent);
router.delete('/students/:id', deleteStudent);
router.post('/students/enroll', enrollStudent);

// ===== Courses =====
router.get('/courses', getCourses);
router.post('/courses', createCourse);

// ===== Content =====
router.post('/weeks', addWeek);
router.post('/materials', addMaterial);
router.post('/lectures', addLecture);

// ===== Assignments =====
router.post('/assignments', createAssignment);

// ===== Submissions =====
router.get('/submissions', getSubmissions);

module.exports = router;
