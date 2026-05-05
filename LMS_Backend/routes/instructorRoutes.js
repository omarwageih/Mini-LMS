const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireCourseOwner } = require('../middleware/authMiddleware');
const { materialsUpload } = require('../middleware/upload');
const { validate, validateParams, addAssistantSchema, addStudentSchema, enrollStudentSchema, assignAssistantSchema, createCourseSchema, addWeekSchema, addMaterialSchema, addLectureSchema, createAssignmentSchema, instructorGradeSubmissionSchema, createAnnouncementSchema, idParamSchema } = require('../middleware/validation');
const {
    getAssistants, addAssistant, deleteAssistant, assignAssistantToCourse,
    getStudents, addStudent, deleteStudent, enrollStudent,
    getCourses, createCourse, deleteCourse,
    addWeek, addMaterial, addLecture,
    createAssignment,
    getSubmissions,
    getCourseContent,
    getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    gradeSubmission
} = require('../controllers/instructorController');
const { getDiscussionPosts, createDiscussionPost, getDiscussionReplies, createDiscussionReply } = require('../controllers/studentController');

// All routes require Instructor role
router.use(verifyToken, requireRole('Instructor'));

// ===== Assistants =====
router.get('/assistants', getAssistants);
router.post('/assistants', validate(addAssistantSchema), addAssistant);
router.delete('/assistants/:id', validateParams(idParamSchema), deleteAssistant);
router.post('/assistants/assign-course', validate(assignAssistantSchema), assignAssistantToCourse);

// ===== Students =====
router.get('/students', getStudents);
router.post('/students', validate(addStudentSchema), addStudent);
router.delete('/students/:id', validateParams(idParamSchema), deleteStudent);
router.post('/students/enroll', validate(enrollStudentSchema), enrollStudent);

// ===== Courses =====
router.get('/courses', getCourses);
router.post('/courses', validate(createCourseSchema), createCourse);
router.delete('/courses/:id', validateParams(idParamSchema), deleteCourse);
router.get('/courses/:courseId/content', requireCourseOwner, getCourseContent);

// ===== Content =====
router.post('/weeks', requireCourseOwner, validate(addWeekSchema), addWeek);
router.post('/materials', requireCourseOwner, materialsUpload.single('file'), validate(addMaterialSchema), addMaterial);
router.post('/lectures', requireCourseOwner, validate(addLectureSchema), addLecture);

// ===== Assignments =====
router.post('/assignments', requireCourseOwner, validate(createAssignmentSchema), createAssignment);

// ===== Submissions & Grading =====
router.get('/submissions', getSubmissions);
router.post('/submissions/grade', validate(instructorGradeSubmissionSchema), gradeSubmission);

// ===== Course Materials =====
router.get('/courses/:courseId/materials', requireCourseOwner, getCourseMaterials);
router.post('/courses/materials', materialsUpload.single('file'), requireCourseOwner, uploadCourseMaterial);
router.delete('/courses/materials/:id', deleteCourseMaterial);

// ===== Announcements =====
router.get('/courses/:courseId/announcements', requireCourseOwner, getAnnouncements);
router.post('/courses/announcements', requireCourseOwner, validate(createAnnouncementSchema), createAnnouncement);
router.delete('/courses/announcements/:id', deleteAnnouncement);

// ===== Discussions =====
router.get('/discussions/:courseId', requireCourseOwner, getDiscussionPosts);
router.post('/discussions', requireCourseOwner, createDiscussionPost);
router.get('/discussions/replies/:postId', getDiscussionReplies);
router.post('/discussions/reply', createDiscussionReply);

module.exports = router;
