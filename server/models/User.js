/**
 * User Model
 * Defines the schema for user accounts in the system
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // Username - unique identifier for login
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },

    // Email - used for OTP verification
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },

    // Password - hashed using bcrypt
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },

    // Email verification status
    isVerified: {
        type: Boolean,
        default: false
    },

    // Admin flag
    isAdmin: {
        type: Boolean,
        default: false
    },

    // Ban status
    isBanned: {
        type: Boolean,
        default: false
    },

    // Ban reason (if banned)
    banReason: {
        type: String,
        default: null
    },

    // Storage usage tracking (in bytes)
    storageUsed: {
        type: Number,
        default: 0
    },

    // Storage limit (in bytes) - default 500MB
    storageLimit: {
        type: Number,
        default: 524288000
    },

    // Last login timestamp
    lastLogin: {
        type: Date,
        default: null
    },

    // Profile info (optional)
    profile: {
        fullName: {
            type: String,
            trim: true,
            maxlength: 50
        },
        department: {
            type: String,
            trim: true,
            maxlength: 50
        }
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// INDEXES
// ============================================

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ createdAt: -1 });

// ============================================
// VIRTUALS
// ============================================

// Virtual for storage percentage
userSchema.virtual('storagePercentage').get(function () {
    return Math.round((this.storageUsed / this.storageLimit) * 100);
});

// Virtual for remaining storage
userSchema.virtual('storageRemaining').get(function () {
    return this.storageLimit - this.storageUsed;
});

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Pre-save middleware to hash password
 * Only runs if password is modified
 */
userSchema.pre('save', async function (next) {
    // Skip if password not modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Update storage usage
 * @param {number} bytes - Bytes to add (positive) or remove (negative)
 */
userSchema.methods.updateStorage = async function (bytes) {
    this.storageUsed = Math.max(0, this.storageUsed + bytes);
    await this.save();
};

/**
 * Check if user has enough storage space
 * @param {number} bytes - Required space in bytes
 * @returns {boolean} - True if enough space available
 */
userSchema.methods.hasStorageSpace = function (bytes) {
    return (this.storageUsed + bytes) <= this.storageLimit;
};

/**
 * Update last login timestamp
 */
userSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    await this.save({ validateBeforeSave: false });
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find user by email or username
 * @param {string} identifier - Email or username
 * @returns {Promise<User>} - User document
 */
userSchema.statics.findByCredentials = async function (identifier) {
    return await this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() }
        ]
    }).select('+password');
};

// Create and export the model
const User = mongoose.model('User', userSchema);

export default User;
