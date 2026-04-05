import mongoose, { Schema, Document } from 'mongoose';

export interface IStop {
  name: string;
  lat: number;
  lng: number;
  sequence: number;
}

export interface IRoute extends Document {
  routeId: string;
  name: string;
  farePerKm: number;
  status: string;
  stops: IStop[];
  createdAt: Date;
}

const StopSchema = new Schema<IStop>({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  sequence: { type: Number, required: true }
}, { _id: false });

const RouteSchema = new Schema<IRoute>({
  routeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  farePerKm: { type: Number, required: true },
  status: { type: String, default: 'active' },
  stops: [StopSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Route = mongoose.model<IRoute>('Route', RouteSchema);
