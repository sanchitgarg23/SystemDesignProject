import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import csv from 'csv-parser';

interface UploadResult {
    url: string;
    publicId: string;
    originalName: string;
}

interface ParsedData {
    [key: string]: string;
}

/**
 * UploadService — File Upload and CSV Processing
 * 
 * Encapsulates file upload operations (Cloudinary), CSV parsing,
 * batch processing, and file validation.
 * 
 * Design Pattern: Facade
 * - Hides Cloudinary SDK, stream handling, and CSV parsing complexity
 *   behind simple static methods.
 * 
 * OOP Concept: Encapsulation
 * - Internal stream handling, error recovery, and batching logic
 *   are implementation details not exposed to callers.
 */
export class UploadService {
  /**
   * Upload a file buffer to Cloudinary as a raw file
   */
  public static async uploadToCloudinary(
    buffer: Buffer,
    originalName: string,
    folder: string = 'csv-uploads'
  ): Promise<UploadResult> {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder,
          public_id: `${Date.now()}-${originalName.replace(/\.[^/.]+$/, '')}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              originalName,
            });
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }
      );

      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Parse CSV buffer to JSON
   */
  public static parseCSV(buffer: Buffer): Promise<ParsedData[]> {
    return new Promise((resolve, reject) => {
      const results: ParsedData[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csv())
        .on('data', (data: ParsedData) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error: Error) => reject(error));
    });
  }

  /**
   * Process data in batches
   */
  public static async processBatches<T, R>(
    data: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<{ results: R[]; errors: Array<{ batch: number; error: string }> }> {
    const results: R[] = [];
    const errors: Array<{ batch: number; error: string }> = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batchNumber = Math.floor(i / batchSize) + 1;
      const batch = data.slice(i, i + batchSize);

      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
      } catch (error) {
        errors.push({
          batch: batchNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { results, errors };
  }

  /**
   * Validate CSV file type
   */
  public static isValidCSV(file: Express.Multer.File): boolean {
    const validMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const validExtensions = ['.csv'];

    const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    const mimeTypeValid = validMimeTypes.includes(file.mimetype);
    const extensionValid = validExtensions.includes(extension);

    return mimeTypeValid || extensionValid;
  }
}

// Backward-compatible named exports
export const uploadToCloudinary = UploadService.uploadToCloudinary;
export const parseCSV = UploadService.parseCSV;
export const processBatches = UploadService.processBatches;
export const isValidCSV = UploadService.isValidCSV;
