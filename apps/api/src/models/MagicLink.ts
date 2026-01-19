import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMagicLink extends Document {
  _id: Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const MagicLinkSchema = new Schema<IMagicLink>(
  {
    email: { type: String, required: true, lowercase: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

MagicLinkSchema.index({ email: 1 });
MagicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MagicLink = mongoose.model<IMagicLink>('MagicLink', MagicLinkSchema);
