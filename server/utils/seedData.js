/**
 * Seed Data Utility
 * Creates initial admin user and test data for development
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Folder, Clipboard } from '../models/index.js';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

/**
 * Create admin user
 */
const createAdmin = async () => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campus.edu';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
        console.log('ℹ️ Admin user already exists');
        return existingAdmin;
    }

    // Create admin
    const admin = await User.create({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        isVerified: true,
        isAdmin: true,
        storageLimit: 1073741824 // 1GB for admin
    });

    console.log('✅ Admin user created:', admin.email);
    return admin;
};

/**
 * Create test users
 */
const createTestUsers = async () => {
    const testUsers = [
        {
            username: 'testuser1',
            email: 'test1@campus.edu',
            password: 'Test@123',
            isVerified: true,
            profile: {
                fullName: 'Test User One',
                department: 'Computer Science'
            }
        },
        {
            username: 'testuser2',
            email: 'test2@campus.edu',
            password: 'Test@123',
            isVerified: true,
            profile: {
                fullName: 'Test User Two',
                department: 'Electronics'
            }
        },
        {
            username: 'unverified',
            email: 'unverified@campus.edu',
            password: 'Test@123',
            isVerified: false
        }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
        const existing = await User.findOne({ email: userData.email });
        if (existing) {
            console.log(`ℹ️ User ${userData.email} already exists`);
            createdUsers.push(existing);
            continue;
        }

        const user = await User.create(userData);
        console.log(`✅ Test user created: ${user.email}`);
        createdUsers.push(user);
    }

    return createdUsers;
};

/**
 * Create sample folders for a user
 */
const createSampleFolders = async (userId) => {
    const folderNames = [
        { name: 'Documents', color: '#3b82f6' },
        { name: 'Images', color: '#10b981' },
        { name: 'Videos', color: '#f59e0b' },
        { name: 'Projects', color: '#8b5cf6' }
    ];

    const folders = [];

    for (const folderData of folderNames) {
        const existing = await Folder.findOne({
            userId,
            name: folderData.name,
            parentId: null
        });

        if (existing) {
            folders.push(existing);
            continue;
        }

        const folder = await Folder.create({
            userId,
            name: folderData.name,
            color: folderData.color,
            parentId: null
        });

        folders.push(folder);
    }

    // Create a subfolder
    const projectsFolder = folders.find(f => f.name === 'Projects');
    if (projectsFolder) {
        const existingSubfolder = await Folder.findOne({
            userId,
            name: 'Campus Share',
            parentId: projectsFolder._id
        });

        if (!existingSubfolder) {
            await Folder.create({
                userId,
                name: 'Campus Share',
                color: '#ec4899',
                parentId: projectsFolder._id
            });
        }
    }

    console.log(`✅ Sample folders created for user ${userId}`);
    return folders;
};

/**
 * Create sample clipboard items for a user
 */
const createSampleClipboards = async (userId) => {
    const clips = [
        {
            title: 'Welcome Note',
            content: 'Welcome to Campus Share! This is your personal clipboard where you can store text snippets.',
            contentType: 'text',
            isPinned: true
        },
        {
            title: 'Sample Code',
            content: `function greet(name) {
  return \`Hello, \${name}! Welcome to Campus Share.\`;
}

console.log(greet('Student'));`,
            contentType: 'code',
            language: 'javascript'
        },
        {
            title: 'Important Link',
            content: 'https://github.com',
            contentType: 'link'
        },
        {
            title: 'Quick Note',
            content: 'Remember to backup your files before they expire (7 days)!',
            contentType: 'text'
        }
    ];

    for (const clipData of clips) {
        const existing = await Clipboard.findOne({
            userId,
            title: clipData.title
        });

        if (existing) continue;

        await Clipboard.create({
            userId,
            ...clipData
        });
    }

    console.log(`✅ Sample clipboard items created for user ${userId}`);
};

/**
 * Main seed function
 */
const seedData = async () => {
    console.log('🌱 Starting database seeding...\n');

    try {
        await connectDB();

        // Create admin
        const admin = await createAdmin();

        // Create test users
        const testUsers = await createTestUsers();

        // Create sample data for first test user
        if (testUsers.length > 0 && testUsers[0].isVerified) {
            await createSampleFolders(testUsers[0]._id);
            await createSampleClipboards(testUsers[0]._id);
        }

        console.log('\n✅ Database seeding completed!\n');
        console.log('📋 Test Accounts:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Admin:    ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
        testUsers.forEach(user => {
            console.log(`User:     ${user.email} / Test@123 ${user.isVerified ? '(verified)' : '(unverified)'}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run seeding
seedData();
