/**
 * Clipboard Model
 * Defines the schema for text clipboard/snippets
 */

import mongoose from 'mongoose';
import { CLIPBOARD_CONFIG } from '../config/constants.js';

const clipboardSchema = new mongoose.Schema({
    // Clipboard owner
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Clip title (optional)
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
        default: 'Untitled'
    },

    // Text content
    content: {
        type: String,
        required: [true, 'Content is required'],
        maxlength: [CLIPBOARD_CONFIG.MAX_LENGTH, `Content cannot exceed ${CLIPBOARD_CONFIG.MAX_LENGTH} characters`]
    },

    // Content type (plain text, code, link, etc.)
    contentType: {
        type: String,
        enum: ['text', 'code', 'link', 'json'],
        default: 'text'
    },

    // Programming language (if code)
    language: {
        type: String,
        default: null
    },

    // Expiry date
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + CLIPBOARD_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        index: true
    },

    // Is clip pinned
    isPinned: {
        type: Boolean,
        default: false
    },

    // Copy count
    copyCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// INDEXES
// ============================================

// TTL index for auto cleanup
clipboardSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// User + pinned index for sorting
clipboardSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

// ============================================
// VIRTUALS
// ============================================

// Virtual for content preview
clipboardSchema.virtual('preview').get(function () {
    const maxLength = 100;
    if (this.content.length <= maxLength) return this.content;
    return this.content.substring(0, maxLength) + '...';
});

// Virtual for time until expiry
clipboardSchema.virtual('expiresIn').get(function () {
    const now = new Date();
    const diff = this.expiresAt - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
});

// Virtual for content length
clipboardSchema.virtual('characterCount').get(function () {
    return this.content.length;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Increment copy count
 */
clipboardSchema.methods.incrementCopyCount = async function () {
    this.copyCount += 1;
    await this.save();
};

/**
 * Toggle pinned status
 */
clipboardSchema.methods.togglePin = async function () {
    this.isPinned = !this.isPinned;
    await this.save();
    return this.isPinned;
};

/**
 * Extend expiry
 * @param {number} days - Days to extend
 */
clipboardSchema.methods.extendExpiry = async function (days = CLIPBOARD_CONFIG.EXPIRY_DAYS) {
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Detect content type from content
 * @param {string} content - Text content
 * @returns {string} - Detected content type
 */
clipboardSchema.statics.detectContentType = function (content) {
    // Check if it's a URL
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (urlPattern.test(content.trim())) {
        return 'link';
    }

    // Check if it's JSON
    try {
        JSON.parse(content);
        return 'json';
    } catch {
        // Not JSON
    }

    // Check if it looks like code
    const codePatterns = [
        /function\s*\w*\s*\(/,
        /const\s+\w+\s*=/,
        /let\s+\w+\s*=/,
        /var\s+\w+\s*=/,
        /import\s+.*\s+from/,
        /class\s+\w+/,
        /def\s+\w+\(/,
        /public\s+(static\s+)?void/
    ];

    if (codePatterns.some(pattern => pattern.test(content))) {
        return 'code';
    }

    return 'text';
};

/**
 * Get user's clipboard with pagination
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{clips: Array, total: number}>}
 */
clipboardSchema.statics.getUserClips = async function (userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        search = ''
    } = options;

    const query = { userId };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await this.countDocuments(query);
    const clips = await this.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return { clips, total };
};

/**
 * Check if user has reached clip limit
 * @param {ObjectId} userId - User ID
 * @returns {Promise<boolean>}
 */
clipboardSchema.statics.hasReachedLimit = async function (userId) {
    const count = await this.countDocuments({ userId });
    return count >= CLIPBOARD_CONFIG.MAX_CLIPS;
};

const Clipboard = mongoose.model('Clipboard', clipboardSchema);

export default Clipboard;
