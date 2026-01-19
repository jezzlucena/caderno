import mongoose, { Schema, Document, Types } from 'mongoose';
import { EncryptedData } from '../config/encryption.js';

export interface IReminder {
  _id: Types.ObjectId;
  reminderMinutesBefore: number;
}

export interface IRecipient {
  _id: Types.ObjectId;
  name: string;
  encryptedEmail: EncryptedData;
  personalMessage?: string;
  entryFilter: 'all' | 'tagged';
  filterTags?: string[];
}

export interface ISmtpConfig {
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

export interface ISafetyTimer extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  isEnabled: boolean;
  timerDurationMinutes: number;
  warningPeriodDays: number;
  lastResetAt: Date;
  nextDeliveryAt: Date;
  status: 'active' | 'warning' | 'delivered' | 'disabled';
  recipients: IRecipient[];
  reminders: IReminder[];
  smtpConfig?: ISmtpConfig;
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

const RecipientSchema = new Schema<IRecipient>(
  {
    name: { type: String, required: true, maxlength: 100 },
    encryptedEmail: { type: EncryptedDataSchema, required: true },
    personalMessage: { type: String, maxlength: 1000 },
    entryFilter: { type: String, enum: ['all', 'tagged'], default: 'all' },
    filterTags: [{ type: String }],
  }
);

const ReminderSchema = new Schema<IReminder>(
  {
    reminderMinutesBefore: { type: Number, required: true, min: 1 },
  }
);

const SmtpConfigSchema = new Schema<ISmtpConfig>(
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

const SafetyTimerSchema = new Schema<ISafetyTimer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    isEnabled: { type: Boolean, default: false },
    timerDurationMinutes: { type: Number, default: 43200 }, // Default: 30 days in minutes
    warningPeriodDays: { type: Number, min: 1, max: 7, default: 3 },
    lastResetAt: { type: Date, default: Date.now },
    nextDeliveryAt: { type: Date },
    status: {
      type: String,
      enum: ['active', 'warning', 'delivered', 'disabled'],
      default: 'disabled',
    },
    recipients: [RecipientSchema],
    reminders: [ReminderSchema],
    smtpConfig: SmtpConfigSchema,
  },
  {
    timestamps: true,
  }
);

SafetyTimerSchema.index({ status: 1, nextDeliveryAt: 1 });

export const SafetyTimer = mongoose.model<ISafetyTimer>('SafetyTimer', SafetyTimerSchema);
