import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'pt-BR';
  editorFontSize: number;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash?: string;
  preferences: IUserPreferences;
  authMethods: ('password' | 'passkey' | 'magic-link')[];
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
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
