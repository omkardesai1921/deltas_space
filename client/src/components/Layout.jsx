/**
 * Layout Component
 * Main application layout with sidebar and header
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FolderOpen,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    User,
    HardDrive
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/files', icon: FolderOpen, label: 'My Files' },
        { path: '/clipboard', icon: ClipboardList, label: 'Clipboard' },
    ];

    if (isAdmin) {
        navItems.push({ path: '/admin', icon: Shield, label: 'Admin Panel' });
    }

    const isActive = (path) => {
        if (path === '/files') {
            return location.pathname.startsWith('/files');
        }
        return location.pathname === path;
    };

    // Calculate storage percentage
    const storagePercentage = user ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0;
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(1)} GB`;
    };

    return (
        <div className="layout">
            {/* Mobile menu button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/dashboard" className="logo" onClick={() => setSidebarOpen(false)}>
                        <div className="logo-icon">📁</div>
                        <span className="logo-text">Delta's Space</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`nav-item ${isActive(path) ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Storage indicator */}
                <div className="storage-section">
                    <div className="storage-header">
                        <HardDrive size={18} />
                        <span>Storage</span>
                    </div>
                    <div className="storage-bar">
                        <div
                            className="storage-bar-fill"
                            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                        />
                    </div>
                    <div className="storage-info">
                        <span>{formatBytes(user?.storageUsed || 0)}</span>
                        <span>of {formatBytes(user?.storageLimit || 0)}</span>
                    </div>
                </div>

                {/* User section */}
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            <User size={18} />
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.username}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="logout-section">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
