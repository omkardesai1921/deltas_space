/**
 * API Service
 * Axios instance and API helper functions
 */

import axios from 'axios';

// API Base URL - uses env variable in production, empty for dev (uses Vite proxy)
const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (unauthorized)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// AUTH API
// ============================================

export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
    resendOTP: (data) => api.post('/auth/resend-otp', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data)
};

// ============================================
// FILES API
// ============================================

export const filesAPI = {
    getFiles: (params) => api.get('/files', { params }),
    getFile: (id) => api.get(`/files/${id}`),
    getStats: () => api.get('/files/stats'),

    uploadFiles: (formData, onProgress) => api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(progress);
        }
    }),

    downloadFile: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
    previewFile: (id) => `${API_URL}/api/files/${id}/preview`,

    updateFile: (id, data) => api.put(`/files/${id}`, data),
    toggleStar: (id) => api.put(`/files/${id}/star`),
    deleteFile: (id) => api.delete(`/files/${id}`),
    deleteMultiple: (fileIds) => api.delete('/files', { data: { fileIds } })
};

// ============================================
// FOLDERS API
// ============================================

export const foldersAPI = {
    getFolders: (params) => api.get('/folders', { params }),
    getFolder: (id) => api.get(`/folders/${id}`),
    getFolderTree: () => api.get('/folders', { params: { tree: true } }),
    createFolder: (data) => api.post('/folders', data),
    updateFolder: (id, data) => api.put(`/folders/${id}`, data),
    deleteFolder: (id, keepFiles = false) => api.delete(`/folders/${id}`, {
        params: { keepFiles }
    })
};

// ============================================
// CLIPBOARD API
// ============================================

export const clipboardAPI = {
    getClips: (params) => api.get('/clipboard', { params }),
    getClip: (id) => api.get(`/clipboard/${id}`),
    createClip: (data) => api.post('/clipboard', data),
    updateClip: (id, data) => api.put(`/clipboard/${id}`, data),
    togglePin: (id) => api.put(`/clipboard/${id}/pin`),
    recordCopy: (id) => api.post(`/clipboard/${id}/copy`),
    deleteClip: (id) => api.delete(`/clipboard/${id}`),
    deleteMultiple: (clipIds) => api.delete('/clipboard', { data: { clipIds } })
};

// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: (params) => api.get('/admin/users', { params }),
    getUserDetails: (id) => api.get(`/admin/users/${id}`),
    toggleBan: (id, reason) => api.put(`/admin/users/${id}/ban`, { reason }),
    updateStorageLimit: (id, storageLimit) => api.put(`/admin/users/${id}/storage`, { storageLimit }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getAllFiles: (params) => api.get('/admin/files', { params }),
    runCleanup: () => api.post('/admin/cleanup')
};

export default api;
