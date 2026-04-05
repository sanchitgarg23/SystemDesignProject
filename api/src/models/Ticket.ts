import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  deviceId: string;
  busId: string;
  routeId: string;
  tripId: string;
  issuedAt: Date;
  boardingStop: string;
  destinationStop: string;
  distanceKm: number | null;
  fareAmount: number;
  currency: string;
  passengerType: string;
  paymentMode: string;
  seatNo: string | null;
  currentLat: number | null;
  currentLng: number | null;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticketId: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, required: true, index: true },
  busId: { type: String, required: true, index: true },
  routeId: { type: String, required: true, index: true },
  tripId: { type: String, required: true, index: true },
  issuedAt: { type: Date, required: true, index: true },
  boardingStop: { type: String, required: true },
  destinationStop: { type: String, required: true },
  distanceKm: { type: Number, default: null },
  fareAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  passengerType: { type: String, required: true },
  paymentMode: { type: String, required: true },
  seatNo: { type: String, default: null },
  currentLat: { type: Number, default: null },
  currentLng: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes
TicketSchema.index({ tripId: 1, issuedAt: -1 });
TicketSchema.index({ busId: 1, issuedAt: -1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
