/**
 * OTP Model
 * Stores one-time passwords for email verification during signup
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AUTH_CONFIG } from '../config/constants.js';

const otpSchema = new mongoose.Schema({
    // Email associated with OTP
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    // Hashed OTP code
    otp: {
        type: String,
        required: true
    },

    // Expiry timestamp
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000)
    },

    // Number of verification attempts
    attempts: {
        type: Number,
        default: 0
    },

    // Maximum allowed attempts
    maxAttempts: {
        type: Number,
        default: 5
    }
}, {
    timestamps: true
});

// ============================================
// INDEXES
// ============================================

// TTL index - automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster email lookups
otpSchema.index({ email: 1 });

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Pre-save middleware to hash OTP
 */
otpSchema.pre('save', async function (next) {
    if (!this.isModified('otp')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.otp = await bcrypt.hash(this.otp, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Verify OTP code
 * @param {string} enteredOTP - OTP code to verify
 * @returns {Promise<boolean>} - True if OTP is valid
 */
otpSchema.methods.verifyOTP = async function (enteredOTP) {
    // Check if max attempts exceeded
    if (this.attempts >= this.maxAttempts) {
        return false;
    }

    // Check if expired
    if (this.expiresAt < new Date()) {
        return false;
    }

    // Increment attempts
    this.attempts += 1;
    await this.save();

    // Compare OTP
    return await bcrypt.compare(enteredOTP, this.otp);
};

/**
 * Check if OTP has expired
 * @returns {boolean} - True if expired
 */
otpSchema.methods.isExpired = function () {
    return this.expiresAt < new Date();
};

/**
 * Check if max attempts exceeded
 * @returns {boolean} - True if exceeded
 */
otpSchema.methods.isMaxAttemptsExceeded = function () {
    return this.attempts >= this.maxAttempts;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Generate a random OTP
 * @returns {string} - Generated OTP code
 */
otpSchema.statics.generateOTP = function () {
    const length = AUTH_CONFIG.OTP_LENGTH;
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

/**
 * Create new OTP for email (deletes existing OTPs for same email)
 * @param {string} email - Email address
 * @returns {Promise<{otp: OTP, plainOTP: string}>} - OTP document and plain OTP
 */
otpSchema.statics.createOTPForEmail = async function (email) {
    // Delete existing OTPs for this email
    await this.deleteMany({ email: email.toLowerCase() });

    // Generate new OTP
    const plainOTP = this.generateOTP();

    // Create OTP document
    const otpDoc = await this.create({
        email: email.toLowerCase(),
        otp: plainOTP,
        expiresAt: new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000)
    });

    return { otp: otpDoc, plainOTP };
};

/**
 * Find and verify OTP for email
 * @param {string} email - Email address
 * @param {string} otpCode - OTP code to verify
 * @returns {Promise<boolean>} - True if valid
 */
otpSchema.statics.verifyOTPForEmail = async function (email, otpCode) {
    const otpDoc = await this.findOne({ email: email.toLowerCase() });

    if (!otpDoc) {
        return false;
    }

    const isValid = await otpDoc.verifyOTP(otpCode);

    if (isValid) {
        // Delete OTP after successful verification
        await otpDoc.deleteOne();
    }

    return isValid;
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
