/**
 * Auth Controller
 * Handles user authentication including signup, OTP verification, and login
 */

import jwt from 'jsonwebtoken';
import { User, OTP } from '../models/index.js';
import { sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';
import {
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    AUTH_CONFIG
} from '../config/constants.js';

/**
 * Generate JWT token
 * @param {ObjectId} userId - User ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN }
    );
};

/**
 * Set token as HTTP-only cookie
 * @param {Response} res - Express response
 * @param {string} token - JWT token
 */
const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('token', token, cookieOptions);
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user and send OTP
 * @access  Public
 */
export const signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if email already exists
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: ERROR_MESSAGES.EMAIL_EXISTS
            });
        }

        // Check if username already exists
        const usernameExists = await User.findOne({ username: username.toLowerCase() });
        if (usernameExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: ERROR_MESSAGES.USERNAME_EXISTS
            });
        }

        // Create new user (auto-verified - no OTP needed)
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            isVerified: true  // Auto-verify user
        });

        // Generate token and log user in immediately
        const token = generateToken(user._id);
        setTokenCookie(res, token);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Account created successfully!',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    storageUsed: user.storageUsed,
                    storageLimit: user.storageLimit
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and activate user account
 * @access  Public
 */
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        // Check if already verified
        if (user.isVerified) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Email is already verified. Please login.'
            });
        }

        // Verify OTP
        const isValid = await OTP.verifyOTPForEmail(email, otp);
        if (!isValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: ERROR_MESSAGES.INVALID_OTP
            });
        }

        // Mark user as verified
        user.isVerified = true;
        await user.save();

        // Generate token
        const token = generateToken(user._id);
        setTokenCookie(res, token);

        // Send welcome email
        try {
            await sendWelcomeEmail(email, user.username);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.OTP_VERIFIED,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    storageUsed: user.storageUsed,
                    storageLimit: user.storageLimit
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to user's email
 * @access  Public
 */
export const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        // Check if already verified
        if (user.isVerified) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Email is already verified. Please login.'
            });
        }

        // Generate new OTP
        const { plainOTP } = await OTP.createOTPForEmail(email);

        // Send OTP email
        await sendOTPEmail(email, plainOTP, user.username);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.OTP_SENT
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user with username/email and password
 * @access  Public
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Find user by username or email
        const user = await User.findByCredentials(username);
        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.INVALID_CREDENTIALS
            });
        }

        // Note: Verification check removed - all users can login

        // Check if user is banned
        if (user.isBanned) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: ERROR_MESSAGES.ACCOUNT_BANNED,
                banReason: user.banReason
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.INVALID_CREDENTIALS
            });
        }

        // Update last login
        await user.updateLastLogin();

        // Generate token
        const token = generateToken(user._id);
        setTokenCookie(res, token);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    storageUsed: user.storageUsed,
                    storageLimit: user.storageLimit,
                    storagePercentage: user.storagePercentage,
                    profile: user.profile,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                },
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user by clearing token cookie
 * @access  Private
 */
export const logout = async (req, res, next) => {
    try {
        // Clear token cookie
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0)
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.LOGOUT_SUCCESS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    storageUsed: user.storageUsed,
                    storageLimit: user.storageLimit,
                    storagePercentage: user.storagePercentage,
                    storageRemaining: user.storageRemaining,
                    profile: user.profile,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { fullName, department } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profile.fullName': fullName,
                    'profile.department': department
                }
            },
            { new: true, runValidators: true }
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profile: user.profile
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    signup,
    verifyOTP,
    resendOTP,
    login,
    logout,
    getMe,
    updateProfile
};
