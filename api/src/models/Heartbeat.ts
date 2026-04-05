import mongoose, { Schema, Document } from 'mongoose';

export interface IHeartbeat extends Document {
  deviceId: string;
  busId: string;
  routeId: string | null;
  tripId: string | null;
  timestamp: Date;
  lat: number;
  lng: number;
  speedKmph: number | null;
  bearingDeg: number | null;
  odometerKm: number | null;
  batteryPct: number | null;
  networkType: string | null;
  networkSignalDbm: number | null;
  createdAt: Date;
}

const HeartbeatSchema = new Schema<IHeartbeat>({
  deviceId: { type: String, required: true, index: true },
  busId: { type: String, required: true, index: true },
  routeId: { type: String, default: null, index: true },
  tripId: { type: String, default: null, index: true },
  timestamp: { type: Date, required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speedKmph: { type: Number, default: null },
  bearingDeg: { type: Number, default: null },
  odometerKm: { type: Number, default: null },
  batteryPct: { type: Number, default: null },
  networkType: { type: String, default: null },
  networkSignalDbm: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
HeartbeatSchema.index({ busId: 1, timestamp: -1 });
HeartbeatSchema.index({ routeId: 1, timestamp: -1 });

export const Heartbeat = mongoose.model<IHeartbeat>('Heartbeat', HeartbeatSchema);
