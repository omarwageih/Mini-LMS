/**
 * INSTRUCTOR ROUTES
 * Defines all API endpoints accessible only to Instructors.
 * This file maps URL paths to the logic in various controllers.
 */
const express = require('express');
const router = express.Router();

// Middleware: For security and authorization
const { verifyToken, requireRole, requireCourseOwner } = require('../middleware/authMiddleware');
const { materialsUpload } = require('../middleware/upload');
const { validate, validateParams, addAssistantSchema, addStudentSchema, enrollStudentSchema, assignAssistantSchema, createCourseSchema, addWeekSchema, addMaterialSchema, addLectureSchema, createAssignmentSchema, updateAssignmentSchema, instructorGradeSubmissionSchema, createAnnouncementSchema, idParamSchema } = require('../middleware/validation');

// Controllers: The "brains" behind the routes
const {
    getAssistants, addAssistant, deleteAssistant, assignAssistantToCourse,
    getStudents, addStudent, deleteStudent, enrollStudent
} = require('../controllers/userManagementController');

const {
    getCourses, createCourse, deleteCourse, getMyCourses, getCourseContent,
    addWeek, deleteWeek, addMaterial, deleteMaterial, addLecture, deleteLecture,
    getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    getCourseParticipants, getCourseGrades,
    getCourseAttendance, markAttendance, getCourseQuizzes
} = require('../controllers/courseController');

const {
    createAssignment, updateAssignment, deleteAssignment,
    getSubmissions, gradeSubmission
} = require('../controllers/assignmentController');

const { getDiscussionPosts, createDiscussionPost, getDiscussionReplies, createDiscussionReply } = require('../controllers/discussionController');

/**
 * GLOBAL MIDDLEWARE
 * All routes in this file require:
 * 1. A valid JWT token (verifyToken)
 * 2. The user type to be 'Instructor' (requireRole)
 */
router.use(verifyToken, requireRole('Instructor'));

// ---------------------------------------------------------
// ASSISTANT MANAGEMENT
// ---------------------------------------------------------
router.get('/assistants', getAssistants); // List all TAs
router.post('/assistants', validate(addAssistantSchema), addAssistant); // Create TA account
router.delete('/assistants/:id', validateParams(idParamSchema), deleteAssistant); // Remove TA account
router.post('/assistants/assign-course', validate(assignAssistantSchema), assignAssistantToCourse); // Link TA to course

// ---------------------------------------------------------
// STUDENT MANAGEMENT
// ---------------------------------------------------------
router.get('/students', getStudents); // List all students
router.post('/students', validate(addStudentSchema), addStudent); // Register student manually
router.delete('/students/:id', validateParams(idParamSchema), deleteStudent); // Delete student and all their data
router.post('/students/enroll', validate(enrollStudentSchema), enrollStudent); // Enroll student in specific course

// ---------------------------------------------------------
// COURSE & SYLLABUS MANAGEMENT
// ---------------------------------------------------------
router.get('/courses', getCourses); // Get global course list
router.post('/courses', validate(createCourseSchema), createCourse); // Create new course
router.delete('/courses/:id', validateParams(idParamSchema), deleteCourse); // Delete whole course
router.get('/my-courses', getMyCourses); // Get courses taught by the current instructor
router.get('/courses/:courseId/content', requireCourseOwner, getCourseContent); // View full syllabus structure

// ---------------------------------------------------------
// SYLLABUS EDITING (requireCourseOwner ensures they don't edit other instructors' courses)
// ---------------------------------------------------------
router.post('/weeks', requireCourseOwner, validate(addWeekSchema), addWeek); // Add Week 1, Week 2, etc.
router.post('/materials', materialsUpload.single('file'), requireCourseOwner, validate(addMaterialSchema), addMaterial); // Upload PDFs/PPTs to a week
router.delete('/materials/:id', deleteMaterial);
router.post('/lectures', requireCourseOwner, validate(addLectureSchema), addLecture); // Schedule class sessions
router.delete('/lectures/:id', deleteLecture);
router.delete('/weeks/:id', deleteWeek);

// ---------------------------------------------------------
// COURSE TABS & REPORTS
// ---------------------------------------------------------
router.get('/courses/:courseId/participants', requireCourseOwner, getCourseParticipants); // See who is in the class
router.get('/courses/:courseId/grades', requireCourseOwner, getCourseGrades); // Export class performance
router.get('/courses/:courseId/attendance', requireCourseOwner, getCourseAttendance); // View attendance records
router.post('/attendance/mark', markAttendance); // Take attendance for a lecture
router.get('/courses/:courseId/quizzes', requireCourseOwner, getCourseQuizzes); // View quiz results

// ---------------------------------------------------------
// ASSIGNMENTS & GRADING
// ---------------------------------------------------------
router.post('/assignments', requireCourseOwner, validate(createAssignmentSchema), createAssignment); // Create task
router.put('/assignments/:id', validateParams(idParamSchema), validate(updateAssignmentSchema), updateAssignment); // Edit task
router.delete('/assignments/:id', validateParams(idParamSchema), deleteAssignment); // Delete task
router.get('/submissions', getSubmissions); // Get all student work
router.post('/submissions/grade', validate(instructorGradeSubmissionSchema), gradeSubmission); // Grade student work

// ---------------------------------------------------------
// SUPPLEMENTARY MATERIALS & ANNOUNCEMENTS
// ---------------------------------------------------------
router.get('/courses/:courseId/materials', requireCourseOwner, getCourseMaterials); // Standalone materials
router.post('/courses/materials', materialsUpload.single('file'), requireCourseOwner, uploadCourseMaterial);
router.delete('/courses/materials/:id', deleteCourseMaterial);

router.get('/courses/:courseId/announcements', requireCourseOwner, getAnnouncements); // View class news
router.post('/courses/announcements', requireCourseOwner, validate(createAnnouncementSchema), createAnnouncement); // Post news
router.delete('/courses/announcements/:id', deleteAnnouncement);

// ---------------------------------------------------------
// COURSE DISCUSSIONS (FORUMS)
// ---------------------------------------------------------
router.get('/discussions/:courseId', requireCourseOwner, getDiscussionPosts);
router.post('/discussions', requireCourseOwner, createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies);
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
