import mongoose, { Schema, Document } from 'mongoose';

export interface IBusCapacity extends Document {
  busId: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const BusCapacitySchema = new Schema<IBusCapacity>({
  busId: { type: String, required: true, unique: true, index: true },
  capacity: { type: Number, default: 50 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BusCapacitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const BusCapacity = mongoose.model<IBusCapacity>('BusCapacity', BusCapacitySchema);
