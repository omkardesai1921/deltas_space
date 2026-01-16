/**
 * File Routes
 * Routes for file management
 */

import { Router } from 'express';
import {
    getFiles,
    getFileStats,
    uploadFiles,
    getFile,
    downloadFile,
    previewFile,
    updateFile,
    toggleStar,
    deleteFile,
    deleteMultipleFiles
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';
import { uploadMultiple, checkStorageSpace, handleUploadError } from '../middleware/upload.js';
import { uploadLimiter, downloadLimiter } from '../middleware/rateLimiter.js';
import { fileIdValidation, paginationValidation } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/files
// @desc    Get user's files
// @access  Private
router.get('/', paginationValidation, getFiles);

// @route   GET /api/files/stats
// @desc    Get file statistics
// @access  Private
router.get('/stats', getFileStats);

// @route   POST /api/files/upload
// @desc    Upload file(s)
// @access  Private
router.post(
    '/upload',
    uploadLimiter,
    checkStorageSpace,
    uploadMultiple,
    handleUploadError,
    uploadFiles
);

// @route   DELETE /api/files
// @desc    Delete multiple files
// @access  Private
router.delete('/', deleteMultipleFiles);

// @route   GET /api/files/:id
// @desc    Get single file details
// @access  Private
router.get('/:id', fileIdValidation, getFile);

// @route   GET /api/files/:id/download
// @desc    Download a file
// @access  Private
router.get('/:id/download', downloadLimiter, fileIdValidation, downloadFile);

// @route   GET /api/files/:id/preview
// @desc    Preview/view a file
// @access  Private
router.get('/:id/preview', fileIdValidation, previewFile);

// @route   PUT /api/files/:id
// @desc    Update file
// @access  Private
router.put('/:id', fileIdValidation, updateFile);

// @route   PUT /api/files/:id/star
// @desc    Toggle star status
// @access  Private
router.put('/:id/star', fileIdValidation, toggleStar);

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', fileIdValidation, deleteFile);

export default router;
