import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppSettings extends Document {
  _id: Types.ObjectId;
  isOnboardingComplete: boolean;
  instanceName: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    isOnboardingComplete: { type: Boolean, default: false },
    instanceName: { type: String, default: 'Caderno', maxlength: 100 },
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
