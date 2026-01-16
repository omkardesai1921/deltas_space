/**
 * Routes Index
 * Central export for all routes
 */

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import fileRoutes from './fileRoutes.js';
import folderRoutes from './folderRoutes.js';
import clipboardRoutes from './clipboardRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Campus Share API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/folders', folderRoutes);
router.use('/clipboard', clipboardRoutes);
router.use('/admin', adminRoutes);

export default router;
