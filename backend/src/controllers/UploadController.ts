import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import UploadLog from '../models/UploadLog';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: log an upload action
async function logUpload(req: Request, result: any, type: 'image' | 'file' | 'document') {
  try {
    if (!req.user) return;
    const user = (req as any).user;
    await UploadLog.create({
      adminId: user.id,
      adminUsername: user.username || 'unknown',
      fileName: req.file?.originalname || 'unknown',
      fileSize: req.file?.size || 0,
      mimeType: req.file?.mimetype || 'unknown',
      url: result.secure_url,
      publicId: result.public_id,
      type,
      action: 'upload',
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Failed to log upload:', err);
  }
}

export const uploadImage = async (req: Request, res: Response) => {
    try {
        console.log('--- Upload Image Signal Received ---');
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log('File details:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Since we are using memory storage with multer, we need to upload the buffer
        const result = await new Promise((resolve, reject) => {
            console.log('Streaming to Cloudinary...');
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'academy_hub',
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary stream error:', error);
                        reject(error);
                    } else {
                        console.log('Cloudinary upload success');
                        resolve(result);
                    }
                }
            );
            uploadStream.end(req.file?.buffer);
        });

        // Log the upload
        await logUpload(req, result, 'image');

        res.json({
            url: (result as any).secure_url,
            publicId: (result as any).public_id,
        });
    } catch (error: any) {
        console.error('Final Catch - Cloudinary Upload Error:', error);
        res.status(500).json({ message: `Cloudinary error: ${error.message || 'Unknown error'}` });
    }
};

export const uploadFile = async (req: Request, res: Response) => {
    try {
        console.log('--- Upload File Signal Received ---');
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'academy_hub_projects',
                    resource_type: 'auto' // Important for non-image files
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file?.buffer);
        });

        // Log the upload
        await logUpload(req, result, 'file');

        res.json({
            url: (result as any).secure_url,
            originalname: req.file.originalname,
            size: req.file.size
        });
    } catch (error: any) {
        console.error('File Upload Error:', error);
        res.status(500).json({ message: `Upload error: ${error.message || 'Unknown error'}` });
    }
};
