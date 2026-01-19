import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPasskey extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  transports?: string[];
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

const PasskeySchema = new Schema<IPasskey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    credentialId: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    deviceType: {
      type: String,
      enum: ['singleDevice', 'multiDevice'],
      required: true,
    },
    backedUp: { type: Boolean, required: true, default: false },
    transports: [{ type: String }],
    name: { type: String, default: 'My Passkey' },
    lastUsedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PasskeySchema.index({ userId: 1 });

export const Passkey = mongoose.model<IPasskey>('Passkey', PasskeySchema);
