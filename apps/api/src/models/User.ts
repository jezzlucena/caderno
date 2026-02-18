import mongoose, { Schema, Document } from 'mongoose';
import { EncryptedData } from '../config/encryption.js';

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'pt-BR';
  editorFontSize: number;
}

export interface IUserSmtpConfig {
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

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash?: string;
  preferences: IUserPreferences;
  authMethods: ('password' | 'passkey' | 'magic-link')[];
  smtpConfig?: IUserSmtpConfig;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, enum: ['en', 'es', 'pt-BR'], default: 'en' },
    editorFontSize: { type: Number, min: 12, max: 24, default: 16 },
  },
  { _id: false }
);

const EncryptedDataSchema = new Schema(
  {
    iv: { type: String, required: true },
    data: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { _id: false }
);

const UserSmtpConfigSchema = new Schema<IUserSmtpConfig>(
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

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    preferences: { type: UserPreferencesSchema, default: () => ({}) },
    authMethods: {
      type: [{ type: String, enum: ['password', 'passkey', 'magic-link'] }],
      default: ['password'],
    },
    smtpConfig: { type: UserSmtpConfigSchema },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
