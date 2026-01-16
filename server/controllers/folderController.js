/**
 * Folder Controller
 * Handles folder CRUD operations
 */

import { Folder, File } from '../models/index.js';
import {
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES
} from '../config/constants.js';

/**
 * @route   GET /api/folders
 * @desc    Get all folders for current user
 * @access  Private
 */
export const getFolders = async (req, res, next) => {
    try {
        const { parentId, tree } = req.query;

        // Return folder tree if requested
        if (tree === 'true') {
            const folderTree = await Folder.getFolderTree(req.user._id);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: { folders: folderTree }
            });
        }

        // Build query
        const query = { userId: req.user._id };

        // Filter by parent
        if (parentId === 'root' || parentId === '') {
            query.parentId = null;
        } else if (parentId) {
            query.parentId = parentId;
        }

        const folders = await Folder.find(query).sort({ name: 1 });

        // Get file count for each folder
        const foldersWithCount = await Promise.all(
            folders.map(async (folder) => {
                const fileCount = await File.countDocuments({
                    folderId: folder._id,
                    userId: req.user._id
                });
                const subfolderCount = await Folder.countDocuments({
                    parentId: folder._id,
                    userId: req.user._id
                });
                return {
                    ...folder.toObject(),
                    fileCount,
                    subfolderCount
                };
            })
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: { folders: foldersWithCount }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/folders/:id
 * @desc    Get single folder with contents
 * @access  Private
 */
export const getFolder = async (req, res, next) => {
    try {
        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!folder) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FOLDER_NOT_FOUND
            });
        }

        // Get folder path (breadcrumb)
        const path = await Folder.getFolderPath(folder._id);

        // Get subfolders
        const subfolders = await Folder.find({
            parentId: folder._id,
            userId: req.user._id
        }).sort({ name: 1 });

        // Get files in folder
        const files = await File.find({
            folderId: folder._id,
            userId: req.user._id
        }).sort({ createdAt: -1 });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                folder,
                path,
                subfolders,
                files
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/folders
 * @desc    Create a new folder
 * @access  Private
 */
export const createFolder = async (req, res, next) => {
    try {
        const { name, parentId, color } = req.body;

        // Validate parent folder if specified
        if (parentId) {
            const parentFolder = await Folder.findOne({
                _id: parentId,
                userId: req.user._id
            });

            if (!parentFolder) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Parent folder not found'
                });
            }
        }

        // Check if folder with same name exists in parent
        const existingFolder = await Folder.findOne({
            userId: req.user._id,
            parentId: parentId || null,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingFolder) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: ERROR_MESSAGES.FOLDER_EXISTS
            });
        }

        // Create folder
        const folder = await Folder.create({
            userId: req.user._id,
            name,
            parentId: parentId || null,
            color: color || '#6366f1'
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SUCCESS_MESSAGES.FOLDER_CREATED,
            data: { folder }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/folders/:id
 * @desc    Update folder (rename, change color, move)
 * @access  Private
 */
export const updateFolder = async (req, res, next) => {
    try {
        const { name, color, parentId } = req.body;

        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!folder) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FOLDER_NOT_FOUND
            });
        }

        // Check for duplicate name in new location
        if (name || parentId !== undefined) {
            const targetParent = parentId !== undefined ?
                (parentId === 'root' ? null : parentId) :
                folder.parentId;

            const existingFolder = await Folder.findOne({
                userId: req.user._id,
                parentId: targetParent,
                name: { $regex: new RegExp(`^${name || folder.name}$`, 'i') },
                _id: { $ne: folder._id }
            });

            if (existingFolder) {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: ERROR_MESSAGES.FOLDER_EXISTS
                });
            }
        }

        // Prevent moving folder into itself or its children
        if (parentId && parentId !== 'root') {
            // Check if target is the folder itself
            if (parentId === folder._id.toString()) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Cannot move folder into itself'
                });
            }

            // Check if target is a child of this folder
            const isChild = await isDescendant(folder._id, parentId);
            if (isChild) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Cannot move folder into its own subfolder'
                });
            }

            folder.parentId = parentId;
        } else if (parentId === 'root') {
            folder.parentId = null;
        }

        // Update fields
        if (name) folder.name = name;
        if (color) folder.color = color;

        await folder.save();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.FOLDER_UPDATED,
            data: { folder }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if a folder is a descendant of another
 * @param {ObjectId} ancestorId - Potential ancestor folder
 * @param {ObjectId} descendantId - Potential descendant folder
 * @returns {Promise<boolean>}
 */
async function isDescendant(ancestorId, descendantId) {
    let current = await Folder.findById(descendantId);

    while (current && current.parentId) {
        if (current.parentId.toString() === ancestorId.toString()) {
            return true;
        }
        current = await Folder.findById(current.parentId);
    }

    return false;
}

/**
 * @route   DELETE /api/folders/:id
 * @desc    Delete folder and all contents
 * @access  Private
 */
export const deleteFolder = async (req, res, next) => {
    try {
        const { keepFiles } = req.query;

        const folder = await Folder.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!folder) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.FOLDER_NOT_FOUND
            });
        }

        // Option to move files to root instead of deleting
        if (keepFiles === 'true') {
            // Move all files in this folder (and subfolders) to root
            await File.updateMany(
                { folderId: folder._id, userId: req.user._id },
                { $set: { folderId: null } }
            );

            // Move files from subfolders recursively
            const moveFilesFromSubfolders = async (folderId) => {
                const subfolders = await Folder.find({ parentId: folderId });
                for (const subfolder of subfolders) {
                    await File.updateMany(
                        { folderId: subfolder._id, userId: req.user._id },
                        { $set: { folderId: null } }
                    );
                    await moveFilesFromSubfolders(subfolder._id);
                }
            };
            await moveFilesFromSubfolders(folder._id);
        }

        // Delete folder (cascade delete handled by pre middleware)
        await folder.deleteOne();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.FOLDER_DELETED
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder
};
