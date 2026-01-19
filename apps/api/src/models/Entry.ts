import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: Record<string, unknown>;
  plainText: string;
  tags: string[];
  includeInSafetyTimer: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const EntrySchema = new Schema<IEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 500 },
    content: { type: Schema.Types.Mixed, required: true },
    plainText: { type: String, required: true },
    tags: [{ type: String, maxlength: 50 }],
    includeInSafetyTimer: { type: Boolean, default: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

EntrySchema.index({ userId: 1, createdAt: -1 });
EntrySchema.index({ userId: 1, deletedAt: 1 });
EntrySchema.index({ userId: 1, tags: 1 });
EntrySchema.index({ userId: 1, plainText: 'text' });

export const Entry = mongoose.model<IEntry>('Entry', EntrySchema);
