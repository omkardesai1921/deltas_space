/**
 * Admin Panel Page Component
 */

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, FileText, HardDrive, TrendingUp, Search, Ban, Trash2, RefreshCw, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './Admin.css';

const Admin = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [runningCleanup, setRunningCleanup] = useState(false);

    useEffect(() => { fetchData(); }, [statusFilter]);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getUsers({ status: statusFilter, search: searchQuery })
            ]);
            setStats(statsRes.data.data);
            setUsers(usersRes.data.data.users);
        } catch (error) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => { e.preventDefault(); fetchData(); };

    const handleBanUser = async (user) => {
        const action = user.isBanned ? 'unban' : 'ban';
        if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user "${user.username}"?`)) return;
        try {
            await adminAPI.toggleBan(user._id, 'Violation of terms');
            toast.success(`User ${action}ned`);
            fetchData();
        } catch (error) {
            toast.error(`Failed to ${action} user`);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Delete user "${user.username}" and ALL their data? This cannot be undone.`)) return;
        try {
            await adminAPI.deleteUser(user._id);
            toast.success('User deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleRunCleanup = async () => {
        setRunningCleanup(true);
        try {
            const res = await adminAPI.runCleanup();
            toast.success(`Cleanup complete: ${res.data.data.deletedCount} files removed`);
            fetchData();
        } catch (error) {
            toast.error('Cleanup failed');
        } finally {
            setRunningCleanup(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) return <LoadingSpinner fullScreen text="Loading admin panel..." />;

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>Admin Panel</h1>
                    <p className="text-secondary">Monitor and manage the platform</p>
                </div>
                <button className="btn-secondary" onClick={handleRunCleanup} disabled={runningCleanup}>
                    <RefreshCw size={18} className={runningCleanup ? 'animate-spin' : ''} />
                    Run Cleanup
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon users"><Users size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-value">{stats?.users?.totalUsers || 0}</span>
                        <span className="stat-detail">{stats?.users?.activeUsers || 0} active this week</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon files"><FileText size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Total Files</span>
                        <span className="stat-value">{stats?.storage?.totalFiles || 0}</span>
                        <span className="stat-detail">{stats?.storage?.expiringSoon || 0} expiring soon</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon storage"><HardDrive size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Storage Used</span>
                        <span className="stat-value">{formatBytes(stats?.storage?.totalSize)}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon activity"><TrendingUp size={24} /></div>
                    <div className="stat-content">
                        <span className="stat-label">Recent Uploads</span>
                        <span className="stat-value">{stats?.activity?.recentUploads || 0}</span>
                        <span className="stat-detail">Last 24 hours</span>
                    </div>
                </div>
            </div>

            <div className="users-section">
                <div className="section-header">
                    <h2>User Management</h2>
                    <div className="filters">
                        <form onSubmit={handleSearch} className="search-box">
                            <Search size={18} />
                            <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </form>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Users</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                            <option value="banned">Banned</option>
                        </select>
                    </div>
                </div>

                <div className="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Files</th>
                                <th>Storage</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} className={user.isBanned ? 'banned' : ''}>
                                    <td><div className="user-cell"><span className="user-name">{user.username}</span>{user.isAdmin && <span className="admin-badge">Admin</span>}</div></td>
                                    <td>{user.email}</td>
                                    <td><span className={`status-badge ${user.isBanned ? 'banned' : user.isVerified ? 'verified' : 'unverified'}`}>{user.isBanned ? 'Banned' : user.isVerified ? 'Verified' : 'Unverified'}</span></td>
                                    <td>{user.fileCount || 0}</td>
                                    <td>{formatBytes(user.storageUsed)}</td>
                                    <td>
                                        <div className="action-btns">
                                            <button onClick={() => setSelectedUser(user)} title="View"><Eye size={16} /></button>
                                            {!user.isAdmin && (
                                                <>
                                                    <button onClick={() => handleBanUser(user)} title={user.isBanned ? 'Unban' : 'Ban'} className={user.isBanned ? 'unban' : 'ban'}><Ban size={16} /></button>
                                                    <button onClick={() => handleDeleteUser(user)} title="Delete" className="delete"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal user-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>User Details: {selectedUser.username}</h3>
                            <button onClick={() => setSelectedUser(null)}><X size={20} /></button>
                        </div>
                        <div className="user-details">
                            <div className="detail-row"><span>Email:</span><span>{selectedUser.email}</span></div>
                            <div className="detail-row"><span>Status:</span><span>{selectedUser.isBanned ? 'Banned' : selectedUser.isVerified ? 'Verified' : 'Unverified'}</span></div>
                            <div className="detail-row"><span>Files:</span><span>{selectedUser.fileCount || 0}</span></div>
                            <div className="detail-row"><span>Storage:</span><span>{formatBytes(selectedUser.storageUsed)} / {formatBytes(selectedUser.storageLimit)}</span></div>
                            <div className="detail-row"><span>Created:</span><span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
                            <div className="detail-row"><span>Last Login:</span><span>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
