/**
 * Authentication Middleware
 * Protects routes requiring authentication
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Protect routes - verify JWT token
 * Adds user object to request
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in cookies first, then Authorization header
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // No token found
        if (!token) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: ERROR_MESSAGES.USER_NOT_FOUND
                });
            }

            // Check if user is banned
            if (user.isBanned) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: ERROR_MESSAGES.ACCOUNT_BANNED,
                    banReason: user.banReason
                });
            }

            // Note: Verification check removed - all authenticated users have access

            // Add user to request
            req.user = user;
            next();
        } catch (error) {
            // Token verification failed
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * Admin only middleware
 * Must be used after protect middleware
 */
export const adminOnly = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: ERROR_MESSAGES.FORBIDDEN
        });
    }
    next();
};

/**
 * Optional auth middleware
 * Adds user to request if token exists, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (user && !user.isBanned) {
                    req.user = user;
                }
            } catch {
                // Token invalid, continue without user
            }
        }

        next();
    } catch (error) {
        next();
    }
};

export default { protect, adminOnly, optionalAuth };
