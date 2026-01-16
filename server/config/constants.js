/**
 * Application Constants
 * Centralized configuration values used across the application
 */

// File upload settings
export const FILE_CONFIG = {
    // Maximum file size (default: 50MB)
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 52428800,

    // Maximum storage per user (default: 500MB)
    MAX_STORAGE_PER_USER: parseInt(process.env.MAX_STORAGE_PER_USER) || 524288000,

    // File expiry in days
    EXPIRY_DAYS: parseInt(process.env.FILE_EXPIRY_DAYS) || 7,

    // Upload directory
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

    // Allowed MIME types
    ALLOWED_TYPES: (process.env.ALLOWED_FILE_TYPES ||
        'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,audio/mpeg,audio/wav,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,text/plain'
    ).split(','),

    // Allowed extensions for display
    ALLOWED_EXTENSIONS: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
        '.mp4', '.webm', '.mov', '.avi',
        '.mp3', '.wav', '.ogg',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.7z',
        '.txt', '.csv', '.json'
    ]
};

// Authentication settings
export const AUTH_CONFIG = {
    // JWT expiry
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // OTP settings
    OTP_LENGTH: parseInt(process.env.OTP_LENGTH) || 6,
    OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,

    // Password requirements
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

    // Username requirements
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 20,
    USERNAME_REGEX: /^[a-zA-Z0-9_]+$/
};

// Rate limiting settings
export const RATE_LIMIT_CONFIG = {
    // Window size in milliseconds
    WINDOW_MS: (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,

    // Max requests per window
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX) || 100,

    // Message on rate limit exceeded
    MESSAGE: 'Too many requests. Please try again later.'
};

// Clipboard settings
export const CLIPBOARD_CONFIG = {
    // Maximum text length
    MAX_LENGTH: 10000,

    // Maximum clips per user
    MAX_CLIPS: 50,

    // Expiry in days (same as files)
    EXPIRY_DAYS: parseInt(process.env.FILE_EXPIRY_DAYS) || 7
};

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// User roles
export const ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

// HTTP status codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
};

// Error messages
export const ERROR_MESSAGES = {
    // Auth errors
    INVALID_CREDENTIALS: 'Invalid username or password',
    USER_NOT_FOUND: 'User not found',
    USER_EXISTS: 'User already exists',
    EMAIL_EXISTS: 'Email already registered',
    USERNAME_EXISTS: 'Username already taken',
    INVALID_OTP: 'Invalid or expired OTP',
    OTP_EXPIRED: 'OTP has expired. Please request a new one',
    NOT_VERIFIED: 'Please verify your email first',
    ACCOUNT_BANNED: 'Your account has been banned',
    UNAUTHORIZED: 'Please login to continue',
    FORBIDDEN: 'You do not have permission to perform this action',

    // File errors
    FILE_NOT_FOUND: 'File not found',
    FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
    INVALID_FILE_TYPE: 'This file type is not allowed',
    STORAGE_LIMIT: 'Storage limit exceeded. Please delete some files',
    UPLOAD_FAILED: 'File upload failed. Please try again',

    // Folder errors
    FOLDER_NOT_FOUND: 'Folder not found',
    FOLDER_EXISTS: 'A folder with this name already exists',

    // Clipboard errors
    CLIP_NOT_FOUND: 'Clipboard item not found',
    CLIP_LIMIT: 'Maximum clipboard limit reached',

    // General errors
    SERVER_ERROR: 'Something went wrong. Please try again later',
    VALIDATION_ERROR: 'Validation failed',
    RATE_LIMIT: 'Too many requests. Please slow down'
};

// Success messages
export const SUCCESS_MESSAGES = {
    // Auth
    SIGNUP_SUCCESS: 'Account created successfully. Please verify your email',
    OTP_SENT: 'OTP sent to your email',
    OTP_VERIFIED: 'Email verified successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logged out successfully',

    // File
    FILE_UPLOADED: 'File(s) uploaded successfully',
    FILE_DELETED: 'File deleted successfully',

    // Folder
    FOLDER_CREATED: 'Folder created successfully',
    FOLDER_UPDATED: 'Folder renamed successfully',
    FOLDER_DELETED: 'Folder deleted successfully',

    // Clipboard
    CLIP_CREATED: 'Text saved to clipboard',
    CLIP_DELETED: 'Clipboard item deleted',

    // Admin
    USER_BANNED: 'User has been banned',
    USER_UNBANNED: 'User has been unbanned',
    USER_DELETED: 'User and all their data have been deleted'
};
