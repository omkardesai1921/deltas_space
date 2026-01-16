/**
 * Folder Model
 * Defines the schema for user folders/directories
 */

import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    // Folder owner
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Folder name
    name: {
        type: String,
        required: [true, 'Folder name is required'],
        trim: true,
        maxlength: [50, 'Folder name cannot exceed 50 characters']
    },

    // Parent folder (null for root level)
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },

    // Folder color (for UI)
    color: {
        type: String,
        default: '#6366f1' // Default indigo color
    },

    // Folder icon (optional)
    icon: {
        type: String,
        default: 'folder'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// INDEXES
// ============================================

// Compound index for user's folders
folderSchema.index({ userId: 1, parentId: 1 });

// Unique folder name per user in same parent
folderSchema.index({ userId: 1, parentId: 1, name: 1 }, { unique: true });

// ============================================
// VIRTUALS
// ============================================

// Virtual for files in this folder
folderSchema.virtual('files', {
    ref: 'File',
    localField: '_id',
    foreignField: 'folderId'
});

// Virtual for subfolders
folderSchema.virtual('subfolders', {
    ref: 'Folder',
    localField: '_id',
    foreignField: 'parentId'
});

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Pre-remove middleware to handle cascading deletes
 * Deletes all files and subfolders when folder is deleted
 */
folderSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const File = mongoose.model('File');
    const Folder = mongoose.model('Folder');

    try {
        // Get all subfolders recursively
        const subfolders = await Folder.find({ parentId: this._id });

        // Delete subfolders recursively
        for (const subfolder of subfolders) {
            await subfolder.deleteOne();
        }

        // Delete all files in this folder
        await File.deleteMany({ folderId: this._id });

        next();
    } catch (error) {
        next(error);
    }
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get folder tree for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Array>} - Folder tree structure
 */
folderSchema.statics.getFolderTree = async function (userId) {
    const folders = await this.find({ userId }).sort({ name: 1 });

    // Build tree structure
    const folderMap = new Map();
    const tree = [];

    // First pass: create map of all folders
    folders.forEach(folder => {
        folderMap.set(folder._id.toString(), {
            ...folder.toObject(),
            children: []
        });
    });

    // Second pass: build tree
    folders.forEach(folder => {
        const folderObj = folderMap.get(folder._id.toString());

        if (folder.parentId) {
            const parent = folderMap.get(folder.parentId.toString());
            if (parent) {
                parent.children.push(folderObj);
            } else {
                // Parent doesn't exist, treat as root
                tree.push(folderObj);
            }
        } else {
            tree.push(folderObj);
        }
    });

    return tree;
};

/**
 * Get folder path (breadcrumb)
 * @param {ObjectId} folderId - Folder ID
 * @returns {Promise<Array>} - Array of folder objects from root to current
 */
folderSchema.statics.getFolderPath = async function (folderId) {
    const path = [];
    let currentFolder = await this.findById(folderId);

    while (currentFolder) {
        path.unshift({
            _id: currentFolder._id,
            name: currentFolder.name
        });

        if (currentFolder.parentId) {
            currentFolder = await this.findById(currentFolder.parentId);
        } else {
            break;
        }
    }

    return path;
};

const Folder = mongoose.model('Folder', folderSchema);

export default Folder;
