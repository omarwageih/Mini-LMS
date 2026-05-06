/**
 * STUDENT ROUTES
 * Defines the API endpoints for Student access.
 * These routes allow students to view materials, submit work, and check progress.
 */
const express = require('express');
const router = express.Router();

// Middleware: For security and enrollment verification
const { verifyToken, requireRole, requireEnrollment } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');
const { validate, updateProfileSchema } = require('../middleware/validation');

// Controllers: Business logic for student actions
const {
    getDashboard, getMyCourses, getCourseContent, getAssignments,
    submitAssignment, getGrades, getCourseMaterials, getCourseAnnouncements,
    getCalendarEvents, updateProfile, getCourseParticipants
} = require('../controllers/studentController');

const { getCourseAttendance, getCourseQuizzes } = require('../controllers/courseController');
const { getDiscussionPosts, createDiscussionPost, getDiscussionReplies, createDiscussionReply } = require('../controllers/discussionController');

/**
 * GLOBAL MIDDLEWARE
 * All routes here require the user to be a logged-in 'Student'.
 */
router.use(verifyToken, requireRole('Student'));

// ---------------------------------------------------------
// DASHBOARD & PROFILE
// ---------------------------------------------------------
router.get('/dashboard', getDashboard); // Get summary of GPA, courses, and pending tasks
router.put('/profile', validate(updateProfileSchema), updateProfile); // Update contact info

// ---------------------------------------------------------
// COURSE INTERACTION
// ---------------------------------------------------------
// requireEnrollment ensures students can only see data for courses they are actually registered for
router.get('/courses', getMyCourses); // List all their courses
router.get('/courses/:courseId/content', requireEnrollment, getCourseContent); // View syllabus/weeks
router.get('/courses/:courseId/materials', requireEnrollment, getCourseMaterials); // Standalone files
router.get('/courses/:courseId/announcements', requireEnrollment, getCourseAnnouncements); // Class updates
router.get('/courses/:courseId/participants', requireEnrollment, getCourseParticipants); // See classmates/staff
router.get('/courses/:courseId/attendance', requireEnrollment, getCourseAttendance); // Check their own attendance
router.get('/courses/:courseId/quizzes', requireEnrollment, getCourseQuizzes); // See their own quiz results

// ---------------------------------------------------------
// ASSIGNMENTS & GRADES
// ---------------------------------------------------------
router.get('/assignments', getAssignments); // View all upcoming deadlines
router.post('/assignments/submit', upload.single('file'), requireEnrollment, submitAssignment); // Upload homework
router.get('/grades', getGrades); // View full grade report

// ---------------------------------------------------------
// CALENDAR & PLANNING
// ---------------------------------------------------------
router.get('/calendar', getCalendarEvents); // Get merged list of lectures and deadlines

// ---------------------------------------------------------
// DISCUSSION FORUMS
// ---------------------------------------------------------
router.get('/discussions/:courseId', requireEnrollment, getDiscussionPosts);
router.post('/discussions', requireEnrollment, createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies);
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
