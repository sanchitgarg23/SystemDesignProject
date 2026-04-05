import { z } from 'zod';

// ============ Validation Schemas ============

export const GPSSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed_kmph: z.number().min(0).optional(),
  bearing_deg: z.number().min(0).max(360).optional(),
});

export const NetworkSchema = z.object({
  type: z.enum(['2G', '3G', '4G', '5G', 'WiFi']),
  signal_dbm: z.number().optional(),
});

export const HeartbeatSchema = z.object({
  device_id: z.string(),
  bus_id: z.string(),
  route_id: z.string(),
  trip_id: z.string(),
  timestamp: z.string().datetime(),
  gps: GPSSchema,
  odometer_km: z.number().min(0).optional(),
  battery_pct: z.number().min(0).max(100).optional(),
  network: NetworkSchema.optional(),
});

export const TicketSchema = z.object({
  device_id: z.string(),
  bus_id: z.string(),
  route_id: z.string(),
  trip_id: z.string(),
  ticket_id: z.string(),
  issued_at: z.string().datetime(),
  boarding_stop: z.string(),
  destination_stop: z.string(),
  distance_km: z.number().min(0).optional(),
  fare_amount: z.number().min(0),
  currency: z.string().default('INR'),
  passenger_type: z.enum(['adult', 'student', 'senior', 'pass']),
  payment_mode: z.enum(['cash', 'card', 'upi', 'pass']),
  seat_no: z.string().nullable().optional(),
  current_location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const TripStartSchema = z.object({
  device_id: z.string(),
  bus_id: z.string(),
  route_id: z.string(),
  trip_id: z.string(),
  planned_start_time: z.string().datetime(),
  actual_start_time: z.string().datetime(),
  driver_id: z.string().optional(),
  conductor_id: z.string().optional(),
});

export const TripEndSchema = z.object({
  device_id: z.string(),
  trip_id: z.string(),
  bus_id: z.string(),
  actual_end_time: z.string().datetime(),
  end_odometer_km: z.number().min(0).optional(),
});

export const OfflineBatchSchema = z.object({
  device_id: z.string(),
  batch_id: z.string(),
  uploaded_at: z.string().datetime(),
  tickets: z.array(TicketSchema),
});

export const BookingSchema = z.object({
  route_id: z.string(),
  boarding_stop: z.string(),
  destination_stop: z.string(),
  journey_date: z.string(), // YYYY-MM-DD format
  passenger_count: z.number().min(1).default(1),
  passenger_type: z.enum(['adult', 'child', 'senior']).default('adult'),
  payment_mode: z.enum(['upi', 'card', 'wallet']).optional(),
});

export const QRVerifySchema = z.object({
  qr_data: z.string(),
});

// ============ TypeScript Types ============

export type GPS = z.infer<typeof GPSSchema>;
export type Network = z.infer<typeof NetworkSchema>;
export type Heartbeat = z.infer<typeof HeartbeatSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type TripStart = z.infer<typeof TripStartSchema>;
export type TripEnd = z.infer<typeof TripEndSchema>;
export type OfflineBatch = z.infer<typeof OfflineBatchSchema>;
export type BookingInput = z.infer<typeof BookingSchema>;
export type QRVerifyInput = z.infer<typeof QRVerifySchema>;

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      authenticated?: boolean;
      device?: {
        device_id: string;
        bus_id: string | null;
      };
      user?: {
        user_id: string;
        mobile: string;
      };
    }
  }
}
