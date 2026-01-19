import { Router } from 'express';
import { safetyTimerController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { UpdateSafetyTimerSchema, CreateRecipientSchema, CreateReminderSchema, SmtpConfigSchema, TestEmailSchema } from '@caderno/shared';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', safetyTimerController.getStatus);

router.put(
  '/',
  validate(UpdateSafetyTimerSchema),
  safetyTimerController.update
);

router.post('/check-in', safetyTimerController.checkInHandler);

router.post(
  '/recipients',
  validate(CreateRecipientSchema),
  safetyTimerController.addRecipientHandler
);

router.put(
  '/recipients/:id',
  safetyTimerController.updateRecipientHandler
);

router.delete(
  '/recipients/:id',
  safetyTimerController.deleteRecipientHandler
);

router.post(
  '/reminders',
  validate(CreateReminderSchema),
  safetyTimerController.addReminderHandler
);

router.delete(
  '/reminders/:id',
  safetyTimerController.deleteReminderHandler
);

router.post(
  '/verify-smtp',
  validate(SmtpConfigSchema),
  safetyTimerController.verifySmtp
);

router.post(
  '/test',
  validate(SmtpConfigSchema.extend({ recipientEmail: z.string().email() })),
  safetyTimerController.testEmail
);

export default router;
