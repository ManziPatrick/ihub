import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadImage, uploadFile } from '../controllers/UploadController';
import { requireAuth } from '../middleware/auth';
import { extractTextFromFile, extractTextFromGoogleDoc, parseGoogleDocUrl, parseCourseText } from '../services/course-parser.service';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

// Protect the upload route
router.post('/image', requireAuth, upload.single('image'), uploadImage);
router.post('/file', requireAuth, upload.single('file'), uploadFile);

/**
 * POST /api/upload/parse-course-document
 * Upload a course document (PDF, DOCX, TXT) and get back parsed course structure
 */
router.post('/parse-course-document', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const text = await extractTextFromFile(req.file.buffer, req.file.mimetype);
        const parsed = parseCourseText(text);

        return res.json({
            success: true,
            data: parsed,
        });
    } catch (error: any) {
        console.error('Course document parsing error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to parse document',
        });
    }
});

/**
 * POST /api/upload/parse-google-doc
 * Import a Google Doc by URL or document ID and parse it into course structure
 */
router.post('/parse-google-doc', requireAuth, async (req: Request, res: Response) => {
    try {
        const { url: docUrl } = req.body;

        if (!docUrl) {
            return res.status(400).json({ error: 'Google Doc URL or document ID is required' });
        }

        const documentId = parseGoogleDocUrl(docUrl);
        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Google Doc URL. Please provide a valid Google Docs URL (e.g., https://docs.google.com/document/d/...) or a document ID.',
            });
        }

        const text = await extractTextFromGoogleDoc(documentId);
        const parsed = parseCourseText(text);

        return res.json({
            success: true,
            data: parsed,
        });
    } catch (error: any) {
        console.error('Google Doc parsing error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to parse Google Doc',
        });
    }
});

export default router;
