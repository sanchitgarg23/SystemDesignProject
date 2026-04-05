import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  tripId: string;
  busId: string;
  routeId: string;
  deviceId: string;
  driverId: string | null;
  conductorId: string | null;
  plannedStartTime: Date | null;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  status: string;
  createdAt: Date;
}

const TripSchema = new Schema<ITrip>({
  tripId: { type: String, required: true, unique: true, index: true },
  busId: { type: String, required: true, index: true },
  routeId: { type: String, required: true, index: true },
  deviceId: { type: String, required: true, index: true },
  driverId: { type: String, default: null },
  conductorId: { type: String, default: null },
  plannedStartTime: { type: Date, default: null },
  actualStartTime: { type: Date, default: null, index: true },
  actualEndTime: { type: Date, default: null },
  startOdometerKm: { type: Number, default: null },
  endOdometerKm: { type: Number, default: null },
  status: { type: String, default: 'active', index: true },
  createdAt: { type: Date, default: Date.now }
});

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
