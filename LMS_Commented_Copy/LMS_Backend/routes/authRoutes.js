/**
 * AUTHENTICATION ROUTES
 * Defines the entry points for user access control, registration, and profile management.
 */
const express = require('express');
const router = express.Router();
const { register, login, updateProfilePicture, forgotPassword, resetPassword, refreshAccessToken } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../middleware/validation');
const multer = require('multer'); // Middleware for handling file uploads (multipart/form-data)
const path = require('path');
const fs = require('fs');

// 1. UPLOAD SETUP: Ensure profiles directory exists for storing avatar images
const profilesDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
}

// 2. MULTER CONFIGURATION: Define how and where to save uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)) // Unique filename using timestamp
});

// 3. SECURITY: Rate limiting to prevent Brute Force attacks
const rateLimit = require('express-rate-limit');

// Limits login/register attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 20, // limit each IP to 20 requests per window
    message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});

// Limits how often a user can change their profile picture
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // limit each IP to 10 uploads per hour
    message: { message: "Too many uploads from this IP, please try again after an hour" }
});

// 4. FILE VALIDATION: Ensure only images are uploaded
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const allowedMimeTypes = ['image/png', 'image/jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PNG and JPG files are allowed for profile pictures.'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB maximum file size
});

// ---------------------------------------------------------
// ROUTE DEFINITIONS
// ---------------------------------------------------------

// Register a new account (Rate limited + Schema validated)
router.post('/register', authLimiter, validate(registerSchema), register);

// Login to existing account (Rate limited + Schema validated)
router.post('/login', authLimiter, validate(loginSchema), login);

// Password recovery flows
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// Token management (Used to stay logged in)
router.post('/refresh-token', authLimiter, refreshAccessToken);

// Profile customization (Requires authentication + Rate limited + File handling)
router.post('/profile-picture', verifyToken, uploadLimiter, upload.single('profilePic'), updateProfilePicture);

module.exports = router;