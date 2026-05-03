const express = require('express');
const router = express.Router();
const { register, login, updateProfilePicture, googleLogin, forgotPassword, resetPassword, refreshAccessToken } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, googleLoginSchema } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
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

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google-login', validate(googleLoginSchema), googleLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/refresh-token', refreshAccessToken);
router.post('/profile-picture', verifyToken, upload.single('profilePic'), updateProfilePicture);

module.exports = router;