import { Router } from 'express';
import { settingsController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { UpdatePreferencesSchema, SmtpConfigSchema, CompleteOnboardingSchema } from '@caderno/shared';

const router = Router();

// Public routes
router.get('/onboarding/status', settingsController.getOnboardingStatus);
router.get('/info', settingsController.getAppInfo);

// Protected routes
router.post(
  '/onboarding/complete',
  authenticate,
  validate(CompleteOnboardingSchema),
  settingsController.completeOnboarding
);

router.get('/preferences', authenticate, settingsController.getPreferences);

router.put(
  '/preferences',
  authenticate,
  validate(UpdatePreferencesSchema),
  settingsController.updatePreferences
);

router.get('/smtp', authenticate, settingsController.getSmtpSettings);

router.put(
  '/smtp',
  authenticate,
  validate(SmtpConfigSchema),
  settingsController.updateSmtpSettings
);

export default router;
