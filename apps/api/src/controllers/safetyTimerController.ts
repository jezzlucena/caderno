import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  getSafetyTimerStatus,
  updateSafetyTimer,
  checkIn,
  addRecipient,
  updateRecipient,
  deleteRecipient,
  addReminder,
  deleteReminder,
} from '../services/safetyTimerService.js';
import { verifySmtpConfig, sendTestEmail, SmtpConfig } from '../services/emailService.js';

export async function getStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await getSafetyTimerStatus(req.userId!);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await updateSafetyTimer(req.userId!, req.body);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function checkInHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await checkIn(req.userId!);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function addRecipientHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await addRecipient(req.userId!, req.body);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function updateRecipientHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await updateRecipient(req.userId!, req.params.id as string, req.body);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function deleteRecipientHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await deleteRecipient(req.userId!, req.params.id as string);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function addReminderHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await addReminder(req.userId!, req.body);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function deleteReminderHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await deleteReminder(req.userId!, req.params.id as string);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function verifySmtp(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config: SmtpConfig = {
      host: req.body.host,
      port: req.body.port,
      secure: req.body.secure,
      user: req.body.user,
      pass: req.body.pass,
      fromAddress: req.body.fromAddress,
      fromName: req.body.fromName,
    };

    const isValid = await verifySmtpConfig(config);

    if (!isValid) {
      res.status(400).json({
        error: {
          code: 'SMTP_VERIFICATION_FAILED',
          message: 'Failed to verify SMTP configuration',
        },
      });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function testEmail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { recipientEmail, ...smtpConfig } = req.body;

    const config: SmtpConfig = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.user,
      pass: smtpConfig.pass,
      fromAddress: smtpConfig.fromAddress,
      fromName: smtpConfig.fromName,
    };

    const sent = await sendTestEmail(config, recipientEmail);

    if (!sent) {
      res.status(500).json({
        error: {
          code: 'TEST_EMAIL_FAILED',
          message: 'Failed to send test email',
        },
      });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
