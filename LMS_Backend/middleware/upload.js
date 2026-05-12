const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const submissionsDir = path.join(__dirname, '..', 'uploads', 'submissions');
const materialsDir = path.join(__dirname, '..', 'uploads', 'materials');
const profilesDir = path.join(__dirname, '..', 'uploads', 'profiles');
const messagesDir = path.join(__dirname, '..', 'uploads', 'messages');

[submissionsDir, materialsDir, profilesDir, messagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage for Submissions
const submissionStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, submissionsDir),
    filename: (req, file, cb) => {
        const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Configure storage for Materials
const materialsStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, materialsDir),
    filename: (req, file, cb) => {
        const uniqueName = `material_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter for Submissions
const submissionFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.zip'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'application/zip', 'application/x-zip-compressed'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, and ZIP files are allowed for submissions.'), false);
    }
};

const upload = multer({
    storage: submissionStorage,
    fileFilter: submissionFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const materialsUpload = multer({ 
    storage: materialsStorage, 
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.jpg', '.jpeg', '.png'];
        const allowedMimeTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/zip',
            'application/x-zip-compressed',
            'image/jpeg',
            'image/png'
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed for course materials.'), false);
        }
    }
});

const messageUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, messagesDir),
        filename: (req, file, cb) => {
            const uniqueName = `msg_${Date.now()}_${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        }
    }),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

module.exports = { upload, materialsUpload, messageUpload };
