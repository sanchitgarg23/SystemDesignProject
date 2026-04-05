import mongoose, { Schema, Document } from 'mongoose';

export interface IBus extends Document {
  busId: string;
  registrationNo: string;
  type: 'AC Deluxe' | 'Super Deluxe' | 'Ordinary' | 'Standard Non-AC';
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BusSchema = new Schema({
  busId: { type: String, required: true, unique: true },
  registrationNo: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['AC Deluxe', 'Super Deluxe', 'Ordinary', 'Standard Non-AC'],
    default: 'Ordinary' 
  },
  capacity: { type: Number, required: true, default: 50 },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active' 
  },
  lastSeen: { type: Date, default: null },
}, { timestamps: true });

export const Bus = mongoose.model<IBus>('Bus', BusSchema);
