import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database Singleton Class
 * 
 * Implements the Singleton Pattern to ensure only one database connection
 * pool exists across the entire application. This prevents resource waste
 * from duplicate connections and ensures all modules share the same pool.
 * 
 * Design Pattern: Singleton
 * - Private static instance
 * - Private constructor
 * - Public static getInstance() accessor
 */
export class Database {
  private static instance: Database;
  private readonly uri: string;
  private isConnected: boolean = false;

  /**
   * Private constructor prevents direct instantiation.
   * Use Database.getInstance() instead.
   */
  private constructor() {
    this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gov-bus-tracking';
  }

  /**
   * Returns the single Database instance (creates it on first call).
   * Thread-safe in single-threaded Node.js context.
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Establishes connection to MongoDB using Mongoose.
   * Idempotent — calling multiple times has no effect after first connection.
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected.');
      return;
    }

    try {
      await mongoose.connect(this.uri);
      this.isConnected = true;
      console.log('MongoDB connected successfully!');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  /**
   * Returns the current connection status.
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Returns the underlying Mongoose instance (for direct access if needed).
   */
  public getMongoose(): typeof mongoose {
    return mongoose;
  }
}

// Legacy export for backward compatibility
export async function connectDB() {
  return Database.getInstance().connect();
}

export default mongoose;
