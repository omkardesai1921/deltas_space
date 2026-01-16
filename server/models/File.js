/**
 * File Model
 * Defines the schema for uploaded files
 */

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { FILE_CONFIG } from '../config/constants.js';

const fileSchema = new mongoose.Schema({
    // File owner
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Original file name (as uploaded)
    originalName: {
        type: String,
        required: true,
        trim: true
    },

    // Stored file name (UUID-based)
    fileName: {
        type: String,
        required: true,
        unique: true
    },

    // File path on server
    filePath: {
        type: String,
        required: true
    },

    // File size in bytes
    fileSize: {
        type: Number,
        required: true
    },

    // MIME type
    mimeType: {
        type: String,
        required: true
    },

    // File extension
    extension: {
        type: String,
        required: true
    },

    // Parent folder (null for root level)
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },

    // Expiry date (auto-delete after this date)
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + FILE_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        index: true
    },

    // Download count
    downloads: {
        type: Number,
        default: 0
    },

    // Last downloaded timestamp
    lastDownloaded: {
        type: Date,
        default: null
    },

    // File description (optional)
    description: {
        type: String,
        trim: true,
        maxlength: 200
    },

    // Is file starred/favorite
    isStarred: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// INDEXES
// ============================================

// TTL index - automatically delete expired files (metadata only)
// Actual file cleanup is handled by cron job
fileSchema.index({ expiresAt: 1 });

// Compound indexes for common queries
fileSchema.index({ userId: 1, folderId: 1 });
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, isStarred: 1 });

// ============================================
// VIRTUALS
// ============================================

// Virtual for file size in human-readable format
fileSchema.virtual('fileSizeFormatted').get(function () {
    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for time until expiry
fileSchema.virtual('expiresIn').get(function () {
    const now = new Date();
    const diff = this.expiresAt - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
});

// Virtual for file type category
fileSchema.virtual('fileType').get(function () {
    const mimeType = this.mimeType;

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    if (mimeType.startsWith('text/')) return 'text';

    return 'other';
});

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Post-save middleware to update user storage
 */
fileSchema.post('save', async function (doc) {
    if (this.wasNew) {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(doc.userId, {
            $inc: { storageUsed: doc.fileSize }
        });
    }
});

// Store wasNew flag before save
fileSchema.pre('save', function (next) {
    this.wasNew = this.isNew;
    next();
});

/**
 * Pre-delete middleware to clean up file and update storage
 */
fileSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        // Delete physical file
        await fs.unlink(this.filePath).catch(() => {
            console.warn(`File not found on disk: ${this.filePath}`);
        });

        // Update user storage
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(this.userId, {
            $inc: { storageUsed: -this.fileSize }
        });

        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Increment download count
 */
fileSchema.methods.incrementDownloads = async function () {
    this.downloads += 1;
    this.lastDownloaded = new Date();
    await this.save();
};

/**
 * Extend expiry date
 * @param {number} days - Days to extend
 */
fileSchema.methods.extendExpiry = async function (days = FILE_CONFIG.EXPIRY_DAYS) {
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.save();
};

/**
 * Toggle starred status
 */
fileSchema.methods.toggleStar = async function () {
    this.isStarred = !this.isStarred;
    await this.save();
    return this.isStarred;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get expired files for cleanup
 * @returns {Promise<Array>} - Array of expired files
 */
fileSchema.statics.getExpiredFiles = async function () {
    return await this.find({
        expiresAt: { $lt: new Date() }
    });
};

/**
 * Delete expired files
 * @returns {Promise<{count: number, freedSpace: number}>} - Cleanup stats
 */
fileSchema.statics.cleanupExpiredFiles = async function () {
    const expiredFiles = await this.getExpiredFiles();
    let freedSpace = 0;

    for (const file of expiredFiles) {
        freedSpace += file.fileSize;
        await file.deleteOne();
    }

    return {
        count: expiredFiles.length,
        freedSpace
    };
};

/**
 * Get user's file statistics
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} - File statistics
 */
fileSchema.statics.getUserStats = async function (userId) {
    const stats = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalFiles: { $sum: 1 },
                totalSize: { $sum: '$fileSize' },
                totalDownloads: { $sum: '$downloads' },
                avgFileSize: { $avg: '$fileSize' }
            }
        }
    ]);

    // Get file type distribution
    const typeDistribution = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$mimeType',
                count: { $sum: 1 },
                size: { $sum: '$fileSize' }
            }
        },
        { $sort: { count: -1 } }
    ]);

    return {
        ...(stats[0] || { totalFiles: 0, totalSize: 0, totalDownloads: 0, avgFileSize: 0 }),
        typeDistribution
    };
};

const File = mongoose.model('File', fileSchema);

export default File;
