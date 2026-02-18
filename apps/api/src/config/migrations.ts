import { AppSettings } from '../models/AppSettings.js';
import { User } from '../models/User.js';
import { SafetyTimer } from '../models/SafetyTimer.js';

async function migrateSmtpConfigToUser(): Promise<void> {
  // Use lean() + any to access the legacy smtpConfig field that no longer exists in the TS interface
  const settings = await AppSettings.findOne({ smtpConfig: { $exists: true } }).lean() as any;

  if (!settings?.smtpConfig) {
    return;
  }

  console.log('Migration: copying smtpConfig from AppSettings to Users...');

  const smtpConfig = settings.smtpConfig;

  // Copy smtpConfig to all users that don't already have one
  await User.updateMany(
    { smtpConfig: { $exists: false } },
    { $set: { smtpConfig } }
  );

  // Remove smtpConfig from AppSettings
  await AppSettings.updateOne(
    { _id: settings._id },
    { $unset: { smtpConfig: '' } }
  );

  // Remove smtpConfig from all SafetyTimer documents
  await SafetyTimer.updateMany(
    {},
    { $unset: { smtpConfig: '' } }
  );

  console.log('Migration: smtpConfig moved to User model successfully');
}

export async function runMigrations(): Promise<void> {
  await migrateSmtpConfigToUser();
}
