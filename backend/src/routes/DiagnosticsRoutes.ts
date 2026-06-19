import { Router } from 'express';
import { getDiagnostics, getDnsLookup } from '../controllers/DiagnosticsController';

const router = Router();

router.get('/diagnostics', getDiagnostics);
router.get('/dns', getDnsLookup);

export default router;
