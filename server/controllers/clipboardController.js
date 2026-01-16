/**
 * Clipboard Controller
 * Handles text clipboard/snippet operations
 */

import { Clipboard } from '../models/index.js';
import {
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    CLIPBOARD_CONFIG,
    PAGINATION
} from '../config/constants.js';

/**
 * @route   GET /api/clipboard
 * @desc    Get user's clipboard items
 * @access  Private
 */
export const getClips = async (req, res, next) => {
    try {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            search
        } = req.query;

        const { clips, total } = await Clipboard.getUserClips(req.user._id, {
            page: parseInt(page),
            limit: parseInt(limit),
            search
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                clips,
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
 * @route   GET /api/clipboard/:id
 * @desc    Get single clipboard item
 * @access  Private
 */
export const getClip = async (req, res, next) => {
    try {
        const clip = await Clipboard.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!clip) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.CLIP_NOT_FOUND
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: { clip }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/clipboard
 * @desc    Create new clipboard item
 * @access  Private
 */
export const createClip = async (req, res, next) => {
    try {
        const { title, content, contentType, language } = req.body;

        // Check if user has reached clip limit
        const hasReachedLimit = await Clipboard.hasReachedLimit(req.user._id);
        if (hasReachedLimit) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: ERROR_MESSAGES.CLIP_LIMIT,
                limit: CLIPBOARD_CONFIG.MAX_CLIPS
            });
        }

        // Auto-detect content type if not provided
        const detectedType = contentType || Clipboard.detectContentType(content);

        // Create clip
        const clip = await Clipboard.create({
            userId: req.user._id,
            title: title || 'Untitled',
            content,
            contentType: detectedType,
            language: language || null,
            expiresAt: new Date(Date.now() + CLIPBOARD_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SUCCESS_MESSAGES.CLIP_CREATED,
            data: { clip }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/clipboard/:id
 * @desc    Update clipboard item
 * @access  Private
 */
export const updateClip = async (req, res, next) => {
    try {
        const { title, content, contentType, language } = req.body;

        const clip = await Clipboard.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!clip) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.CLIP_NOT_FOUND
            });
        }

        // Update fields
        if (title !== undefined) clip.title = title;
        if (content !== undefined) {
            clip.content = content;
            // Re-detect content type if content changed
            if (!contentType) {
                clip.contentType = Clipboard.detectContentType(content);
            }
        }
        if (contentType !== undefined) clip.contentType = contentType;
        if (language !== undefined) clip.language = language;

        await clip.save();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Clipboard updated',
            data: { clip }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/clipboard/:id/pin
 * @desc    Toggle pin status
 * @access  Private
 */
export const togglePin = async (req, res, next) => {
    try {
        const clip = await Clipboard.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!clip) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.CLIP_NOT_FOUND
            });
        }

        const isPinned = await clip.togglePin();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: isPinned ? 'Clip pinned' : 'Clip unpinned',
            data: { isPinned }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/clipboard/:id/copy
 * @desc    Record a copy action (increment counter)
 * @access  Private
 */
export const recordCopy = async (req, res, next) => {
    try {
        const clip = await Clipboard.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!clip) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.CLIP_NOT_FOUND
            });
        }

        await clip.incrementCopyCount();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: { copyCount: clip.copyCount }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/clipboard/:id
 * @desc    Delete clipboard item
 * @access  Private
 */
export const deleteClip = async (req, res, next) => {
    try {
        const clip = await Clipboard.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!clip) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.CLIP_NOT_FOUND
            });
        }

        await clip.deleteOne();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.CLIP_DELETED
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/clipboard
 * @desc    Delete multiple clipboard items
 * @access  Private
 */
export const deleteMultipleClips = async (req, res, next) => {
    try {
        const { clipIds } = req.body;

        if (!clipIds || !Array.isArray(clipIds) || clipIds.length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Please provide an array of clip IDs'
            });
        }

        const result = await Clipboard.deleteMany({
            _id: { $in: clipIds },
            userId: req.user._id
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `${result.deletedCount} clip(s) deleted`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getClips,
    getClip,
    createClip,
    updateClip,
    togglePin,
    recordCopy,
    deleteClip,
    deleteMultipleClips
};
