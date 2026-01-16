/**
 * File Upload Middleware
 * Configures multer for file uploads with validation
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { FILE_CONFIG, HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import { ApiError } from './errorHandler.js';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), FILE_CONFIG.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Storage configuration
 * Files are stored with UUID names to prevent conflicts
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create user-specific subdirectory
        const userDir = path.join(uploadDir, req.user._id.toString());
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },

    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

/**
 * File filter
 * Validates file type against allowed types
 */
const fileFilter = (req, file, cb) => {
    // Check MIME type
    if (FILE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(
            `${ERROR_MESSAGES.INVALID_FILE_TYPE}. Allowed: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
            HTTP_STATUS.BAD_REQUEST
        ), false);
    }
};

/**
 * Create multer upload instance
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: FILE_CONFIG.MAX_SIZE,
        files: 10 // Max 10 files per upload
    }
});

/**
 * Middleware to check storage space before upload
 */
export const checkStorageSpace = (req, res, next) => {
    // Get content-length header for approximate file size check
    const contentLength = parseInt(req.headers['content-length']) || 0;

    if (!req.user.hasStorageSpace(contentLength)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.STORAGE_LIMIT,
            storageUsed: req.user.storageUsed,
            storageLimit: req.user.storageLimit
        });
    }

    next();
};

/**
 * Single file upload
 */
export const uploadSingle = upload.single('file');

/**
 * Multiple file upload (max 10 files)
 */
export const uploadMultiple = upload.array('files', 10);

/**
 * Handle upload errors
 */
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = ERROR_MESSAGES.UPLOAD_FAILED;

        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = `${ERROR_MESSAGES.FILE_TOO_LARGE} (Max: ${FILE_CONFIG.MAX_SIZE / 1024 / 1024}MB)`;
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files. Maximum 10 files allowed per upload.';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected field name for file upload';
                break;
            default:
                message = err.message;
        }

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message
        });
    }

    next(err);
};

export default {
    uploadSingle,
    uploadMultiple,
    checkStorageSpace,
    handleUploadError
};
