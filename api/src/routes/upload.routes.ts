import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateAdmin } from '../middleware/auth';
import {
    uploadToCloudinary,
    parseCSV,
    isValidCSV,
} from '../services/upload.service';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (isValidCSV(file)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
});

/**
 * POST /upload - Upload CSV files to Cloudinary and parse them
 * Accepts multipart/form-data with one or more CSV files
 */
router.post(
    '/upload',
    authenticateAdmin,
    upload.array('files', 10), // Max 10 files
    async (req: Request, res: Response) => {
        try {
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({
                    code: 'NO_FILES',
                    message: 'No files were uploaded',
                });
            }

            const results = [];

            for (const file of files) {
                // Upload to Cloudinary
                const cloudinaryResult = await uploadToCloudinary(
                    file.buffer,
                    file.originalname
                );

                // Parse CSV to JSON
                const parsedData = await parseCSV(file.buffer);

                results.push({
                    filename: file.originalname,
                    cloudinaryUrl: cloudinaryResult.url,
                    publicId: cloudinaryResult.publicId,
                    rowCount: parsedData.length,
                    data: parsedData,
                });
            }

            res.json({
                message: 'Files uploaded and parsed successfully',
                count: results.length,
                files: results,
            });
        } catch (error) {
            console.error('Upload error:', error);

            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        code: 'FILE_TOO_LARGE',
                        message: 'File size exceeds 10MB limit',
                    });
                }
            }

            res.status(500).json({
                code: 'UPLOAD_ERROR',
                message: error instanceof Error ? error.message : 'Failed to upload files',
            });
        }
    }
);

export default router;
