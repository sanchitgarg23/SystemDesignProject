import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  driverId: string;
  name: string;
  phone: string;
  licenseNo: string;
  status: 'active' | 'inactive' | 'on_leave';
  currentBusId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema({
  driverId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  licenseNo: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'on_leave'],
    default: 'active' 
  },
  currentBusId: { type: String, default: null },
}, { timestamps: true });

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
