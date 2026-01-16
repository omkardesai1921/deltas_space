/**
 * Admin Controller
 * Handles admin operations like user management and system stats
 */

import { User, File, Folder, Clipboard } from '../models/index.js';
import { cleanupExpiredFiles, getStorageStats } from '../services/schedulerService.js';
import {
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    PAGINATION
} from '../config/constants.js';

/**
 * @route   GET /api/admin/stats
 * @desc    Get system-wide statistics
 * @access  Admin
 */
export const getSystemStats = async (req, res, next) => {
    try {
        // User stats
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
                    bannedUsers: { $sum: { $cond: ['$isBanned', 1, 0] } },
                    totalStorageUsed: { $sum: '$storageUsed' }
                }
            }
        ]);

        // Get storage stats
        const storageStats = await getStorageStats();

        // Clipboard stats
        const clipStats = await Clipboard.aggregate([
            {
                $group: {
                    _id: null,
                    totalClips: { $sum: 1 },
                    totalCopies: { $sum: '$copyCount' }
                }
            }
        ]);

        // Recent registrations (last 7 days)
        const recentRegistrations = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        // Active users (logged in last 7 days)
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        // Upload activity (last 24 hours)
        const recentUploads = await File.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                users: {
                    ...(userStats[0] || { totalUsers: 0, verifiedUsers: 0, bannedUsers: 0, totalStorageUsed: 0 }),
                    recentRegistrations,
                    activeUsers
                },
                storage: storageStats,
                clipboard: clipStats[0] || { totalClips: 0, totalCopies: 0 },
                activity: {
                    recentUploads
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Admin
 */
export const getUsers = async (req, res, next) => {
    try {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            search,
            status,
            sort = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Search by username or email
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by status
        if (status === 'verified') {
            query.isVerified = true;
            query.isBanned = false;
        } else if (status === 'unverified') {
            query.isVerified = false;
        } else if (status === 'banned') {
            query.isBanned = true;
        }

        // Build sort
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = { [sort]: sortOrder };

        // Execute query
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get file count for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const fileCount = await File.countDocuments({ userId: user._id });
                const folderCount = await Folder.countDocuments({ userId: user._id });
                const clipCount = await Clipboard.countDocuments({ userId: user._id });

                return {
                    ...user.toObject(),
                    fileCount,
                    folderCount,
                    clipCount
                };
            })
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                users: usersWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details with all data
 * @access  Admin
 */
export const getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        // Get user's files
        const files = await File.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        // Get user's folders
        const folders = await Folder.find({ userId: user._id })
            .sort({ createdAt: -1 });

        // Get file stats
        const fileStats = await File.getUserStats(user._id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                user,
                files,
                folders,
                stats: fileStats
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/admin/users/:id/ban
 * @desc    Ban or unban a user
 * @access  Admin
 */
export const toggleBan = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        // Cannot ban admin
        if (user.isAdmin) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Cannot ban an admin user'
            });
        }

        // Toggle ban status
        user.isBanned = !user.isBanned;
        user.banReason = user.isBanned ? (reason || 'Violation of terms') : null;
        await user.save();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: user.isBanned ? SUCCESS_MESSAGES.USER_BANNED : SUCCESS_MESSAGES.USER_UNBANNED,
            data: {
                userId: user._id,
                isBanned: user.isBanned,
                banReason: user.banReason
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/admin/users/:id/storage
 * @desc    Update user's storage limit
 * @access  Admin
 */
export const updateStorageLimit = async (req, res, next) => {
    try {
        const { storageLimit } = req.body;

        if (!storageLimit || storageLimit < 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Please provide a valid storage limit'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { storageLimit },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Storage limit updated',
            data: {
                userId: user._id,
                storageLimit: user.storageLimit,
                storageUsed: user.storageUsed
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user and all their data
 * @access  Admin
 */
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.USER_NOT_FOUND
            });
        }

        // Cannot delete admin
        if (user.isAdmin) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Cannot delete an admin user'
            });
        }

        // Delete user's files (with physical files)
        const files = await File.find({ userId: user._id });
        for (const file of files) {
            await file.deleteOne();
        }

        // Delete user's folders
        await Folder.deleteMany({ userId: user._id });

        // Delete user's clipboard items
        await Clipboard.deleteMany({ userId: user._id });

        // Delete user
        await user.deleteOne();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.USER_DELETED,
            data: {
                deletedFiles: files.length
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/admin/cleanup
 * @desc    Manually trigger cleanup of expired files
 * @access  Admin
 */
export const runCleanup = async (req, res, next) => {
    try {
        const result = await cleanupExpiredFiles();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Cleanup completed',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/admin/files
 * @desc    Get all files in the system
 * @access  Admin
 */
export const getAllFiles = async (req, res, next) => {
    try {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            search,
            userId,
            sort = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.originalName = { $regex: search, $options: 'i' };
        }

        if (userId) {
            query.userId = userId;
        }

        // Build sort
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = { [sort]: sortOrder };

        // Execute query
        const total = await File.countDocuments(query);
        const files = await File.find(query)
            .populate('userId', 'username email')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                files,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getSystemStats,
    getUsers,
    getUserDetails,
    toggleBan,
    updateStorageLimit,
    deleteUser,
    runCleanup,
    getAllFiles
};
