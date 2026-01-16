/**
 * Campus Share - Main Server Entry Point
 * 
 * A secure file transfer and storage platform for college students
 * Built with Express.js, MongoDB, and love ❤️
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Local imports
import connectDB from './config/db.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { initEmailService } from './services/emailService.js';
import { initScheduledTasks } from './services/schedulerService.js';
import { FILE_CONFIG } from './config/constants.js';

// ES Module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow image loading
    contentSecurityPolicy: false // Disable for development
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
app.use(generalLimiter);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// ============================================
// STATIC FILES
// ============================================

// Serve uploads directory (for file previews)
app.use('/uploads', express.static(path.join(__dirname, FILE_CONFIG.UPLOAD_DIR)));

// ============================================
// REQUEST LOGGING (Development)
// ============================================

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// API ROUTES
// ============================================

// Mount all routes under /api
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Campus Share API Server',
        version: '1.0.0',
        documentation: '/api/health',
        endpoints: {
            auth: '/api/auth',
            files: '/api/files',
            folders: '/api/folders',
            clipboard: '/api/clipboard',
            admin: '/api/admin'
        }
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Initialize email service
        initEmailService();

        // Initialize scheduled tasks (auto cleanup)
        initScheduledTasks();

        // Start server
        app.listen(PORT, () => {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🚀 CAMPUS SHARE SERVER');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📡 Server:      http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📁 Uploads:     ${path.join(__dirname, FILE_CONFIG.UPLOAD_DIR)}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n📋 API Endpoints:');
            console.log('   POST   /api/auth/signup      - Register');
            console.log('   POST   /api/auth/verify-otp  - Verify OTP');
            console.log('   POST   /api/auth/login       - Login');
            console.log('   GET    /api/auth/me          - Get profile');
            console.log('   GET    /api/files            - List files');
            console.log('   POST   /api/files/upload     - Upload files');
            console.log('   GET    /api/folders          - List folders');
            console.log('   GET    /api/clipboard        - List clips');
            console.log('   GET    /api/admin/stats      - Admin stats');
            console.log('\n✅ Server is ready to accept connections!\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
startServer();

export default app;
