import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { AppSettings, getAppSettings } from '../models/AppSettings.js';
import { encrypt } from '../config/encryption.js';
import { verifySmtpConfig, SmtpConfig, getSmtpConfigForDisplay } from '../services/emailService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getOnboardingStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await getAppSettings();
    const userCount = await User.countDocuments();

    res.json({
      isComplete: settings.isOnboardingComplete,
      currentStep: settings.isOnboardingComplete ? 5 : 0,
      hasUser: userCount > 0,
      hasSmtp: !!settings.smtpConfig,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeOnboarding(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await getAppSettings();

    if (req.body.instanceName) {
      settings.instanceName = req.body.instanceName;
    }

    settings.isOnboardingComplete = true;
    settings.isRegistrationEnabled = false; // Disable registration after onboarding
    await settings.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getPreferences(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({
      preferences: user.preferences,
      email: user.email,
      authMethods: user.authMethods,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const { theme, language, editorFontSize } = req.body;

    if (theme !== undefined) user.preferences.theme = theme;
    if (language !== undefined) user.preferences.language = language;
    if (editorFontSize !== undefined) user.preferences.editorFontSize = editorFontSize;

    await user.save();

    res.json({ preferences: user.preferences });
  } catch (error) {
    next(error);
  }
}

export async function getSmtpSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = await getSmtpConfigForDisplay();

    if (!config) {
      res.json({ configured: false, config: null });
      return;
    }

    res.json({
      configured: true,
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        fromAddress: config.fromAddress,
        fromName: config.fromName || '',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSmtpSettings(
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

    // Verify SMTP config first
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

    const settings = await getAppSettings();

    settings.smtpConfig = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      encryptedAuth: {
        user: encrypt(config.user),
        pass: encrypt(config.pass),
      },
      fromAddress: config.fromAddress,
      fromName: config.fromName,
    };

    await settings.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getAppInfo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await getAppSettings();

    res.json({
      instanceName: settings.instanceName,
      version: '1.0.0',
    });
  } catch (error) {
    next(error);
  }
}
