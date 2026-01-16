/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found error handler
 * Handles 404 errors for undefined routes
 */
export const notFound = (req, res, next) => {
    const error = new ApiError(
        `Not found - ${req.originalUrl}`,
        HTTP_STATUS.NOT_FOUND
    );
    next(error);
};

/**
 * Global error handler
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || HTTP_STATUS.SERVER_ERROR;
    let message = err.message || ERROR_MESSAGES.SERVER_ERROR;
    let errors = err.errors || null;

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    } else {
        console.error('Error:', err.message);
    }

    // Handle specific error types

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = ERROR_MESSAGES.VALIDATION_ERROR;
        errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = HTTP_STATUS.CONFLICT;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Invalid token. Please login again.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Token expired. Please login again.';
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = ERROR_MESSAGES.FILE_TOO_LARGE;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Unexpected field in upload';
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default { ApiError, notFound, errorHandler };
