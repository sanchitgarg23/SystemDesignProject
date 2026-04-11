import { Heartbeat, Ticket, Trip, Route } from '../models';

/**
 * QueryService — Data Query Operations
 * 
 * Provides read-only query methods for fetching live bus data,
 * trip tickets, and revenue summaries.
 * 
 * Design Pattern: Facade
 * - Hides MongoDB aggregation pipelines and complex query logic
 *   behind simple static method calls.
 * 
 * OOP Concept: Abstraction
 * - Callers don't need to understand MongoDB aggregation syntax
 * - Each method abstracts a complex multi-collection query
 */
export class QueryService {
  /**
   * Get live data for a specific bus
   */
  public static getBusLiveData(busId: string) {
    return Heartbeat.findOne({ busId })
      .sort({ timestamp: -1 })
      .lean()
      .then(heartbeat => {
        if (!heartbeat) return null;

        return {
          bus_id: heartbeat.busId,
          route_id: heartbeat.routeId,
          trip_id: heartbeat.tripId,
          lat: heartbeat.lat,
          lng: heartbeat.lng,
          speed_kmph: heartbeat.speedKmph,
          bearing_deg: heartbeat.bearingDeg,
          timestamp: heartbeat.timestamp,
          battery_pct: heartbeat.batteryPct,
        };
      });
  }

  /**
   * Get all live buses on a route
   */
  public static async getRouteLiveBuses(routeId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Get distinct buses with recent heartbeats on this route
    const heartbeats = await Heartbeat.aggregate([
      {
        $match: {
          routeId,
          timestamp: { $gte: fiveMinutesAgo },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: '$busId',
          lastHeartbeat: { $first: '$$ROOT' },
        },
      },
    ]);

    const buses = heartbeats.map(h => ({
      bus_id: h.lastHeartbeat.busId,
      lat: h.lastHeartbeat.lat,
      lng: h.lastHeartbeat.lng,
      speed_kmph: h.lastHeartbeat.speedKmph,
      trip_id: h.lastHeartbeat.tripId,
      timestamp: h.lastHeartbeat.timestamp,
    }));

    return {
      route_id: routeId,
      buses,
      count: buses.length,
    };
  }

  /**
   * Get all tickets for a trip
   */
  public static async getTripTickets(tripId: string) {
    const trip = await Trip.findOne({ tripId }).lean();

    if (!trip) {
      return null;
    }

    const tickets = await Ticket.find({ tripId })
      .sort({ issuedAt: -1 })
      .lean();

    const totalFare = tickets.reduce((sum, t) => sum + t.fareAmount, 0);

    return {
      trip_id: tripId,
      bus_id: trip.busId,
      route_id: trip.routeId,
      tickets: tickets.map(t => ({
        ticket_id: t.ticketId,
        boarding_stop: t.boardingStop,
        destination_stop: t.destinationStop,
        fare_amount: t.fareAmount,
        passenger_type: t.passengerType,
        payment_mode: t.paymentMode,
        issued_at: t.issuedAt,
      })),
      total_tickets: tickets.length,
      total_fare: Math.round(totalFare * 100) / 100,
    };
  }

  /**
   * Get revenue summary for a date
   */
  public static async getRevenueSummary(date: string) {
    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    const tickets = await Ticket.find({
      issuedAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const totalRevenue = tickets.reduce((sum, t) => sum + t.fareAmount, 0);

    // Group by route
    const routeMap = new Map<string, { tickets: number; revenue: number }>();

    for (const ticket of tickets) {
      const current = routeMap.get(ticket.routeId) || { tickets: 0, revenue: 0 };
      current.tickets++;
      current.revenue += ticket.fareAmount;
      routeMap.set(ticket.routeId, current);
    }

    const routes = Array.from(routeMap.entries()).map(([routeId, data]) => ({
      route_id: routeId,
      total_tickets: data.tickets,
      total_revenue: Math.round(data.revenue * 100) / 100,
    }));

    return {
      date,
      total_tickets: tickets.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      routes,
    };
  }
}

// Backward-compatible named exports
export const getBusLiveData = QueryService.getBusLiveData;
export const getRouteLiveBuses = QueryService.getRouteLiveBuses;
export const getTripTickets = QueryService.getTripTickets;
export const getRevenueSummary = QueryService.getRevenueSummary;
