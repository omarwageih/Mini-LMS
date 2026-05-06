const express = require('express');
const router = express.Router();
const { materialsUpload } = require('../middleware/upload');
const { verifyToken, requireRole, requireCourseAssistant } = require('../middleware/authMiddleware');
const { validate, createAssignmentSchema, assistantGradeSubmissionSchema } = require('../middleware/validation');
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

// All routes require Assistant role
router.use(verifyToken, requireRole('Assistant'));

// ===== Assigned Courses =====
router.get('/courses', getMyCourses);
router.get('/courses/:courseId/details', getCourseContent);

// ===== Assignments (with course authorization) =====
router.post('/assignments', requireCourseAssistant, validate(createAssignmentSchema), createAssignment);

// ===== Submissions =====
router.get('/submissions', getSubmissions);
router.post('/submissions/grade', validate(assistantGradeSubmissionSchema), gradeSubmission);

// ===== Course Materials (with course authorization where applicable) =====
router.get('/courses/:courseId/materials', requireCourseAssistant, getCourseMaterials);
router.post('/courses/materials', materialsUpload.single('file'), requireCourseAssistant, uploadCourseMaterial);
router.delete('/courses/materials/:id', requireCourseAssistant, deleteCourseMaterial);
router.get('/courses/:courseId/participants', requireCourseAssistant, getCourseParticipants);
router.get('/courses/:courseId/grades', requireCourseAssistant, getCourseGrades);
router.get('/courses/:courseId/attendance', requireCourseAssistant, getCourseAttendance);
router.post('/attendance/mark', requireCourseAssistant, markAttendance);
router.post('/lectures', requireCourseAssistant, addLecture);
router.get('/courses/:courseId/quizzes', requireCourseAssistant, getCourseQuizzes);

// ===== Discussions =====
router.get('/discussions/:courseId', requireCourseAssistant, getDiscussionPosts);
router.post('/discussions', requireCourseAssistant, createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies);
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
