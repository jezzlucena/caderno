import mongoose, { Schema, Document, Types } from 'mongoose';
import { EncryptedData } from '../config/encryption.js';

export interface IGlobalSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  encryptedAuth: {
    user: EncryptedData;
    pass: EncryptedData;
  };
  fromAddress: string;
  fromName?: string;
}

export interface IAppSettings extends Document {
  _id: Types.ObjectId;
  isOnboardingComplete: boolean;
  instanceName: string;
  smtpConfig?: IGlobalSmtpConfig;
  createdAt: Date;
  updatedAt: Date;
}

const EncryptedDataSchema = new Schema(
  {
    iv: { type: String, required: true },
    data: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { _id: false }
);

const GlobalSmtpConfigSchema = new Schema<IGlobalSmtpConfig>(
  {
    host: { type: String, required: true },
    port: { type: Number, required: true },
    secure: { type: Boolean, default: true },
    encryptedAuth: {
      user: { type: EncryptedDataSchema, required: true },
      pass: { type: EncryptedDataSchema, required: true },
    },
    fromAddress: { type: String, required: true },
    fromName: { type: String },
  },
  { _id: false }
);

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    isOnboardingComplete: { type: Boolean, default: false },
    instanceName: { type: String, default: 'Caderno', maxlength: 100 },
    smtpConfig: GlobalSmtpConfigSchema,
  },
  {
    timestamps: true,
  }
);

export const AppSettings = mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);

// Helper to get or create singleton settings
export async function getAppSettings(): Promise<IAppSettings> {
  let settings = await AppSettings.findOne();
  if (!settings) {
    settings = await AppSettings.create({});
  }
  return settings;
}
