const { z } = require('zod');

// ===== Auth Schemas =====
const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    userType: z.enum(['Student', 'Assistant'], { message: 'Invalid user type' }),
    phone: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
    id: z.union([z.string(), z.number()]),
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});

const googleLoginSchema = z.object({
    credential: z.string().min(1, 'Google credential is required')
});

// ===== Instructor Schemas =====
const addAssistantSchema = z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8)
});

const addStudentSchema = z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8)
});

const enrollStudentSchema = z.object({
    studentId: z.union([z.string(), z.number()]),
    courseId: z.union([z.string(), z.number()])
});

const assignAssistantSchema = z.object({
    assistantId: z.union([z.string(), z.number()]),
    courseId: z.union([z.string(), z.number()])
});

const createCourseSchema = z.object({
    name: z.string().min(1).max(200),
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
    type: z.string().optional(),
    url: z.string().optional()
});

const addLectureSchema = z.object({
    weekId: z.union([z.string(), z.number()]),
    title: z.string().min(1).max(200),
    videoUrl: z.string().optional()
});

const createAssignmentSchema = z.object({
    courseId: z.union([z.string(), z.number()]),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    deadline: z.string().min(1, 'Deadline is required'),
    maxGrade: z.union([z.string(), z.number()]).optional()
});

// ===== Assistant Schemas =====
const gradeSubmissionSchema = z.object({
    submissionId: z.union([z.string(), z.number()]),
    grade: z.union([z.string(), z.number()]),
    feedback: z.string().optional()
});

// ===== Validation Middleware =====
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        const errors = err.errors?.map(e => e.message) || ['Invalid input'];
        return res.status(400).json({ message: errors[0], errors });
    }
};

const validateParams = (schema) => (req, res, next) => {
    try {
        schema.parse(req.params);
        next();
    } catch (err) {
        const errors = err.errors?.map(e => e.message) || ['Invalid parameters'];
        return res.status(400).json({ message: errors[0], errors });
    }
};

const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number')
});

module.exports = {
    registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, googleLoginSchema,
    addAssistantSchema, addStudentSchema, enrollStudentSchema, assignAssistantSchema,
    createCourseSchema, addWeekSchema, addMaterialSchema, addLectureSchema, createAssignmentSchema,
    gradeSubmissionSchema, idParamSchema,
    validate, validateParams
};
