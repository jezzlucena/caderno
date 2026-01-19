import { Router } from 'express';
import authRoutes from './auth.js';
import entriesRoutes from './entries.js';
import exportRoutes from './export.js';
import safetyTimerRoutes from './safetyTimer.js';
import settingsRoutes from './settings.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/entries', entriesRoutes);
router.use('/export', exportRoutes);
router.use('/import', exportRoutes); // Import uses same controller
router.use('/safety-timer', safetyTimerRoutes);
router.use('/settings', settingsRoutes);
router.use('/onboarding', settingsRoutes); // Onboarding uses settings routes

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
