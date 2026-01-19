import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getAppSettings, IAppSettings } from '../models/AppSettings.js';
import { ISafetyTimer } from '../models/SafetyTimer.js';
import { decrypt } from '../config/encryption.js';
import { env } from '../config/env.js';

let transporter: Transporter | null = null;

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress: string;
  fromName?: string;
}

function createTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

async function getGlobalSmtpConfig(): Promise<SmtpConfig | null> {
  const settings = await getAppSettings();

  if (!settings.smtpConfig) {
    return null;
  }

  return {
    host: settings.smtpConfig.host,
    port: settings.smtpConfig.port,
    secure: settings.smtpConfig.secure,
    user: decrypt(settings.smtpConfig.encryptedAuth.user),
    pass: decrypt(settings.smtpConfig.encryptedAuth.pass),
    fromAddress: settings.smtpConfig.fromAddress,
    fromName: settings.smtpConfig.fromName,
  };
}

export async function isSmtpConfigured(): Promise<boolean> {
  const config = await getGlobalSmtpConfig();
  return config !== null;
}

// Get SMTP config for display (without password)
export async function getSmtpConfigForDisplay(): Promise<Omit<SmtpConfig, 'pass'> | null> {
  const settings = await getAppSettings();

  if (!settings.smtpConfig) {
    return null;
  }

  return {
    host: settings.smtpConfig.host,
    port: settings.smtpConfig.port,
    secure: settings.smtpConfig.secure,
    user: decrypt(settings.smtpConfig.encryptedAuth.user),
    fromAddress: settings.smtpConfig.fromAddress,
    fromName: settings.smtpConfig.fromName,
  };
}

export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<boolean> {
  const config = await getGlobalSmtpConfig();

  if (!config) {
    console.warn('SMTP not configured, cannot send magic link email');
    return false;
  }

  const transporter = createTransporter(config);
  const magicLinkUrl = `${env.ORIGIN}/auth/magic-link?token=${token}`;

  try {
    await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromAddress}>`
        : config.fromAddress,
      to: email,
      subject: 'Sign in to Caderno',
      text: `Click the link below to sign in to your Caderno account:\n\n${magicLinkUrl}\n\nThis link will expire in 15 minutes.\n\nIf you did not request this email, you can safely ignore it.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sign in to Caderno</h2>
          <p>Click the button below to sign in to your account:</p>
          <p style="margin: 24px 0;">
            <a href="${magicLinkUrl}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Sign In
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 15 minutes.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you did not request this email, you can safely ignore it.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    return false;
  }
}

export async function sendWarningEmail(
  email: string,
  daysRemaining: number,
  recipientName: string,
  timeRemainingOverride?: string
): Promise<boolean> {
  const config = await getGlobalSmtpConfig();

  if (!config) {
    return false;
  }

  const transporter = createTransporter(config);
  const checkInUrl = `${env.ORIGIN}/safety-timer`;

  // Use override if provided, otherwise format from daysRemaining
  const timeRemaining = timeRemainingOverride ?? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;

  try {
    await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromAddress}>`
        : config.fromAddress,
      to: email,
      subject: `Caderno Safety Timer - ${timeRemaining} remaining`,
      text: `Dear ${recipientName},\n\nThis is a reminder that your Caderno Safety Timer will deliver your journal entries to your designated recipients in ${timeRemaining}.\n\nTo reset the timer and prevent delivery, please check in at:\n${checkInUrl}\n\nIf you intended for the timer to expire, no action is needed.\n\n- Caderno`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Caderno Safety Timer Reminder</h2>
          <p>Dear ${recipientName},</p>
          <p>This is a reminder that your Safety Timer will deliver your journal entries to your designated recipients in <strong>${timeRemaining}</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${checkInUrl}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Check In Now
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            If you intended for the timer to expire, no action is needed.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send warning email:', error);
    return false;
  }
}

export async function sendDeliveryEmail(
  recipientEmail: string,
  recipientName: string,
  personalMessage: string | undefined,
  senderEmail: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  const config = await getGlobalSmtpConfig();

  if (!config) {
    return false;
  }

  const transporter = createTransporter(config);

  try {
    await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromAddress}>`
        : config.fromAddress,
      to: recipientEmail,
      subject: `Journal entries from ${senderEmail}`,
      text: `Dear ${recipientName},\n\n${personalMessage || 'The attached PDF contains journal entries that were shared with you.'}\n\nThese entries were sent automatically by the Caderno Safety Timer feature.\n\n- Caderno`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Journal Entries</h2>
          <p>Dear ${recipientName},</p>
          <p>${personalMessage || 'The attached PDF contains journal entries that were shared with you.'}</p>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            These entries were sent automatically by the Caderno Safety Timer feature.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `journal-entries-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Failed to send delivery email:', error);
    return false;
  }
}

export async function verifySmtpConfig(config: SmtpConfig): Promise<boolean> {
  const transporter = createTransporter(config);

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP verification failed:', error);
    return false;
  }
}

export async function sendTestEmail(
  config: SmtpConfig,
  recipientEmail: string
): Promise<boolean> {
  const transporter = createTransporter(config);

  try {
    await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromAddress}>`
        : config.fromAddress,
      to: recipientEmail,
      subject: 'Caderno - Test Email',
      text: 'This is a test email from Caderno. Your SMTP configuration is working correctly!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email from Caderno</h2>
          <p>This is a test email from Caderno.</p>
          <p style="color: #22c55e; font-weight: bold;">Your SMTP configuration is working correctly!</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send test email:', error);
    return false;
  }
}
