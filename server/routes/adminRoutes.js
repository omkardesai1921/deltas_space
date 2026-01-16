/**
 * Admin Routes
 * Routes for admin operations
 */

import { Router } from 'express';
import {
    getSystemStats,
    getUsers,
    getUserDetails,
    toggleBan,
    updateStorageLimit,
    deleteUser,
    runCleanup,
    getAllFiles
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import {
    banUserValidation,
    userIdValidation,
    paginationValidation
} from '../middleware/validation.js';

const router = Router();

// All routes require authentication AND admin role
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Admin
router.get('/stats', getSystemStats);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', paginationValidation, getUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Admin
router.get('/users/:id', userIdValidation, getUserDetails);

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban/Unban user
// @access  Admin
router.put('/users/:id/ban', banUserValidation, toggleBan);

// @route   PUT /api/admin/users/:id/storage
// @desc    Update user storage limit
// @access  Admin
router.put('/users/:id/storage', userIdValidation, updateStorageLimit);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and all data
// @access  Admin
router.delete('/users/:id', userIdValidation, deleteUser);

// @route   GET /api/admin/files
// @desc    Get all files in system
// @access  Admin
router.get('/files', paginationValidation, getAllFiles);

// @route   POST /api/admin/cleanup
// @desc    Run manual cleanup
// @access  Admin
router.post('/cleanup', runCleanup);

export default router;
