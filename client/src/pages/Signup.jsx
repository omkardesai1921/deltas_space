/**
 * Signup Page Component
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, ArrowLeft, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // Password validation
    const passwordChecks = {
        length: formData.password.length >= 8,
        lowercase: /[a-z]/.test(formData.password),
        uppercase: /[A-Z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[@$!%*?&]/.test(formData.password)
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.username || !formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.username.length < 3) {
            toast.error('Username must be at least 3 characters');
            return;
        }

        if (!isPasswordValid) {
            toast.error('Please meet all password requirements');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        const result = await signup(formData.username, formData.email, formData.password);

        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            toast.error(result.error);
        }
    };

    const PasswordCheck = ({ passed, text }) => (
        <div className={`password-check ${passed ? 'passed' : ''}`}>
            {passed ? <Check size={14} /> : <X size={14} />}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="auth-page">
            <div className="auth-container">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} />
                    Back to Home
                </Link>

                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">📁</div>
                        <h1>Create Account</h1>
                        <p>Start sharing files in seconds</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                autoComplete="username"
                                disabled={loading}
                            />
                            <span className="form-hint">Letters, numbers, and underscores only</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                                autoComplete="email"
                                disabled={loading}
                            />
                            <span className="form-hint">Use a valid email address</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-with-icon">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a strong password"
                                    autoComplete="new-password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="input-icon-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {formData.password && (
                                <div className="password-requirements">
                                    <PasswordCheck passed={passwordChecks.length} text="At least 8 characters" />
                                    <PasswordCheck passed={passwordChecks.lowercase} text="One lowercase letter" />
                                    <PasswordCheck passed={passwordChecks.uppercase} text="One uppercase letter" />
                                    <PasswordCheck passed={passwordChecks.number} text="One number" />
                                    <PasswordCheck passed={passwordChecks.special} text="One special character (@$!%*?&)" />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary auth-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
