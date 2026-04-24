import { Router } from 'express';
import { getSignerSettings, updateSignerSettings, updateRecipientName } from '../controllers/CertificateController';
import { authMiddleware, requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/signer-settings', authMiddleware, requireAuth, getSignerSettings);
router.post('/signer-settings', authMiddleware, requireAdmin, updateSignerSettings);
router.post('/update-name', authMiddleware, requireAuth, updateRecipientName);

export default router;
