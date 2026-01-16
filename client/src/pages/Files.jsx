/**
 * Files Page Component
 * File management with upload, folders, and file operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import { filesAPI, foldersAPI } from '../services/api';
import {
    Upload,
    FolderPlus,
    FolderOpen,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    Download,
    Trash2,
    Star,
    MoreVertical,
    Grid,
    List,
    Search,
    X,
    ChevronRight,
    Home,
    Eye,
    Edit2,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './Files.css';

const Files = () => {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshUser } = useAuth();

    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showFileMenu, setShowFileMenu] = useState(null);

    // Fetch files and folders
    useEffect(() => {
        fetchData();
    }, [folderId, searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const starred = searchParams.get('starred') === 'true';
            const search = searchParams.get('search') || '';

            // Fetch files
            const filesRes = await filesAPI.getFiles({
                folderId: folderId || 'root',
                search,
                starred: starred ? 'true' : undefined
            });
            setFiles(filesRes.data.data.files);

            // Fetch folders (only if not searching/filtering)
            if (!search && !starred) {
                const foldersRes = await foldersAPI.getFolders({
                    parentId: folderId || 'root'
                });
                setFolders(foldersRes.data.data.folders);
            } else {
                setFolders([]);
            }

            // Fetch folder details if in a folder
            if (folderId) {
                const folderRes = await foldersAPI.getFolder(folderId);
                setCurrentFolder(folderRes.data.data.folder);
                setBreadcrumbs(folderRes.data.data.path);
            } else {
                setCurrentFolder(null);
                setBreadcrumbs([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    // File upload handler
    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        acceptedFiles.forEach(file => {
            formData.append('files', file);
        });
        if (folderId) {
            formData.append('folderId', folderId);
        }

        try {
            await filesAPI.uploadFiles(formData, (progress) => {
                setUploadProgress(progress);
            });

            toast.success(`${acceptedFiles.length} file(s) uploaded successfully`);
            await fetchData();
            await refreshUser();
        } catch (error) {
            const message = error.response?.data?.message || 'Upload failed';
            toast.error(message);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [folderId, refreshUser]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true
    });

    // Create folder
    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) {
            toast.error('Please enter a folder name');
            return;
        }

        try {
            await foldersAPI.createFolder({
                name: newFolderName.trim(),
                parentId: folderId || null
            });
            toast.success('Folder created');
            setShowNewFolderModal(false);
            setNewFolderName('');
            await fetchData();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create folder';
            toast.error(message);
        }
    };

    // Download file
    const handleDownload = async (file) => {
        try {
            const response = await filesAPI.downloadFile(file._id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Download started');
        } catch (error) {
            toast.error('Download failed');
        }
    };

    // Toggle star
    const handleToggleStar = async (file) => {
        try {
            await filesAPI.toggleStar(file._id);
            setFiles(prev => prev.map(f =>
                f._id === file._id ? { ...f, isStarred: !f.isStarred } : f
            ));
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    // Delete file
    const handleDeleteFile = async (file) => {
        if (!window.confirm(`Delete "${file.originalName}"?`)) return;

        try {
            await filesAPI.deleteFile(file._id);
            toast.success('File deleted');
            await fetchData();
            await refreshUser();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    // Delete folder
    const handleDeleteFolder = async (folder) => {
        if (!window.confirm(`Delete folder "${folder.name}" and all its contents?`)) return;

        try {
            await foldersAPI.deleteFolder(folder._id);
            toast.success('Folder deleted');
            await fetchData();
        } catch (error) {
            toast.error('Failed to delete folder');
        }
    };

    // File icon helper
    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) return <Image size={24} />;
        if (mimeType?.startsWith('video/')) return <Video size={24} />;
        if (mimeType?.startsWith('audio/')) return <Music size={24} />;
        if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <Archive size={24} />;
        return <FileText size={24} />;
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <LoadingSpinner fullScreen text="Loading files..." />;
    }

    return (
        <div className="files-page" {...getRootProps()}>
            <input {...getInputProps()} />

            {/* Drag overlay */}
            {isDragActive && (
                <div className="drag-overlay">
                    <div className="drag-content">
                        <Upload size={48} />
                        <h3>Drop files to upload</h3>
                        <p>Files will be uploaded to {currentFolder?.name || 'root'}</p>
                    </div>
                </div>
            )}

            {/* Upload progress */}
            {uploading && (
                <div className="upload-progress">
                    <div className="progress-content">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Uploading... {uploadProgress}%</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="files-header">
                <div className="header-left">
                    <h1>{searchParams.get('starred') ? 'Starred Files' : 'My Files'}</h1>

                    {/* Breadcrumbs */}
                    <div className="breadcrumbs">
                        <button onClick={() => navigate('/files')} className="breadcrumb-item">
                            <Home size={14} />
                            <span>Root</span>
                        </button>
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb._id} className="breadcrumb-wrapper">
                                <ChevronRight size={14} />
                                <button
                                    onClick={() => navigate(`/files/${crumb._id}`)}
                                    className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    navigate(`/files?search=${encodeURIComponent(searchQuery)}`);
                                }
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="clear-search">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="view-toggle">
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button className="btn-secondary" onClick={() => setShowNewFolderModal(true)}>
                        <FolderPlus size={18} />
                        New Folder
                    </button>
                    <button className="btn-primary" onClick={open}>
                        <Upload size={18} />
                        Upload
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className={`files-content ${viewMode}`}>
                {/* Folders */}
                {folders.length > 0 && (
                    <div className="section">
                        <h3 className="section-title">Folders</h3>
                        <div className={`items-${viewMode}`}>
                            {folders.map(folder => (
                                <div
                                    key={folder._id}
                                    className="folder-item"
                                    onClick={() => navigate(`/files/${folder._id}`)}
                                >
                                    <div className="folder-icon" style={{ color: folder.color }}>
                                        <FolderOpen size={viewMode === 'grid' ? 40 : 24} />
                                    </div>
                                    <div className="folder-info">
                                        <span className="folder-name">{folder.name}</span>
                                        <span className="folder-meta">
                                            {folder.fileCount} files • {folder.subfolderCount} folders
                                        </span>
                                    </div>
                                    <button
                                        className="item-menu-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFolder(folder);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Files */}
                {files.length > 0 && (
                    <div className="section">
                        <h3 className="section-title">Files</h3>
                        <div className={`items-${viewMode}`}>
                            {files.map(file => (
                                <div
                                    key={file._id}
                                    className="file-item"
                                    onClick={() => setSelectedFile(file)}
                                >
                                    <div className="file-icon">
                                        {file.mimeType?.startsWith('image/') ? (
                                            <img
                                                src={filesAPI.previewFile(file._id)}
                                                alt={file.originalName}
                                                className="file-thumbnail"
                                            />
                                        ) : (
                                            getFileIcon(file.mimeType)
                                        )}
                                    </div>
                                    <div className="file-info">
                                        <span className="file-name">{file.originalName}</span>
                                        <span className="file-meta">
                                            {formatBytes(file.fileSize)} • {formatDate(file.createdAt)}
                                        </span>
                                    </div>
                                    <div className="file-actions">
                                        <button
                                            className={`star-btn ${file.isStarred ? 'starred' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStar(file);
                                            }}
                                        >
                                            <Star size={16} fill={file.isStarred ? 'currentColor' : 'none'} />
                                        </button>
                                        <button
                                            className="download-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(file);
                                            }}
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFile(file);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {folders.length === 0 && files.length === 0 && (
                    <div className="empty-state">
                        <Upload size={64} />
                        <h3>No files yet</h3>
                        <p>Upload files or create a folder to get started</p>
                        <div className="empty-actions">
                            <button className="btn-primary" onClick={open}>
                                <Upload size={18} />
                                Upload Files
                            </button>
                            <button className="btn-secondary" onClick={() => setShowNewFolderModal(true)}>
                                <FolderPlus size={18} />
                                New Folder
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Folder</h3>
                            <button onClick={() => setShowNewFolderModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFolder}>
                            <div className="form-group">
                                <label>Folder Name</label>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Enter folder name"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowNewFolderModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Folder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {selectedFile && (
                <div className="modal-overlay" onClick={() => setSelectedFile(null)}>
                    <div className="modal file-preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedFile.originalName}</h3>
                            <button onClick={() => setSelectedFile(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="preview-content">
                            {selectedFile.mimeType?.startsWith('image/') ? (
                                <img
                                    src={filesAPI.previewFile(selectedFile._id)}
                                    alt={selectedFile.originalName}
                                />
                            ) : selectedFile.mimeType?.startsWith('video/') ? (
                                <video controls>
                                    <source src={filesAPI.previewFile(selectedFile._id)} type={selectedFile.mimeType} />
                                </video>
                            ) : selectedFile.mimeType?.startsWith('audio/') ? (
                                <audio controls>
                                    <source src={filesAPI.previewFile(selectedFile._id)} type={selectedFile.mimeType} />
                                </audio>
                            ) : (
                                <div className="no-preview">
                                    {getFileIcon(selectedFile.mimeType)}
                                    <p>Preview not available</p>
                                </div>
                            )}
                        </div>
                        <div className="preview-info">
                            <div className="info-row">
                                <span>Size:</span>
                                <span>{formatBytes(selectedFile.fileSize)}</span>
                            </div>
                            <div className="info-row">
                                <span>Uploaded:</span>
                                <span>{formatDate(selectedFile.createdAt)}</span>
                            </div>
                            <div className="info-row">
                                <span>Expires:</span>
                                <span>{selectedFile.expiresIn}</span>
                            </div>
                            <div className="info-row">
                                <span>Downloads:</span>
                                <span>{selectedFile.downloads}</span>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={() => handleDownload(selectedFile)}>
                                <Download size={18} />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Files;
