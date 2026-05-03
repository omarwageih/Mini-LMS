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
    getGrades,
    getCourseMaterials,
    getCourseAnnouncements,
    getCalendarEvents,
    getDiscussionPosts,
    createDiscussionPost,
    getDiscussionReplies,
    createDiscussionReply
} = require('../controllers/studentController');

// All routes require Student role
router.use(verifyToken, requireRole('Student'));

// ===== Dashboard =====
router.get('/dashboard', getDashboard);

// ===== Courses =====
router.get('/courses', getMyCourses);
router.get('/courses/:courseId/content', getCourseContent);
router.get('/courses/:courseId/materials', getCourseMaterials);
router.get('/courses/:courseId/announcements', getCourseAnnouncements);

// ===== Assignments =====
router.get('/assignments', getAssignments);
router.post('/assignments/submit', upload.single('file'), submitAssignment);

// ===== Grades =====
router.get('/grades', getGrades);

// ===== Calendar =====
router.get('/calendar', getCalendarEvents);

// ===== Discussion Forums =====
router.get('/discussions/:courseId', getDiscussionPosts);
router.post('/discussions', createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies);
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
