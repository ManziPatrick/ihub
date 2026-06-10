import { Router } from 'express';
import multer from 'multer';
import { handleVoiceChat } from '../controllers/VoiceTutorController';
import { requireAuth } from '../middleware/auth';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const router = Router();
const upload = multer({ dest: uploadDir });

// Endpoint must require login as requested: "this will be free for every but to acess you have to have loged in"
router.post('/chat', requireAuth, upload.single('audio'), handleVoiceChat);

export default router;
