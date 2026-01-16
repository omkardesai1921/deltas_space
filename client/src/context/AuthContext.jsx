/**
 * Auth Context
 * Global authentication state management
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    // Verify token is still valid
                    const response = await authAPI.getMe();
                    setUser(response.data.data.user);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Signup - now logs user in directly (no OTP)
    const signup = async (username, email, password) => {
        try {
            const response = await authAPI.signup({ username, email, password });
            const { user: userData, token } = response.data.data;

            // Save to state and storage
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            toast.success('Account created successfully!');
            return { success: true, data: response.data };
        } catch (error) {
            const message = error.response?.data?.message || 'Signup failed';
            return { success: false, error: message };
        }
    };

    // Verify OTP
    const verifyOTP = async (email, otp) => {
        try {
            const response = await authAPI.verifyOTP({ email, otp });
            const { user: userData, token } = response.data.data;

            // Save to state and storage
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            toast.success('Email verified successfully!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'OTP verification failed';
            return { success: false, error: message };
        }
    };

    // Resend OTP
    const resendOTP = async (email) => {
        try {
            await authAPI.resendOTP({ email });
            toast.success('OTP sent to your email');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to resend OTP';
            return { success: false, error: message };
        }
    };

    // Login
    const login = async (username, password) => {
        try {
            const response = await authAPI.login({ username, password });
            const { user: userData, token } = response.data.data;

            // Save to state and storage
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            toast.success('Welcome back!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            const needsVerification = error.response?.data?.message?.includes('verify');
            const email = error.response?.data?.email;
            return { success: false, error: message, needsVerification, email };
        }
    };

    // Logout
    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            // Ignore logout API errors
        }

        // Clear state and storage
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        toast.success('Logged out successfully');
    }, []);

    // Update user data
    const updateUser = useCallback((updates) => {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const response = await authAPI.getMe();
            const userData = response.data.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            return null;
        }
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated,
        isAdmin: user?.isAdmin || false,
        signup,
        verifyOTP,
        resendOTP,
        login,
        logout,
        updateUser,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
