/**
 * Database Configuration
 * Establishes connection to MongoDB database
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Uses connection string from environment variables
 * Implements connection retry logic and event handlers
 */
const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      // Use new URL parser
      // Auto-index in development only
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    // Attempt connection
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // Exit process with failure on initial connection error
    process.exit(1);
  }
};

export default connectDB;
