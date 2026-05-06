/**
 * ASSISTANT ROUTES
 * Defines the API endpoints for Teaching Assistants.
 * Assistants have limited administrative power compared to Instructors.
 */
const express = require('express');
const router = express.Router();

// Middleware: For security and course-specific permissions
const { materialsUpload } = require('../middleware/upload');
const { verifyToken, requireRole, requireCourseAssistant } = require('../middleware/authMiddleware');
const { validate, createAssignmentSchema, assistantGradeSubmissionSchema } = require('../middleware/validation');

// Controllers: Mapping routes to logical operations
const {
    getCourses, getMyCourses, getCourseContent, addWeek, deleteWeek, addMaterial, deleteMaterial, addLecture, deleteLecture,
    getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
    getCourseParticipants, getCourseGrades,
    getCourseAttendance, markAttendance, getCourseQuizzes
} = require('../controllers/courseController');

const {
    createAssignment, getSubmissions, gradeSubmission
} = require('../controllers/assignmentController');

const { getDiscussionPosts, createDiscussionPost, getDiscussionReplies, createDiscussionReply } = require('../controllers/discussionController');

/**
 * GLOBAL MIDDLEWARE
 * Ensures the user is logged in and is specifically an 'Assistant'.
 */
router.use(verifyToken, requireRole('Assistant'));

// ---------------------------------------------------------
// ASSIGNED COURSES
// ---------------------------------------------------------
router.get('/courses', getMyCourses); // List courses where this assistant is helping
router.get('/courses/:courseId/details', getCourseContent); // View course syllabus/weeks

// ---------------------------------------------------------
// ASSIGNMENTS & GRADING
// ---------------------------------------------------------
// requireCourseAssistant ensures they only manage assignments for courses they are assigned to
router.post('/assignments', requireCourseAssistant, validate(createAssignmentSchema), createAssignment);
router.get('/submissions', getSubmissions); // Get student work for their assigned courses
router.post('/submissions/grade', validate(assistantGradeSubmissionSchema), gradeSubmission); // Grade student work

// ---------------------------------------------------------
// COURSE MANAGEMENT TABS
// ---------------------------------------------------------
router.get('/courses/:courseId/materials', requireCourseAssistant, getCourseMaterials); // Standalone files
router.post('/courses/materials', materialsUpload.single('file'), requireCourseAssistant, uploadCourseMaterial);
router.delete('/courses/materials/:id', deleteCourseMaterial); 

router.get('/courses/:courseId/participants', requireCourseAssistant, getCourseParticipants); // View roster
router.get('/courses/:courseId/grades', requireCourseAssistant, getCourseGrades); // View performance logs
router.get('/courses/:courseId/attendance', requireCourseAssistant, getCourseAttendance); // View attendance
router.post('/attendance/mark', markAttendance); // Record student attendance
router.post('/lectures', requireCourseAssistant, addLecture); // Add new class session
router.get('/courses/:courseId/quizzes', requireCourseAssistant, getCourseQuizzes); // View results

// ---------------------------------------------------------
// DISCUSSION FORUMS
// ---------------------------------------------------------
router.get('/discussions/:courseId', requireCourseAssistant, getDiscussionPosts);
router.post('/discussions', requireCourseAssistant, createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies);
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
