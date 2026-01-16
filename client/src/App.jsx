/**
 * Main App Component
 * Handles routing and layout
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Clipboard from './pages/Clipboard';
import Admin from './pages/Admin';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, loading, isAdmin } = useAuth();

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// Public Route wrapper (redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/"
                element={
                    <PublicRoute>
                        <Landing />
                    </PublicRoute>
                }
            />
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />
            <Route
                path="/signup"
                element={
                    <PublicRoute>
                        <Signup />
                    </PublicRoute>
                }
            />
            <Route
                path="/verify-otp"
                element={
                    <PublicRoute>
                        <VerifyOTP />
                    </PublicRoute>
                }
            />

            {/* Protected routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/files"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Files />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/files/:folderId"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Files />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/clipboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Clipboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute adminOnly>
                        <Layout>
                            <Admin />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
