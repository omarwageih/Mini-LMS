const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireCourseAssistant } = require('../middleware/authMiddleware');
const { validate, createAssignmentSchema, gradeSubmissionSchema } = require('../middleware/validation');
const {
    getAssignedCourses,
    createAssignment,
    getSubmissions,
    gradeSubmission
} = require('../controllers/assistantController');

// All routes require Assistant role
router.use(verifyToken, requireRole('Assistant'));

// ===== Assigned Courses =====
router.get('/courses', getAssignedCourses);

// ===== Assignments (with course authorization) =====
router.post('/assignments', requireCourseAssistant, validate(createAssignmentSchema), createAssignment);

// ===== Submissions =====
router.get('/submissions', getSubmissions);
router.post('/submissions/grade', validate(gradeSubmissionSchema), gradeSubmission);

module.exports = router;
