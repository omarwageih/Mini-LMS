const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireCourseAssistant } = require('../middleware/authMiddleware');
const { validate, createAssignmentSchema, assistantGradeSubmissionSchema } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const {
    getAssignedCourses,
    getCourseDetails,
    createAssignment,
    getSubmissions,
    gradeSubmission,
    getCourseMaterials,
    uploadCourseMaterial,
    deleteCourseMaterial
} = require('../controllers/assistantController');
const { getDiscussionPosts, createDiscussionPost, getDiscussionReplies, createDiscussionReply } = require('../controllers/studentController');

// Materials upload config
const materialsStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/materials/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const materialsUpload = multer({ storage: materialsStorage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// All routes require Assistant role
router.use(verifyToken, requireRole('Assistant'));

// ===== Assigned Courses =====
router.get('/courses', getAssignedCourses);
router.get('/courses/:id/details', getCourseDetails);

// ===== Assignments (with course authorization) =====
router.post('/assignments', requireCourseAssistant, validate(createAssignmentSchema), createAssignment);

// ===== Submissions =====
router.get('/submissions', getSubmissions);
router.post('/submissions/grade', validate(assistantGradeSubmissionSchema), gradeSubmission);

// ===== Course Materials (with course authorization where applicable) =====
router.get('/courses/:courseId/materials', requireCourseAssistant, getCourseMaterials);
router.post('/courses/materials', materialsUpload.single('file'), requireCourseAssistant, uploadCourseMaterial);
router.delete('/courses/materials/:id', deleteCourseMaterial); // Auth check inside controller

// ===== Discussions =====
router.get('/discussions/:courseId', requireCourseAssistant, getDiscussionPosts);
router.post('/discussions', requireCourseAssistant, createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies);
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
