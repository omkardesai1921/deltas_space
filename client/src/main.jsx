/**
 * Main Entry Point
 * Renders the React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e1e2e',
                            color: '#cdd6f4',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#1e1e2e',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#1e1e2e',
                            },
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
