import { Router } from 'express';
import { synthesize } from '../controllers/TTSController';

const router = Router();

router.post('/synthesize', synthesize);

export default router;
