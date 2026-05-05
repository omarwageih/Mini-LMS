const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireEnrollment } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');
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
    createDiscussionReply,
    updateProfile,
    getCourseParticipants
} = require('../controllers/studentController');

// All routes require Student role
router.use(verifyToken, requireRole('Student'));

const { validate, updateProfileSchema } = require('../middleware/validation');

// ===== Dashboard & Profile =====
router.get('/dashboard', getDashboard);
router.put('/profile', validate(updateProfileSchema), updateProfile);

// ===== Courses =====
router.get('/courses', getMyCourses);
router.get('/courses/:courseId/content', requireEnrollment, getCourseContent);
router.get('/courses/:courseId/materials', requireEnrollment, getCourseMaterials);
router.get('/courses/:courseId/announcements', requireEnrollment, getCourseAnnouncements);
router.get('/courses/:courseId/participants', requireEnrollment, getCourseParticipants);

// ===== Assignments =====
router.get('/assignments', getAssignments);
router.post('/assignments/submit', upload.single('file'), requireEnrollment, submitAssignment);

// ===== Grades =====
router.get('/grades', getGrades);

// ===== Calendar =====
router.get('/calendar', getCalendarEvents);

// ===== Discussion Forums =====
router.get('/discussions/:courseId', requireEnrollment, getDiscussionPosts);
router.post('/discussions', requireEnrollment, createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies); // Note: PostID check would be more complex, keeping simple for now
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
