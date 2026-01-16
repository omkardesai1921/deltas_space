/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG, HTTP_STATUS } from '../config/constants.js';

/**
 * General rate limiter for all routes
 */
export const generalLimiter = rateLimit({
    windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
    max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
    message: {
        success: false,
        message: RATE_LIMIT_CONFIG.MESSAGE
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            message: RATE_LIMIT_CONFIG.MESSAGE,
            retryAfter: Math.ceil(RATE_LIMIT_CONFIG.WINDOW_MS / 1000 / 60) + ' minutes'
        });
    }
});

/**
 * Strict rate limiter for authentication routes
 * More restrictive to prevent brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window per IP
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            message: 'Too many authentication attempts. Please try again after 15 minutes.'
        });
    }
});

/**
 * OTP rate limiter
 * Prevents OTP spam
 */
export const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 OTP requests per minute
    message: {
        success: false,
        message: 'Too many OTP requests. Please wait before requesting another.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            message: 'Too many OTP requests. Please wait 1 minute before requesting another.'
        });
    }
});

/**
 * Upload rate limiter
 * Prevents upload abuse
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
        success: false,
        message: 'Upload limit reached. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            message: 'Upload limit reached (50 per hour). Please try again later.'
        });
    }
});

/**
 * Download rate limiter
 * Prevents download abuse
 */
export const downloadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 downloads per hour
    message: {
        success: false,
        message: 'Download limit reached. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            message: 'Download limit reached (100 per hour). Please try again later.'
        });
    }
});

export default {
    generalLimiter,
    authLimiter,
    otpLimiter,
    uploadLimiter,
    downloadLimiter
};
