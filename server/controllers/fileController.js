/**
 * File Controller
 * Handles file upload, download, and management
 */

import path from 'path';
import fs from 'fs/promises';
import { File, Folder, User } from '../models/index.js';
import {
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    FILE_CONFIG,
    PAGINATION
} from '../config/constants.js';

/**
 * @route   GET /api/files
 * @desc    Get user's files (with optional folder filter)
 * @access  Private
 */
export const getFiles = async (req, res, next) => {
    try {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            folderId,
            search,
            type,
            sort = 'createdAt',
            order = 'desc',
            starred
        } = req.query;

        // Build query
        const query = { userId: req.user._id };

        // Filter by folder (null for root)
        if (folderId === 'root' || folderId === '') {
            query.folderId = null;
        } else if (folderId) {
            query.folderId = folderId;
        }

        // Search by filename
        if (search) {
            query.originalName = { $regex: search, $options: 'i' };
        }

        // Filter by file type
        if (type) {
            if (type === 'image') {
                query.mimeType = { $regex: '^image/' };
            } else if (type === 'video') {
                query.mimeType = { $regex: '^video/' };
            } else if (type === 'audio') {
                query.mimeType = { $regex: '^audio/' };
            } else if (type === 'document') {
                query.mimeType = {
                    $in: [
                        'application/pdf',
                        'application/msword',
                        /application\/vnd\.openxmlformats/
                    ]
                };
            }
        }

        // Filter starred
        if (starred === 'true') {
            query.isStarred = true;
        }

        // Build sort
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = { [sort]: sortOrder };

        // Execute query with pagination
        const total = await File.countDocuments(query);
        const files = await File.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('folderId', 'name color');

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

/**
 * @route   GET /api/files/stats
 * @desc    Get file statistics for current user
 * @access  Private
 */
export const getFileStats = async (req, res, next) => {
    try {
        const stats = await File.getUserStats(req.user._id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                ...stats,
                storageUsed: req.user.storageUsed,
                storageLimit: req.user.storageLimit,
                storagePercentage: req.user.storagePercentage
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/files/upload
 * @desc    Upload file(s)
 * @access  Private
 */
export const uploadFiles = async (req, res, next) => {
    try {
        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            if (!req.file) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }
            req.files = [req.file];
        }

        const { folderId } = req.body;
        const uploadedFiles = [];
        let totalSize = 0;

        // Validate folder if specified
        if (folderId) {
            const folder = await Folder.findOne({
                _id: folderId,
                userId: req.user._id
            });

            if (!folder) {
                // Delete uploaded files
                for (const file of req.files) {
                    await fs.unlink(file.path).catch(() => { });
                }

                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: ERROR_MESSAGES.FOLDER_NOT_FOUND
                });
            }
        }

        // Calculate total size and check storage
        for (const file of req.files) {
            totalSize += file.size;
        }

        if (!req.user.hasStorageSpace(totalSize)) {
            // Delete uploaded files
            for (const file of req.files) {
                await fs.unlink(file.path).catch(() => { });
            }

            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: ERROR_MESSAGES.STORAGE_LIMIT,
                storageUsed: req.user.storageUsed,
                storageLimit: req.user.storageLimit,
                required: totalSize
            });
        }

        // Create file records
        for (const file of req.files) {
            const fileDoc = await File.create({
                userId: req.user._id,
                originalName: file.originalname,
                fileName: file.filename,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                extension: path.extname(file.originalname).toLowerCase(),
                folderId: folderId || null,
                expiresAt: new Date(Date.now() + FILE_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000)
            });

            uploadedFiles.push(fileDoc);
        }

        // Update user storage
        await req.user.updateStorage(totalSize);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SUCCESS_MESSAGES.FILE_UPLOADED,
            data: {
                files: uploadedFiles,
                count: uploadedFiles.length,
                totalSize,
                storageUsed: req.user.storageUsed + totalSize,
                storageLimit: req.user.storageLimit
            }
        });
    } catch (error) {
        // Cleanup on error
        if (req.files) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(() => { });
            }
        }
        next(error);
    }
};

/**
 * @route   GET /api/files/:id
 * @desc    Get single file details
 * @access  Private
 */
export const getFile = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('folderId', 'name color');

        if (!file) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: { file }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/files/:id/download
 * @desc    Download a file
 * @access  Private
 */
export const downloadFile = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!file) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }

        // Check if file exists on disk
        try {
            await fs.access(file.filePath);
        } catch {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // Increment download count
        await file.incrementDownloads();

        // Set headers for download
        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
            'Content-Length': file.fileSize
        });

        // Stream file
        const fileStream = require('fs').createReadStream(file.filePath);
        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/files/:id/preview
 * @desc    Preview/view a file (for images, PDFs, etc.)
 * @access  Private
 */
export const previewFile = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!file) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }

        // Check if file exists on disk
        try {
            await fs.access(file.filePath);
        } catch {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // Set headers for inline viewing
        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
            'Content-Length': file.fileSize,
            'Cache-Control': 'private, max-age=3600'
        });

        // Stream file
        const fileStream = require('fs').createReadStream(file.filePath);
        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/files/:id
 * @desc    Update file (rename, move folder, toggle star)
 * @access  Private
 */
export const updateFile = async (req, res, next) => {
    try {
        const { originalName, folderId, isStarred, description } = req.body;

        const file = await File.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!file) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }

        // Validate folder if changing
        if (folderId !== undefined) {
            if (folderId && folderId !== 'root') {
                const folder = await Folder.findOne({
                    _id: folderId,
                    userId: req.user._id
                });

                if (!folder) {
                    return res.status(HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: ERROR_MESSAGES.FOLDER_NOT_FOUND
                    });
                }
                file.folderId = folderId;
            } else {
                file.folderId = null;
            }
        }

        // Update fields
        if (originalName) file.originalName = originalName;
        if (isStarred !== undefined) file.isStarred = isStarred;
        if (description !== undefined) file.description = description;

        await file.save();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'File updated successfully',
            data: { file }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/files/:id/star
 * @desc    Toggle file star status
 * @access  Private
 */
export const toggleStar = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!file) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }

        const isStarred = await file.toggleStar();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: isStarred ? 'File starred' : 'File unstarred',
            data: { isStarred }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete a file
 * @access  Private
 */
export const deleteFile = async (req, res, next) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!file) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FILE_NOT_FOUND
            });
        }

        const fileSize = file.fileSize;

        // Delete file (middleware handles physical file and storage update)
        await file.deleteOne();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.FILE_DELETED,
            data: {
                freedSpace: fileSize,
                storageUsed: req.user.storageUsed - fileSize
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/files
 * @desc    Delete multiple files
 * @access  Private
 */
export const deleteMultipleFiles = async (req, res, next) => {
    try {
        const { fileIds } = req.body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Please provide an array of file IDs'
            });
        }

        // Find all files belonging to user
        const files = await File.find({
            _id: { $in: fileIds },
            userId: req.user._id
        });

        if (files.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'No files found'
            });
        }

        let totalFreed = 0;

        // Delete each file
        for (const file of files) {
            totalFreed += file.fileSize;
            await file.deleteOne();
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `${files.length} file(s) deleted`,
            data: {
                deletedCount: files.length,
                freedSpace: totalFreed,
                storageUsed: req.user.storageUsed - totalFreed
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
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
};
