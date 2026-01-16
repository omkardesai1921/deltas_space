/**
 * Clipboard Routes
 * Routes for text clipboard/snippet management
 */

import { Router } from 'express';
import {
    getClips,
    getClip,
    createClip,
    updateClip,
    togglePin,
    recordCopy,
    deleteClip,
    deleteMultipleClips
} from '../controllers/clipboardController.js';
import { protect } from '../middleware/auth.js';
import {
    createClipboardValidation,
    clipboardIdValidation,
    paginationValidation
} from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/clipboard
// @desc    Get user's clipboard items
// @access  Private
router.get('/', paginationValidation, getClips);

// @route   POST /api/clipboard
// @desc    Create new clipboard item
// @access  Private
router.post('/', createClipboardValidation, createClip);

// @route   DELETE /api/clipboard
// @desc    Delete multiple clipboard items
// @access  Private
router.delete('/', deleteMultipleClips);

// @route   GET /api/clipboard/:id
// @desc    Get single clipboard item
// @access  Private
router.get('/:id', clipboardIdValidation, getClip);

// @route   PUT /api/clipboard/:id
// @desc    Update clipboard item
// @access  Private
router.put('/:id', clipboardIdValidation, updateClip);

// @route   PUT /api/clipboard/:id/pin
// @desc    Toggle pin status
// @access  Private
router.put('/:id/pin', clipboardIdValidation, togglePin);

// @route   POST /api/clipboard/:id/copy
// @desc    Record copy action
// @access  Private
router.post('/:id/copy', clipboardIdValidation, recordCopy);

// @route   DELETE /api/clipboard/:id
// @desc    Delete clipboard item
// @access  Private
router.delete('/:id', clipboardIdValidation, deleteClip);

export default router;
