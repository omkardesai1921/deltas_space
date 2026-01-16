/**
 * Dashboard Page Component
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { filesAPI, clipboardAPI } from '../services/api';
import {
    Upload,
    FolderOpen,
    ClipboardList,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    HardDrive,
    TrendingUp,
    Clock,
    Star
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
    const { user, refreshUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentFiles, setRecentFiles] = useState([]);
    const [recentClips, setRecentClips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Refresh user data for latest storage info
            await refreshUser();

            // Fetch file stats
            const statsRes = await filesAPI.getStats();
            setStats(statsRes.data.data);

            // Fetch recent files
            const filesRes = await filesAPI.getFiles({ limit: 5, sort: 'createdAt', order: 'desc' });
            setRecentFiles(filesRes.data.data.files);

            // Fetch recent clips
            const clipsRes = await clipboardAPI.getClips({ limit: 5 });
            setRecentClips(clipsRes.data.data.clips);
        } catch (error) {
            console.error('Dashboard data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) return <Image size={18} />;
        if (mimeType?.startsWith('video/')) return <Video size={18} />;
        if (mimeType?.startsWith('audio/')) return <Music size={18} />;
        if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <Archive size={18} />;
        return <FileText size={18} />;
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return d.toLocaleDateString();
    };

    if (loading) {
        return <LoadingSpinner fullScreen text="Loading dashboard..." />;
    }

    const storagePercentage = user ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back, {user?.username}!</h1>
                    <p className="text-secondary">Here's what's happening with your files.</p>
                </div>
                <Link to="/files" className="btn-primary">
                    <Upload size={18} />
                    Upload Files
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon storage">
                        <HardDrive size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Storage Used</span>
                        <span className="stat-value">{formatBytes(user?.storageUsed || 0)}</span>
                        <div className="stat-progress">
                            <div
                                className="stat-progress-fill"
                                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                            />
                        </div>
                        <span className="stat-detail">{storagePercentage}% of {formatBytes(user?.storageLimit || 0)}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon files">
                        <FileText size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Files</span>
                        <span className="stat-value">{stats?.totalFiles || 0}</span>
                        <span className="stat-detail">{stats?.totalDownloads || 0} total downloads</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon folders">
                        <FolderOpen size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Folders</span>
                        <span className="stat-value">-</span>
                        <span className="stat-detail">Organize your files</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon clips">
                        <ClipboardList size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Clipboard Items</span>
                        <span className="stat-value">{recentClips.length}</span>
                        <span className="stat-detail">Quick text snippets</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <Link to="/files" className="action-card">
                        <Upload size={24} />
                        <span>Upload Files</span>
                    </Link>
                    <Link to="/files" className="action-card">
                        <FolderOpen size={24} />
                        <span>Create Folder</span>
                    </Link>
                    <Link to="/clipboard" className="action-card">
                        <ClipboardList size={24} />
                        <span>New Clipboard</span>
                    </Link>
                    <Link to="/files?starred=true" className="action-card">
                        <Star size={24} />
                        <span>Starred Files</span>
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-section">
                <div className="recent-files">
                    <div className="section-header">
                        <h2>
                            <Clock size={20} />
                            Recent Files
                        </h2>
                        <Link to="/files" className="view-all">View all →</Link>
                    </div>

                    {recentFiles.length > 0 ? (
                        <div className="file-list">
                            {recentFiles.map(file => (
                                <div key={file._id} className="file-item">
                                    <div className="file-icon">
                                        {getFileIcon(file.mimeType)}
                                    </div>
                                    <div className="file-info">
                                        <span className="file-name">{file.originalName}</span>
                                        <span className="file-meta">
                                            {formatBytes(file.fileSize)} • {formatDate(file.createdAt)}
                                        </span>
                                    </div>
                                    {file.isStarred && (
                                        <Star size={14} className="star-icon" fill="currentColor" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FileText size={40} />
                            <p>No files yet. Upload your first file!</p>
                            <Link to="/files" className="btn-primary btn-sm">
                                <Upload size={16} />
                                Upload
                            </Link>
                        </div>
                    )}
                </div>

                <div className="recent-clips">
                    <div className="section-header">
                        <h2>
                            <ClipboardList size={20} />
                            Clipboard
                        </h2>
                        <Link to="/clipboard" className="view-all">View all →</Link>
                    </div>

                    {recentClips.length > 0 ? (
                        <div className="clip-list">
                            {recentClips.map(clip => (
                                <div key={clip._id} className="clip-item">
                                    <span className="clip-title">{clip.title}</span>
                                    <span className="clip-preview">{clip.preview}</span>
                                    <span className="clip-date">{formatDate(clip.createdAt)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <ClipboardList size={40} />
                            <p>No clipboard items yet.</p>
                            <Link to="/clipboard" className="btn-primary btn-sm">
                                Add Text
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
