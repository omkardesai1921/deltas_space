/**
 * Clipboard Page Component
 * Text clipboard management with one-click copy
 */

import { useState, useEffect } from 'react';
import { clipboardAPI } from '../services/api';
import {
    Plus,
    Copy,
    Trash2,
    Pin,
    Search,
    X,
    Code,
    Link,
    FileText,
    Clock,
    Check,
    Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './Clipboard.css';

const Clipboard = () => {
    const [clips, setClips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewClipModal, setShowNewClipModal] = useState(false);
    const [editingClip, setEditingClip] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        contentType: 'text'
    });

    useEffect(() => {
        fetchClips();
    }, []);

    const fetchClips = async () => {
        try {
            const response = await clipboardAPI.getClips({ search: searchQuery });
            setClips(response.data.data.clips);
        } catch (error) {
            console.error('Error fetching clips:', error);
            toast.error('Failed to load clipboard');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClips();
    };

    const handleCreateClip = async (e) => {
        e.preventDefault();

        if (!formData.content.trim()) {
            toast.error('Please enter some content');
            return;
        }

        try {
            if (editingClip) {
                await clipboardAPI.updateClip(editingClip._id, formData);
                toast.success('Clip updated');
            } else {
                await clipboardAPI.createClip(formData);
                toast.success('Clip created');
            }

            setShowNewClipModal(false);
            setEditingClip(null);
            setFormData({ title: '', content: '', contentType: 'text' });
            await fetchClips();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to save clip';
            toast.error(message);
        }
    };

    const handleCopy = async (clip) => {
        try {
            await navigator.clipboard.writeText(clip.content);
            setCopiedId(clip._id);
            setTimeout(() => setCopiedId(null), 2000);

            // Record copy action
            await clipboardAPI.recordCopy(clip._id);

            // Update local count
            setClips(prev => prev.map(c =>
                c._id === clip._id ? { ...c, copyCount: c.copyCount + 1 } : c
            ));
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const handleTogglePin = async (clip) => {
        try {
            await clipboardAPI.togglePin(clip._id);
            setClips(prev => prev.map(c =>
                c._id === clip._id ? { ...c, isPinned: !c.isPinned } : c
            ));
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleDelete = async (clip) => {
        if (!window.confirm('Delete this clip?')) return;

        try {
            await clipboardAPI.deleteClip(clip._id);
            toast.success('Clip deleted');
            setClips(prev => prev.filter(c => c._id !== clip._id));
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleEdit = (clip) => {
        setEditingClip(clip);
        setFormData({
            title: clip.title,
            content: clip.content,
            contentType: clip.contentType
        });
        setShowNewClipModal(true);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'code': return <Code size={16} />;
            case 'link': return <Link size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        return d.toLocaleDateString();
    };

    if (loading) {
        return <LoadingSpinner fullScreen text="Loading clipboard..." />;
    }

    // Sort clips: pinned first, then by creation date
    const sortedClips = [...clips].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="clipboard-page">
            {/* Header */}
            <div className="clipboard-header">
                <div>
                    <h1>Clipboard</h1>
                    <p className="text-secondary">Save and share text snippets with one-click copy</p>
                </div>
                <button className="btn-primary" onClick={() => setShowNewClipModal(true)}>
                    <Plus size={18} />
                    New Clip
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="clipboard-search">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Search clips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(''); fetchClips(); }}>
                        <X size={16} />
                    </button>
                )}
            </form>

            {/* Clips Grid */}
            {sortedClips.length > 0 ? (
                <div className="clips-grid">
                    {sortedClips.map(clip => (
                        <div key={clip._id} className={`clip-card ${clip.isPinned ? 'pinned' : ''}`}>
                            <div className="clip-header">
                                <div className="clip-type">
                                    {getTypeIcon(clip.contentType)}
                                    <span>{clip.contentType}</span>
                                </div>
                                <div className="clip-actions">
                                    <button
                                        className={`pin-btn ${clip.isPinned ? 'active' : ''}`}
                                        onClick={() => handleTogglePin(clip)}
                                        title={clip.isPinned ? 'Unpin' : 'Pin'}
                                    >
                                        <Pin size={14} fill={clip.isPinned ? 'currentColor' : 'none'} />
                                    </button>
                                    <button onClick={() => handleEdit(clip)} title="Edit">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(clip)} title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="clip-title">{clip.title}</h3>

                            <div className={`clip-content ${clip.contentType === 'code' ? 'code' : ''}`}>
                                {clip.content}
                            </div>

                            <div className="clip-footer">
                                <div className="clip-meta">
                                    <span><Clock size={12} /> {formatDate(clip.createdAt)}</span>
                                    <span>Copied {clip.copyCount}x</span>
                                </div>
                                <button
                                    className={`copy-btn ${copiedId === clip._id ? 'copied' : ''}`}
                                    onClick={() => handleCopy(clip)}
                                >
                                    {copiedId === clip._id ? (
                                        <>
                                            <Check size={16} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <FileText size={64} />
                    <h3>No clips yet</h3>
                    <p>Create your first clipboard item to save text snippets</p>
                    <button className="btn-primary" onClick={() => setShowNewClipModal(true)}>
                        <Plus size={18} />
                        Create Clip
                    </button>
                </div>
            )}

            {/* New/Edit Clip Modal */}
            {showNewClipModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowNewClipModal(false);
                    setEditingClip(null);
                    setFormData({ title: '', content: '', contentType: 'text' });
                }}>
                    <div className="modal clip-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingClip ? 'Edit Clip' : 'New Clip'}</h3>
                            <button onClick={() => {
                                setShowNewClipModal(false);
                                setEditingClip(null);
                                setFormData({ title: '', content: '', contentType: 'text' });
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateClip}>
                            <div className="form-group">
                                <label>Title (optional)</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Give your clip a name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Content Type</label>
                                <div className="type-selector">
                                    {['text', 'code', 'link'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            className={formData.contentType === type ? 'active' : ''}
                                            onClick={() => setFormData(prev => ({ ...prev, contentType: type }))}
                                        >
                                            {getTypeIcon(type)}
                                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Paste or type your content here..."
                                    rows={8}
                                    autoFocus
                                />
                                <span className="character-count">
                                    {formData.content.length} / 10,000 characters
                                </span>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => {
                                    setShowNewClipModal(false);
                                    setEditingClip(null);
                                    setFormData({ title: '', content: '', contentType: 'text' });
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingClip ? 'Update Clip' : 'Create Clip'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clipboard;
