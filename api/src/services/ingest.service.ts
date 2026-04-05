import { nanoid } from 'nanoid';
import { Heartbeat, Ticket, Trip, OfflineBatch, Device } from '../models';
import { Heartbeat as HeartbeatInput, Ticket as TicketInput, TripStart, TripEnd, OfflineBatch as OfflineBatchInput } from '../types';

/**
 * Store GPS heartbeat from ETM device
 */
export async function storeHeartbeat(data: HeartbeatInput): Promise<void> {
  const heartbeat = new Heartbeat({
    deviceId: data.device_id,
    busId: data.bus_id,
    routeId: data.route_id,
    tripId: data.trip_id,
    timestamp: new Date(data.timestamp),
    lat: data.gps.lat,
    lng: data.gps.lng,
    speedKmph: data.gps.speed_kmph || null,
    bearingDeg: data.gps.bearing_deg || null,
    odometerKm: data.odometer_km || null,
    batteryPct: data.battery_pct || null,
    networkType: data.network?.type || null,
    networkSignalDbm: data.network?.signal_dbm || null,
  });

  await heartbeat.save();

  // Update device last seen
  await Device.findOneAndUpdate(
    { deviceId: data.device_id },
    { lastSeen: new Date() }
  );
}

/**
 * Store ticket from ETM device
 */
export async function storeTicket(data: TicketInput): Promise<{ ticket_id: string; duplicate: boolean }> {
  // Check for duplicate
  const existing = await Ticket.findOne({ ticketId: data.ticket_id });
  
  if (existing) {
    return { ticket_id: data.ticket_id, duplicate: true };
  }

  const ticket = new Ticket({
    ticketId: data.ticket_id,
    deviceId: data.device_id,
    busId: data.bus_id,
    routeId: data.route_id,
    tripId: data.trip_id,
    issuedAt: new Date(data.issued_at),
    boardingStop: data.boarding_stop,
    destinationStop: data.destination_stop,
    distanceKm: data.distance_km || null,
    fareAmount: data.fare_amount,
    currency: data.currency || 'INR',
    passengerType: data.passenger_type,
    paymentMode: data.payment_mode,
    seatNo: data.seat_no || null,
    currentLat: data.current_location?.lat || null,
    currentLng: data.current_location?.lng || null,
  });

  await ticket.save();

  return { ticket_id: data.ticket_id, duplicate: false };
}

/**
 * Start a new trip
 */
export async function startTrip(data: TripStart): Promise<{ trip_id: string; exists: boolean }> {
  // Check if trip already exists
  const existing = await Trip.findOne({ tripId: data.trip_id });
  
  if (existing) {
    return { trip_id: data.trip_id, exists: true };
  }

  const trip = new Trip({
    tripId: data.trip_id,
    busId: data.bus_id,
    routeId: data.route_id,
    deviceId: data.device_id,
    driverId: data.driver_id || null,
    conductorId: data.conductor_id || null,
    plannedStartTime: new Date(data.planned_start_time),
    actualStartTime: new Date(data.actual_start_time),
    status: 'active',
  });

  await trip.save();

  return { trip_id: data.trip_id, exists: false };
}

/**
 * End a trip
 */
export async function endTrip(data: TripEnd): Promise<{ trip_id: string; found: boolean }> {
  const trip = await Trip.findOneAndUpdate(
    { tripId: data.trip_id },
    {
      status: 'completed',
      actualEndTime: new Date(data.actual_end_time),
      endOdometerKm: data.end_odometer_km || null,
    },
    { new: true }
  );

  if (!trip) {
    return { trip_id: data.trip_id, found: false };
  }

  return { trip_id: data.trip_id, found: true };
}

/**
 * Process offline batch of tickets
 */
export async function processOfflineBatch(data: OfflineBatchInput): Promise<{
  batch_id: string;
  accepted: number;
  duplicates: number;
  rejected: number;
}> {
  let accepted = 0;
  let duplicates = 0;
  let rejected = 0;

  for (const ticketData of data.tickets) {
    try {
      const result = await storeTicket(ticketData);
      
      if (result.duplicate) {
        duplicates++;
      } else {
        accepted++;
      }
    } catch (error) {
      console.error('Error processing batch ticket:', error);
      rejected++;
    }
  }

  // Create batch record
  const batch = new OfflineBatch({
    batchId: data.batch_id,
    deviceId: data.device_id,
    uploadedAt: new Date(data.uploaded_at),
    ticketsCount: data.tickets.length,
    acceptedCount: accepted,
    duplicateCount: duplicates,
    rejectedCount: rejected,
  });

  await batch.save();

  return {
    batch_id: data.batch_id,
    accepted,
    duplicates,
    rejected,
  };
}
