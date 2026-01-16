/**
 * Auth Routes
 * Routes for user authentication
 */

import { Router } from 'express';
import {
    signup,
    verifyOTP,
    resendOTP,
    login,
    logout,
    getMe,
    updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import {
    signupValidation,
    verifyOTPValidation,
    loginValidation,
    resendOTPValidation
} from '../middleware/validation.js';

const router = Router();

// Public routes (with rate limiting)

// @route   POST /api/auth/signup
// @desc    Register new user and send OTP
// @access  Public
router.post('/signup', authLimiter, signupValidation, signup);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate account
// @access  Public
router.post('/verify-otp', authLimiter, verifyOTPValidation, verifyOTP);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to email
// @access  Public
router.post('/resend-otp', otpLimiter, resendOTPValidation, resendOTP);

// @route   POST /api/auth/login
// @desc    Login with username/email and password
// @access  Public
router.post('/login', authLimiter, loginValidation, login);

// Protected routes

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

export default router;
