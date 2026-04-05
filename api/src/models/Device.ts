import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  apiKey: string;
  busId: string | null;
  status: string;
  createdAt: Date;
  lastSeen: Date | null;
}

const DeviceSchema = new Schema<IDevice>({
  deviceId: { type: String, required: true, unique: true, index: true },
  apiKey: { type: String, required: true, unique: true },
  busId: { type: String, default: null, index: true },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: null }
});

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
