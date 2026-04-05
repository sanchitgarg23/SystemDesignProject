import mongoose, { Schema, Document } from 'mongoose';

export interface IUserBooking extends Document {
  bookingId: string;
  userId: string;
  routeId: string;
  tripId: string | null;
  boardingStop: string;
  destinationStop: string;
  journeyDate: Date;
  passengerCount: number;
  passengerType: string;
  fareAmount: number;
  currency: string;
  paymentStatus: string;
  paymentMode: string | null;
  transactionId: string | null;
  status: string;
  qrCode: string | null;
  qrData: string | null; // JSON data encoded in QR
  createdAt: Date;
  updatedAt: Date;
}

const UserBookingSchema = new Schema<IUserBooking>({
  bookingId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  routeId: { type: String, required: true, index: true },
  tripId: { type: String, default: null, index: true },
  boardingStop: { type: String, required: true },
  destinationStop: { type: String, required: true },
  journeyDate: { type: Date, required: true, index: true },
  passengerCount: { type: Number, default: 1 },
  passengerType: { type: String, default: 'adult' },
  fareAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentStatus: { type: String, default: 'pending', index: true },
  paymentMode: { type: String, default: null },
  transactionId: { type: String, default: null },
  status: { type: String, default: 'confirmed', index: true },
  qrCode: { type: String, default: null }, // Base64 QR image
  qrData: { type: String, default: null }, // QR payload for verification
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserBookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound indexes
UserBookingSchema.index({ userId: 1, journeyDate: -1 });
UserBookingSchema.index({ status: 1, journeyDate: 1 });

export const UserBooking = mongoose.model<IUserBooking>('UserBooking', UserBookingSchema);
