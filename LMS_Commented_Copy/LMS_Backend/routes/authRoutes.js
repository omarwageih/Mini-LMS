const express = require('express');
const router = express.Router();
const { register, login, updateProfilePicture, forgotPassword, resetPassword, refreshAccessToken } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure profiles upload directory exists
const profilesDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const rateLimit = require('express-rate-limit');

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: { message: "Too many uploads from this IP, please try again after an hour" }
});

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
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/refresh-token', authLimiter, refreshAccessToken);
router.post('/profile-picture', verifyToken, uploadLimiter, upload.single('profilePic'), updateProfilePicture);

module.exports = router;