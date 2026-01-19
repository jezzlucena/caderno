import { Router } from 'express';
import { exportController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/json', exportController.exportJson);
router.get('/pdf', exportController.exportPdf);
router.post('/json', exportController.importJson);

export default router;
