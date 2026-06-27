import { Router } from 'express';
import { getDiagnostics, getDnsLookup, getAIProviders } from '../controllers/DiagnosticsController';

const router = Router();

router.get('/diagnostics', getDiagnostics);
router.get('/dns', getDnsLookup);
router.get('/ai-providers', getAIProviders);

export default router;
