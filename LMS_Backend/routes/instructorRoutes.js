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
    getCourses, createCourse, updateCourse, deleteCourse, getMyCourses, getCourseContent,
    addWeek, deleteWeek, addMaterial, deleteMaterial, addLecture, deleteLecture,
    getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    getCourseParticipants, getCourseGrades, unenrollParticipant,
    getCourseAttendance, markAttendance, getCourseQuizzes, updateCourseWeights
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
router.put('/courses/:id', validateParams(idParamSchema), updateCourse);
router.delete('/courses/:id', validateParams(idParamSchema), deleteCourse);
router.get('/my-courses', getMyCourses);
router.get('/courses/:courseId/content', requireCourseOwner, getCourseContent);

// ===== Content =====
router.post('/weeks', requireCourseOwner, validate(addWeekSchema), addWeek);
router.post('/materials', materialsUpload.single('file'), requireCourseOwner, validate(addMaterialSchema), addMaterial);
router.delete('/materials/:id', requireCourseOwner, deleteMaterial);
router.post('/lectures', requireCourseOwner, validate(addLectureSchema), addLecture);
router.delete('/lectures/:id', requireCourseOwner, deleteLecture);
router.delete('/weeks/:id', requireCourseOwner, deleteWeek);

// ===== Statistics & Tabs =====
router.get('/courses/:courseId/participants', requireCourseOwner, getCourseParticipants);
router.delete('/courses/:courseId/participants/:userId', requireCourseOwner, unenrollParticipant);
router.get('/courses/:courseId/grades', requireCourseOwner, getCourseGrades);
router.get('/courses/:courseId/attendance', requireCourseOwner, getCourseAttendance);
router.post('/attendance/mark', requireCourseOwner, markAttendance);
router.get('/courses/:courseId/quizzes', requireCourseOwner, getCourseQuizzes);
router.put('/courses/:courseId/weights', requireCourseOwner, updateCourseWeights);

// ===== Assignments =====
router.post('/assignments', requireCourseOwner, validate(createAssignmentSchema), createAssignment);
router.put('/assignments/:id', requireCourseOwner, validateParams(idParamSchema), validate(updateAssignmentSchema), updateAssignment);
router.delete('/assignments/:id', requireCourseOwner, deleteAssignment);

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
