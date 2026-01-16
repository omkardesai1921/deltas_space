/**
 * Folder Routes
 * Routes for folder management
 */

import { Router } from 'express';
import {
    getFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder
} from '../controllers/folderController.js';
import { protect } from '../middleware/auth.js';
import {
    createFolderValidation,
    updateFolderValidation,
    folderIdValidation
} from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/folders
// @desc    Get user's folders
// @access  Private
router.get('/', getFolders);

// @route   POST /api/folders
// @desc    Create new folder
// @access  Private
router.post('/', createFolderValidation, createFolder);

// @route   GET /api/folders/:id
// @desc    Get folder with contents
// @access  Private
router.get('/:id', folderIdValidation, getFolder);

// @route   PUT /api/folders/:id
// @desc    Update folder
// @access  Private
router.put('/:id', updateFolderValidation, updateFolder);

// @route   DELETE /api/folders/:id
// @desc    Delete folder
// @access  Private
router.delete('/:id', folderIdValidation, deleteFolder);

export default router;
