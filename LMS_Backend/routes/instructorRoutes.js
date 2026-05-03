const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const multer = require('multer');
const path = require('path');
const { validate, validateParams, addAssistantSchema, addStudentSchema, enrollStudentSchema, assignAssistantSchema, createCourseSchema, addWeekSchema, addMaterialSchema, addLectureSchema, createAssignmentSchema, gradeSubmissionSchema, idParamSchema } = require('../middleware/validation');
const {
    getAssistants, addAssistant, deleteAssistant, assignAssistantToCourse,
    getStudents, addStudent, deleteStudent, enrollStudent,
    getCourses, createCourse,
    addWeek, addMaterial, addLecture,
    createAssignment,
    getSubmissions,
    getCourseContent,
    getCourseMaterials, uploadCourseMaterial, deleteCourseMaterial,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    gradeSubmission
} = require('../controllers/instructorController');

// Materials upload config
const materialsStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/materials/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const materialsUpload = multer({ storage: materialsStorage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

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
router.get('/courses/:courseId/content', getCourseContent);

// ===== Content =====
router.post('/weeks', validate(addWeekSchema), addWeek);
router.post('/materials', validate(addMaterialSchema), addMaterial);
router.post('/lectures', validate(addLectureSchema), addLecture);

// ===== Assignments =====
router.post('/assignments', validate(createAssignmentSchema), createAssignment);

// ===== Submissions & Grading =====
router.get('/submissions', getSubmissions);
router.post('/submissions/grade', validate(gradeSubmissionSchema), gradeSubmission);

// ===== Course Materials =====
router.get('/courses/:courseId/materials', getCourseMaterials);
router.post('/courses/materials', materialsUpload.single('file'), uploadCourseMaterial);
router.delete('/courses/materials/:id', deleteCourseMaterial);

// ===== Announcements =====
router.get('/courses/:courseId/announcements', getAnnouncements);
router.post('/courses/announcements', createAnnouncement);
router.delete('/courses/announcements/:id', deleteAnnouncement);

module.exports = router;
