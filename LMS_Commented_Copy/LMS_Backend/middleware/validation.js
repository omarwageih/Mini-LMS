/**
 * DATA VALIDATION SCHEMAS
 * This file uses the 'Zod' library to define strict rules for incoming data.
 * It prevents "garbage" data from reaching the database and provides 
 * helpful error messages to the frontend.
 */
const { z } = require('zod');

// ---------------------------------------------------------
// AUTHENTICATION SCHEMAS
// ---------------------------------------------------------

// Rules for creating a new account
const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    userType: z.enum(['Student'], { message: 'Only Student registration is allowed here' }),
    phone: z.string().optional()
});

// Rules for logging in
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

// Rules for initiating password recovery
const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format')
});

// Rules for setting a new password via recovery token
const resetPasswordSchema = z.object({
    id: z.union([z.string(), z.number()]),
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});

// ---------------------------------------------------------
// INSTRUCTOR SCHEMAS (Administrative Actions)
// ---------------------------------------------------------

// Used when an instructor creates a TA account
const addAssistantSchema = z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
});

// Used when an instructor creates a student account manually
const addStudentSchema = z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
});

// For linking users to courses
const enrollStudentSchema = z.object({
    studentId: z.union([z.string(), z.number()]),
    courseId: z.union([z.string(), z.number()])
});

const assignAssistantSchema = z.object({
    assistantId: z.union([z.string(), z.number()]),
    courseId: z.union([z.string(), z.number()])
});

// ---------------------------------------------------------
// COURSE CONTENT SCHEMAS
// ---------------------------------------------------------

const createCourseSchema = z.object({
    name: z.string().min(1).max(200),
    maxMarks: z.union([z.string(), z.number()]).optional(),
    description: z.string().optional()
});

const addWeekSchema = z.object({
    courseId: z.union([z.string(), z.number()]),
    weekNumber: z.union([z.string(), z.number()]),
    title: z.string().min(1).max(200)
});

const addMaterialSchema = z.object({
    weekId: z.union([z.string(), z.number()]),
    title: z.string().min(1).max(200),
    fileType: z.string().optional(),
    url: z.string().optional()
}).passthrough();

const addLectureSchema = z.object({
    courseId: z.union([z.string(), z.number()]),
    title: z.string().min(1).max(200),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().optional(),
    endTime: z.string().optional()
});

// ---------------------------------------------------------
// ASSIGNMENT SCHEMAS
// ---------------------------------------------------------

const createAssignmentSchema = z.object({
    courseId: z.union([z.string(), z.number()]),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    deadline: z.string().min(1, 'Deadline is required'),
    maxScore: z.union([z.string(), z.number()]).optional()
});

const updateAssignmentSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    deadline: z.string().optional(),
    maxScore: z.union([z.string(), z.number()]).optional()
});

// ---------------------------------------------------------
// GRADING & ANNOUNCEMENTS
// ---------------------------------------------------------

const instructorGradeSubmissionSchema = z.object({
    submissionId: z.union([z.string(), z.number()]),
    score: z.union([z.string(), z.number()]),
    feedback: z.string().optional()
});

const assistantGradeSubmissionSchema = z.object({
    submissionId: z.union([z.string(), z.number()]),
    score: z.union([z.string(), z.number()])
});

const createAnnouncementSchema = z.object({
    courseId: z.union([z.string(), z.number()]),
    title: z.string().min(1).max(200),
    content: z.string().min(1)
});

// ---------------------------------------------------------
// VALIDATION MIDDLEWARE ENGINE
// ---------------------------------------------------------

/**
 * BODY VALIDATOR
 * Intercepts the request body (req.body) and compares it against a schema.
 */
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body); // If this fails, it throws an error caught by the catch block
        next();
    } catch (err) {
        const issues = err.issues || err.errors || [];
        const errorMessages = issues.map(e => e.message);
        const displayError = errorMessages.length > 0 ? errorMessages[0] : 'Invalid input';
        
        console.error("Zod Validation Error:", err);
        return res.status(400).json({ 
            message: displayError, 
            errors: errorMessages.length > 0 ? errorMessages : ['Invalid input'] 
        });
    }
};

/**
 * PARAMS VALIDATOR
 * Similar to validate(), but checks URL parameters (e.g., /api/user/:id).
 */
const validateParams = (schema) => (req, res, next) => {
    try {
        schema.parse(req.params);
        next();
    } catch (err) {
        const issues = err.issues || err.errors || [];
        const errorMessages = issues.map(e => e.message);
        const displayError = errorMessages.length > 0 ? errorMessages[0] : 'Invalid parameters';
        
        return res.status(400).json({ 
            message: displayError, 
            errors: errorMessages.length > 0 ? errorMessages : ['Invalid parameters'] 
        });
    }
};

// ---------------------------------------------------------
// MISC SCHEMAS
// ---------------------------------------------------------

// Ensures the ID in a URL is purely numeric
const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number')
});

// Rules for updating user profile settings
const updateProfileSchema = z.object({
    fullName: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    studentCode: z.string().optional(),
    academicYear: z.union([z.string(), z.number()]).optional(),
    major: z.string().optional(),
    gpa: z.union([z.string(), z.number()]).optional()
});

module.exports = {
    registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
    addAssistantSchema, addStudentSchema, enrollStudentSchema, assignAssistantSchema,
    createCourseSchema, addWeekSchema, addMaterialSchema, addLectureSchema, createAssignmentSchema, updateAssignmentSchema, createAnnouncementSchema,
    instructorGradeSubmissionSchema, assistantGradeSubmissionSchema, idParamSchema,
    updateProfileSchema,
    validate, validateParams
};
