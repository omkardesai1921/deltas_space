/**
 * OTP Verification Page Component
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOTP, resendOTP } = useAuth();

    const email = location.state?.email;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);

    // Redirect if no email
    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);

        if (/^\d+$/.test(pastedData)) {
            const newOtp = [...otp];
            pastedData.split('').forEach((char, index) => {
                if (index < 6) newOtp[index] = char;
            });
            setOtp(newOtp);

            // Focus last filled input or next empty
            const lastIndex = Math.min(pastedData.length, 5);
            inputRefs.current[lastIndex]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);

        const result = await verifyOTP(email, otpCode);

        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            toast.error(result.error);
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setResending(true);

        const result = await resendOTP(email);

        setResending(false);

        if (result.success) {
            setCountdown(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } else {
            toast.error(result.error);
        }
    };

    if (!email) return null;

    return (
        <div className="auth-page">
            <div className="auth-container">
                <Link to="/signup" className="back-link">
                    <ArrowLeft size={18} />
                    Back to Signup
                </Link>

                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">✉️</div>
                        <h1>Verify Email</h1>
                        <p>
                            We sent a 6-digit code to<br />
                            <strong>{email}</strong>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="otp-inputs">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    disabled={loading}
                                    className="otp-input"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="btn-primary auth-btn"
                            disabled={loading || otp.join('').length !== 6}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </button>
                    </form>

                    <div className="resend-section">
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="resend-btn"
                            >
                                {resending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        Resend Code
                                    </>
                                )}
                            </button>
                        ) : (
                            <p className="countdown">
                                Resend code in <strong>{countdown}s</strong>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
