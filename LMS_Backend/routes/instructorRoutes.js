const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireCourseOwner } = require('../middleware/authMiddleware');
const { materialsUpload } = require('../middleware/upload');
const { validate, validateParams, addAssistantSchema, addStudentSchema, enrollStudentSchema, assignAssistantSchema, createCourseSchema, addWeekSchema, addMaterialSchema, addLectureSchema, createAssignmentSchema, updateAssignmentSchema, instructorGradeSubmissionSchema, createAnnouncementSchema, idParamSchema } = require('../middleware/validation');
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
router.get('/my-courses', getMyCourses);
router.get('/courses/:courseId/content', requireCourseOwner, getCourseContent);

// ===== Content =====
router.post('/weeks', requireCourseOwner, validate(addWeekSchema), addWeek);
router.post('/materials', materialsUpload.single('file'), requireCourseOwner, validate(addMaterialSchema), addMaterial);
router.delete('/materials/:id', deleteMaterial);
router.post('/lectures', requireCourseOwner, validate(addLectureSchema), addLecture);
router.delete('/lectures/:id', deleteLecture);
router.delete('/weeks/:id', deleteWeek);

// ===== Statistics & Tabs =====
router.get('/courses/:courseId/participants', requireCourseOwner, getCourseParticipants);
router.get('/courses/:courseId/grades', requireCourseOwner, getCourseGrades);
router.get('/courses/:courseId/attendance', requireCourseOwner, getCourseAttendance);
router.post('/attendance/mark', markAttendance);
router.get('/courses/:courseId/quizzes', requireCourseOwner, getCourseQuizzes);

// ===== Assignments =====
router.post('/assignments', requireCourseOwner, validate(createAssignmentSchema), createAssignment);
router.put('/assignments/:id', validateParams(idParamSchema), validate(updateAssignmentSchema), updateAssignment);
router.delete('/assignments/:id', validateParams(idParamSchema), deleteAssignment);

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
