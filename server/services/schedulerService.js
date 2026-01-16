/**
 * Scheduled Tasks Service
 * Handles automated cleanup and maintenance tasks
 */

import cron from 'node-cron';
import { File, Clipboard, User } from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
import { FILE_CONFIG } from '../config/constants.js';

/**
 * Cleanup expired files
 * Runs daily to remove files past their expiry date
 * @returns {Promise<Object>} Cleanup statistics
 */
export const cleanupExpiredFiles = async () => {
    console.log('🧹 Starting expired files cleanup...');

    const startTime = Date.now();
    let deletedCount = 0;
    let freedSpace = 0;
    let errors = [];

    try {
        // Get all expired files
        const expiredFiles = await File.find({
            expiresAt: { $lt: new Date() }
        }).populate('userId', 'username email');

        console.log(`📁 Found ${expiredFiles.length} expired files`);

        // Group files by user for storage update
        const userStorageUpdates = new Map();

        for (const file of expiredFiles) {
            try {
                // Track storage to free per user
                if (file.userId) {
                    const userId = file.userId._id.toString();
                    const current = userStorageUpdates.get(userId) || 0;
                    userStorageUpdates.set(userId, current + file.fileSize);
                }

                // Delete physical file
                try {
                    await fs.unlink(file.filePath);
                } catch (err) {
                    if (err.code !== 'ENOENT') {
                        console.warn(`⚠️ Could not delete file: ${file.filePath}`);
                    }
                }

                // Delete database record
                await File.deleteOne({ _id: file._id });

                deletedCount++;
                freedSpace += file.fileSize;

                console.log(`✓ Deleted: ${file.originalName} (${formatBytes(file.fileSize)})`);
            } catch (error) {
                errors.push({ file: file.originalName, error: error.message });
                console.error(`✗ Error deleting ${file.originalName}:`, error.message);
            }
        }

        // Update user storage
        for (const [userId, spaceFreed] of userStorageUpdates) {
            try {
                await User.findByIdAndUpdate(userId, {
                    $inc: { storageUsed: -spaceFreed }
                });
            } catch (error) {
                console.error(`Error updating storage for user ${userId}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
        errors.push({ error: error.message });
    }

    const duration = Date.now() - startTime;

    const result = {
        deletedCount,
        freedSpace,
        freedSpaceFormatted: formatBytes(freedSpace),
        duration: `${duration}ms`,
        errors: errors.length > 0 ? errors : null,
        timestamp: new Date().toISOString()
    };

    console.log(`✅ Cleanup complete: ${deletedCount} files, ${formatBytes(freedSpace)} freed in ${duration}ms`);

    return result;
};

/**
 * Cleanup expired clipboard items
 * @returns {Promise<Object>} Cleanup statistics
 */
export const cleanupExpiredClipboards = async () => {
    console.log('📋 Starting expired clipboard cleanup...');

    try {
        // MongoDB TTL index handles this automatically, but we can force cleanup
        const result = await Clipboard.deleteMany({
            expiresAt: { $lt: new Date() }
        });

        console.log(`✅ Deleted ${result.deletedCount} expired clipboard items`);
        return { deletedCount: result.deletedCount };
    } catch (error) {
        console.error('❌ Clipboard cleanup error:', error.message);
        return { error: error.message };
    }
};

/**
 * Cleanup orphaned files
 * Files on disk that don't have database records
 * @returns {Promise<Object>} Cleanup statistics
 */
export const cleanupOrphanedFiles = async () => {
    console.log('🔍 Starting orphaned files cleanup...');

    const uploadDir = path.join(process.cwd(), FILE_CONFIG.UPLOAD_DIR);
    let deletedCount = 0;
    let freedSpace = 0;

    try {
        // Get all user directories
        const userDirs = await fs.readdir(uploadDir);

        for (const userDir of userDirs) {
            const userPath = path.join(uploadDir, userDir);
            const stat = await fs.stat(userPath);

            if (!stat.isDirectory()) continue;

            // Get all files in user directory
            const files = await fs.readdir(userPath);

            for (const fileName of files) {
                const filePath = path.join(userPath, fileName);

                // Check if file exists in database
                const dbFile = await File.findOne({ fileName });

                if (!dbFile) {
                    // Orphaned file - delete it
                    try {
                        const fileStat = await fs.stat(filePath);
                        await fs.unlink(filePath);
                        deletedCount++;
                        freedSpace += fileStat.size;
                        console.log(`✓ Deleted orphaned: ${fileName}`);
                    } catch (error) {
                        console.warn(`⚠️ Could not delete orphaned file: ${filePath}`);
                    }
                }
            }
        }

        console.log(`✅ Orphaned cleanup: ${deletedCount} files, ${formatBytes(freedSpace)} freed`);
        return { deletedCount, freedSpace, freedSpaceFormatted: formatBytes(freedSpace) };
    } catch (error) {
        console.error('❌ Orphaned cleanup error:', error.message);
        return { error: error.message };
    }
};

/**
 * Calculate storage statistics
 * @returns {Promise<Object>} Storage statistics
 */
export const getStorageStats = async () => {
    try {
        // Total storage used
        const totalStats = await File.aggregate([
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                    totalDownloads: { $sum: '$downloads' }
                }
            }
        ]);

        // Files expiring soon (next 24 hours)
        const expiringSoon = await File.countDocuments({
            expiresAt: {
                $gt: new Date(),
                $lt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });

        // Files by type
        const byType = await File.aggregate([
            {
                $group: {
                    _id: '$mimeType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return {
            ...(totalStats[0] || { totalFiles: 0, totalSize: 0, totalDownloads: 0 }),
            totalSizeFormatted: formatBytes(totalStats[0]?.totalSize || 0),
            expiringSoon,
            byType
        };
    } catch (error) {
        console.error('Error getting storage stats:', error.message);
        return { error: error.message };
    }
};

/**
 * Format bytes to human readable
 * @param {number} bytes 
 * @returns {string}
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Initialize all scheduled tasks
 */
export const initScheduledTasks = () => {
    console.log('⏰ Initializing scheduled tasks...');

    // Run file cleanup every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('📅 Running scheduled file cleanup...');
        await cleanupExpiredFiles();
        await cleanupExpiredClipboards();
    }, {
        timezone: process.env.TZ || 'Asia/Kolkata'
    });

    // Run orphaned file cleanup every week on Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('📅 Running weekly orphaned file cleanup...');
        await cleanupOrphanedFiles();
    }, {
        timezone: process.env.TZ || 'Asia/Kolkata'
    });

    // Log storage stats daily at midnight
    cron.schedule('0 0 * * *', async () => {
        const stats = await getStorageStats();
        console.log('📊 Daily Storage Stats:', JSON.stringify(stats, null, 2));
    }, {
        timezone: process.env.TZ || 'Asia/Kolkata'
    });

    console.log('✅ Scheduled tasks initialized');
    console.log('   - File cleanup: Daily at 2:00 AM');
    console.log('   - Orphan cleanup: Weekly on Sunday at 3:00 AM');
    console.log('   - Storage stats: Daily at midnight');
};

export default {
    cleanupExpiredFiles,
    cleanupExpiredClipboards,
    cleanupOrphanedFiles,
    getStorageStats,
    initScheduledTasks
};
