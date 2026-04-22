const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Controllers
const userController = require('../controllers/userController');
const studentController = require('../controllers/studentController');
const instructorController = require('../controllers/instructorController');
const assistantController = require('../controllers/assistantController');
const courseController = require('../controllers/courseController');
const notificationController = require('../controllers/notificationController');
const activityLogController = require('../controllers/activityLogController');

// ==========================================
// USER ROUTES
// ==========================================
router.get('/users', verifyToken, checkRole(['Instructor', 'Assistant']), userController.getAllUsers);
router.get('/users/:id', verifyToken, userController.getUserById);
router.put('/users/:id', verifyToken, userController.updateUser);
router.delete('/users/:id', verifyToken, checkRole(['Instructor']), userController.deleteUser);

// ==========================================
// STUDENT ROUTES
// ==========================================
router.get('/student/dashboard', verifyToken, checkRole(['Student']), studentController.getStudentDashboard);
router.get('/student/courses', verifyToken, checkRole(['Student']), studentController.getStudentCourses);
router.get('/student/attendance', verifyToken, checkRole(['Student']), studentController.getStudentAttendance);
router.get('/student/assignments', verifyToken, checkRole(['Student']), studentController.getStudentAssignments);
router.get('/student/quizzes', verifyToken, checkRole(['Student']), studentController.getStudentQuizzes);

// ==========================================
// INSTRUCTOR ROUTES
// ==========================================
router.get('/instructor/dashboard', verifyToken, checkRole(['Instructor']), instructorController.getInstructorDashboard);
router.get('/instructor/courses/:courseId/students', verifyToken, checkRole(['Instructor']), instructorController.getCourseStudents);
router.post('/instructor/grade', verifyToken, checkRole(['Instructor']), instructorController.updateStudentGrade);
router.post('/instructor/sync-grades', verifyToken, checkRole(['Instructor']), instructorController.syncGrades);
router.post('/instructor/attendance', verifyToken, checkRole(['Instructor']), instructorController.recordAttendance);

// ==========================================
// ASSISTANT ROUTES
// ==========================================
router.get('/assistant/dashboard', verifyToken, checkRole(['Assistant']), assistantController.getAssistantDashboard);
router.get('/assistant/courses/:courseId/submissions', verifyToken, checkRole(['Assistant']), assistantController.getCourseSubmissions);
router.post('/assistant/grade-submission', verifyToken, checkRole(['Assistant']), assistantController.gradeSubmission);

// ==========================================
// COURSE ROUTES
// ==========================================
router.get('/courses', verifyToken, courseController.getAllCourses);
router.get('/courses/:id', verifyToken, courseController.getCourseById);
router.post('/courses', verifyToken, checkRole(['Instructor']), courseController.createCourse);
router.put('/courses/:id', verifyToken, checkRole(['Instructor']), courseController.updateCourse);
router.delete('/courses/:id', verifyToken, checkRole(['Instructor']), courseController.deleteCourse);
router.post('/courses/:id/enroll', verifyToken, checkRole(['Instructor', 'Assistant']), courseController.enrollStudent);

// ==========================================
// NOTIFICATION ROUTES
// ==========================================
router.get('/notifications', verifyToken, notificationController.getNotifications);
router.get('/notifications/unread-count', verifyToken, notificationController.getUnreadCount);
router.put('/notifications/:id/read', verifyToken, notificationController.markAsRead);
router.put('/notifications/read-all', verifyToken, notificationController.markAllAsRead);

// ==========================================
// ACTIVITY LOG ROUTES
// ==========================================
router.get('/activity-log', verifyToken, checkRole(['Instructor']), activityLogController.getActivityLog);
router.get('/activity-log/my', verifyToken, activityLogController.getMyActivity);

module.exports = router;
