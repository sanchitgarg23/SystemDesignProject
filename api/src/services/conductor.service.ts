import { nanoid } from 'nanoid';
import { Device, Trip, Ticket, OfflineBatch } from '../models';
import { calculatePassengerLoad } from './passenger-load.service';

/**
 * Conductor login
 */
export async function loginConductor(deviceId: string, conductorId: string) {
  const device = await Device.findOne({ deviceId });

  if (!device || device.status !== 'active') {
    throw new Error('Invalid or inactive device');
  }

  // Find active trip
  const activeTrip = await Trip.findOne({ deviceId, status: 'active' }).lean();

  // Generate token
  const token = `CONDUCTOR_${deviceId}_${conductorId}_${Date.now()}`;

  return {
    device_id: deviceId,
    conductor_id: conductorId,
    bus_id: device.busId,
    token,
    active_trip: activeTrip
      ? {
          trip_id: activeTrip.tripId,
          bus_id: activeTrip.busId,
          route_id: activeTrip.routeId,
          start_time: activeTrip.actualStartTime?.toISOString(),
        }
      : null,
  };
}

/**
 * Get active trip for conductor
 */
export async function getActiveTrip(deviceId: string) {
  const trip = await Trip.findOne({ deviceId, status: 'active' }).lean();

  if (!trip) return null;

  const passengerCount = await Ticket.countDocuments({ tripId: trip.tripId });
  const loadPct = await calculatePassengerLoad(trip.busId, trip.tripId);

  return {
    trip_id: trip.tripId,
    bus_id: trip.busId,
    route_id: trip.routeId,
    start_time: trip.actualStartTime?.toISOString(),
    passenger_count: passengerCount,
    passenger_load_pct: loadPct,
  };
}

/**
 * Create ticket from conductor app
 */
export async function createConductorTicket(
  deviceId: string,
  ticketData: {
    boarding_stop: string;
    destination_stop: string;
    fare_amount: number;
    payment_mode: string;
    passenger_type?: string;
  }
) {
  const device = await Device.findOne({ deviceId });
  if (!device) throw new Error('Device not found');

  const activeTrip = await Trip.findOne({ deviceId, status: 'active' });
  if (!activeTrip) throw new Error('No active trip found');

  const ticketId = `TKT_${nanoid(12)}`;

  const ticket = new Ticket({
    ticketId,
    deviceId,
    busId: device.busId!,
    routeId: activeTrip.routeId,
    tripId: activeTrip.tripId,
    issuedAt: new Date(),
    boardingStop: ticketData.boarding_stop,
    destinationStop: ticketData.destination_stop,
    fareAmount: ticketData.fare_amount,
    paymentMode: ticketData.payment_mode,
    passengerType: ticketData.passenger_type || 'adult',
    currency: 'INR',
  });

  await ticket.save();

  return {
    ticket_id: ticket.ticketId,
    issued_at: ticket.issuedAt.toISOString(),
    boarding_stop: ticket.boardingStop,
    destination_stop: ticket.destinationStop,
    fare_amount: ticket.fareAmount,
    payment_mode: ticket.paymentMode,
  };
}

/**
 * Sync offline tickets
 */
export async function syncOfflineTickets(
  deviceId: string,
  tickets: Array<{
    ticket_id: string;
    boarding_stop: string;
    destination_stop: string;
    fare_amount: number;
    payment_mode: string;
    passenger_type?: string;
    issued_at: string;
  }>
) {
  const batchId = `BATCH_${nanoid(12)}`;
  let acceptedCount = 0;
  let duplicateCount = 0;
  let rejectedCount = 0;

  for (const ticketData of tickets) {
    try {
      const existing = await Ticket.findOne({ ticketId: ticketData.ticket_id });
      if (existing) {
        duplicateCount++;
        continue;
      }

      const device = await Device.findOne({ deviceId });
      if (!device) {
        rejectedCount++;
        continue;
      }

      const trip = await Trip.findOne({
        deviceId,
        actualStartTime: { $lte: new Date(ticketData.issued_at) },
      }).sort({ actualStartTime: -1 });

      if (!trip) {
        rejectedCount++;
        continue;
      }

      const ticket = new Ticket({
        ticketId: ticketData.ticket_id,
        deviceId,
        busId: device.busId!,
        routeId: trip.routeId,
        tripId: trip.tripId,
        issuedAt: new Date(ticketData.issued_at),
        boardingStop: ticketData.boarding_stop,
        destinationStop: ticketData.destination_stop,
        fareAmount: ticketData.fare_amount,
        paymentMode: ticketData.payment_mode,
        passengerType: ticketData.passenger_type || 'adult',
        currency: 'INR',
      });

      await ticket.save();
      acceptedCount++;
    } catch (error) {
      console.error('Error processing offline ticket:', error);
      rejectedCount++;
    }
  }

  const batch = new OfflineBatch({
    batchId,
    deviceId,
    uploadedAt: new Date(),
    ticketsCount: tickets.length,
    acceptedCount,
    duplicateCount,
    rejectedCount,
  });

  await batch.save();

  return {
    batch_id: batchId,
    total: tickets.length,
    accepted: acceptedCount,
    duplicates: duplicateCount,
    rejected: rejectedCount,
  };
}
