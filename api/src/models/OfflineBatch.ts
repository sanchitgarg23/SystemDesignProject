import mongoose, { Schema, Document } from 'mongoose';

export interface IOfflineBatch extends Document {
  batchId: string;
  deviceId: string;
  uploadedAt: Date;
  ticketsCount: number;
  acceptedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  createdAt: Date;
}

const OfflineBatchSchema = new Schema<IOfflineBatch>({
  batchId: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true, index: true },
  uploadedAt: { type: Date, required: true },
  ticketsCount: { type: Number, default: 0 },
  acceptedCount: { type: Number, default: 0 },
  duplicateCount: { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const OfflineBatch = mongoose.model<IOfflineBatch>('OfflineBatch', OfflineBatchSchema);
