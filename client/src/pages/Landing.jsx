/**
 * Landing Page Component
 * Public homepage with hero and features
 */

import { Link } from 'react-router-dom';
import {
    Upload,
    Download,
    FolderOpen,
    ClipboardList,
    Shield,
    Clock,
    Smartphone,
    Users
} from 'lucide-react';
import './Landing.css';

const Landing = () => {
    const features = [
        {
            icon: Upload,
            title: 'Easy Upload',
            description: 'Drag and drop files, photos, videos. Upload multiple files at once.'
        },
        {
            icon: Download,
            title: 'Quick Download',
            description: 'Download your files from any device. No login hassle.'
        },
        {
            icon: FolderOpen,
            title: 'Folder Management',
            description: 'Organize your files in custom folders. Keep everything tidy.'
        },
        {
            icon: ClipboardList,
            title: 'Text Clipboard',
            description: 'Save text snippets, code, links. One-click copy feature.'
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'Your files are safe. JWT authentication & encrypted storage.'
        },
        {
            icon: Clock,
            title: 'Auto Cleanup',
            description: 'Files auto-delete after 7 days. No storage worries.'
        },
        {
            icon: Smartphone,
            title: 'Mobile Friendly',
            description: 'Works perfectly on phones and tablets. Access anywhere.'
        },
        {
            icon: Users,
            title: 'Built for Students',
            description: 'Designed for college students. Simple and fast.'
        }
    ];

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="container">
                    <Link to="/" className="landing-logo">
                        <span className="logo-emoji">📁</span>
                        <span className="logo-name">Delta's Space</span>
                    </Link>
                    <div className="header-actions">
                        <Link to="/login" className="btn-ghost">Login</Link>
                        <Link to="/signup" className="btn-primary">Get Started</Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content">
                        <span className="hero-badge">🎓 Made for College Students</span>
                        <h1 className="hero-title">
                            Transfer Files Between<br />
                            <span className="gradient-text">Devices Instantly</span>
                        </h1>
                        <p className="hero-description">
                            No WhatsApp, no email, no USB drive. Just upload from your phone
                            and download on your college PC. It's that simple.
                        </p>
                        <div className="hero-actions">
                            <Link to="/signup" className="btn-primary btn-lg">
                                Start Sharing Free
                            </Link>
                            <Link to="/login" className="btn-secondary btn-lg">
                                Login
                            </Link>
                        </div>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-value">500MB</span>
                                <span className="stat-label">Free Storage</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">50MB</span>
                                <span className="stat-label">Per File</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">7 Days</span>
                                <span className="stat-label">Auto Cleanup</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-card">
                            <div className="mock-file-list">
                                <div className="mock-file">
                                    <span className="file-icon">📄</span>
                                    <span className="file-name">Project_Report.pdf</span>
                                    <span className="file-size">2.4 MB</span>
                                </div>
                                <div className="mock-file">
                                    <span className="file-icon">🖼️</span>
                                    <span className="file-name">Screenshot.png</span>
                                    <span className="file-size">845 KB</span>
                                </div>
                                <div className="mock-file">
                                    <span className="file-icon">📑</span>
                                    <span className="file-name">Notes.docx</span>
                                    <span className="file-size">156 KB</span>
                                </div>
                                <div className="mock-upload">
                                    <Upload size={24} />
                                    <span>Drop files here</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Everything You Need</h2>
                        <p>Simple, secure, and designed for your workflow.</p>
                    </div>
                    <div className="features-grid">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="feature-card">
                                <div className="feature-icon">
                                    <Icon size={24} />
                                </div>
                                <h3>{title}</h3>
                                <p>{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2>How It Works</h2>
                        <p>Three simple steps to start sharing.</p>
                    </div>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Create Account</h3>
                            <p>Sign up with your email. Verify with OTP.</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Upload Files</h3>
                            <p>Drag and drop or select files from your device.</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Download Anywhere</h3>
                            <p>Login from any device and download your files.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Start Sharing?</h2>
                        <p>Join other students using Delta's Space for hassle-free file transfers.</p>
                        <Link to="/signup" className="btn-primary btn-lg">
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <span className="logo-emoji">📁</span>
                            <span className="logo-name">Delta's Space</span>
                        </div>
                        <p className="footer-text">
                            Made with ❤️ for college students
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
