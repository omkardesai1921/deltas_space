/**
 * Validation Middleware
 * Input validation using express-validator
 */

import { body, param, query, validationResult } from 'express-validator';
import { AUTH_CONFIG, CLIPBOARD_CONFIG, HTTP_STATUS } from '../config/constants.js';

/**
 * Validate request and return errors if any
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};

// ============================================
// AUTH VALIDATORS
// ============================================

/**
 * Signup validation rules
 */
export const signupValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: AUTH_CONFIG.USERNAME_MIN_LENGTH, max: AUTH_CONFIG.USERNAME_MAX_LENGTH })
        .withMessage(`Username must be ${AUTH_CONFIG.USERNAME_MIN_LENGTH}-${AUTH_CONFIG.USERNAME_MAX_LENGTH} characters`)
        .matches(AUTH_CONFIG.USERNAME_REGEX)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: AUTH_CONFIG.PASSWORD_MIN_LENGTH })
        .withMessage(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`)
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[@$!%*?&]/).withMessage('Password must contain a special character (@$!%*?&)'),

    validate
];

/**
 * Verify OTP validation rules
 */
export const verifyOTPValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: AUTH_CONFIG.OTP_LENGTH, max: AUTH_CONFIG.OTP_LENGTH })
        .withMessage(`OTP must be ${AUTH_CONFIG.OTP_LENGTH} digits`)
        .isNumeric().withMessage('OTP must contain only numbers'),

    validate
];

/**
 * Login validation rules
 */
export const loginValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username or email is required'),

    body('password')
        .notEmpty().withMessage('Password is required'),

    validate
];

/**
 * Resend OTP validation
 */
export const resendOTPValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    validate
];

// ============================================
// FILE VALIDATORS
// ============================================

/**
 * File ID validation
 */
export const fileIdValidation = [
    param('id')
        .notEmpty().withMessage('File ID is required')
        .isMongoId().withMessage('Invalid file ID'),

    validate
];

// ============================================
// FOLDER VALIDATORS
// ============================================

/**
 * Create folder validation
 */
export const createFolderValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Folder name is required')
        .isLength({ max: 50 }).withMessage('Folder name cannot exceed 50 characters')
        .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Folder name can only contain letters, numbers, spaces, hyphens, and underscores'),

    body('parentId')
        .optional({ nullable: true })
        .isMongoId().withMessage('Invalid parent folder ID'),

    body('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),

    validate
];

/**
 * Update folder validation
 */
export const updateFolderValidation = [
    param('id')
        .notEmpty().withMessage('Folder ID is required')
        .isMongoId().withMessage('Invalid folder ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 }).withMessage('Folder name must be 1-50 characters')
        .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Folder name can only contain letters, numbers, spaces, hyphens, and underscores'),

    body('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),

    validate
];

/**
 * Folder ID validation
 */
export const folderIdValidation = [
    param('id')
        .notEmpty().withMessage('Folder ID is required')
        .isMongoId().withMessage('Invalid folder ID'),

    validate
];

// ============================================
// CLIPBOARD VALIDATORS
// ============================================

/**
 * Create clipboard validation
 */
export const createClipboardValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

    body('content')
        .trim()
        .notEmpty().withMessage('Content is required')
        .isLength({ max: CLIPBOARD_CONFIG.MAX_LENGTH })
        .withMessage(`Content cannot exceed ${CLIPBOARD_CONFIG.MAX_LENGTH} characters`),

    body('contentType')
        .optional()
        .isIn(['text', 'code', 'link', 'json']).withMessage('Invalid content type'),

    body('language')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Language cannot exceed 20 characters'),

    validate
];

/**
 * Clipboard ID validation
 */
export const clipboardIdValidation = [
    param('id')
        .notEmpty().withMessage('Clipboard ID is required')
        .isMongoId().withMessage('Invalid clipboard ID'),

    validate
];

// ============================================
// ADMIN VALIDATORS
// ============================================

/**
 * Ban user validation
 */
export const banUserValidation = [
    param('id')
        .notEmpty().withMessage('User ID is required')
        .isMongoId().withMessage('Invalid user ID'),

    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Ban reason cannot exceed 200 characters'),

    validate
];

/**
 * User ID validation
 */
export const userIdValidation = [
    param('id')
        .notEmpty().withMessage('User ID is required')
        .isMongoId().withMessage('Invalid user ID'),

    validate
];

// ============================================
// PAGINATION VALIDATORS
// ============================================

/**
 * Pagination query validation
 */
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt(),

    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Search query cannot exceed 100 characters'),

    validate
];

export default {
    validate,
    signupValidation,
    verifyOTPValidation,
    loginValidation,
    resendOTPValidation,
    fileIdValidation,
    createFolderValidation,
    updateFolderValidation,
    folderIdValidation,
    createClipboardValidation,
    clipboardIdValidation,
    banUserValidation,
    userIdValidation,
    paginationValidation
};
