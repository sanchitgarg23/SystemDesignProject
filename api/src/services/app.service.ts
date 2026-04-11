import { nanoid } from 'nanoid';
import { AppUser, Route, Heartbeat, Ticket, BusCapacity } from '../models';
import { PassengerLoadService } from './passenger-load.service';

/**
 * AppService — Passenger App Business Logic
 * 
 * Handles all passenger-facing operations: login, stop lookup,
 * route search, live bus tracking, and bus detail views.
 * 
 * Design Pattern: Facade
 * - Provides a simplified interface for complex multi-collection queries
 * - Hides MongoDB aggregation pipelines, geospatial calculations,
 *   and cross-collection joins behind simple method calls.
 * 
 * OOP Concept: Abstraction
 * - The AppController doesn't know about Haversine formulas or aggregation pipelines
 * - It just calls AppService.getRouteLiveBusesWithLoad() and gets clean data back
 */
export class AppService {
  /**
   * Login user by mobile number
   */
  public static async loginUser(mobile: string) {
    let user = await AppUser.findOne({ mobile });

    if (!user) {
      const userId = `USER_${nanoid(10)}`;
      user = new AppUser({ userId, mobile });
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = `APP_${user.userId}_${Date.now()}`;

    return {
      user_id: user.userId,
      mobile: user.mobile,
      token,
    };
  }

  /**
   * Get all unique stops across routes
   */
  public static async getAllStops() {
    const routes = await Route.find({ status: 'active' }).lean();

    const stopMap = new Map<string, { name: string; lat: number; lng: number }>();

    for (const route of routes) {
      for (const stop of route.stops) {
        if (!stopMap.has(stop.name)) {
          stopMap.set(stop.name, {
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
          });
        }
      }
    }

    return Array.from(stopMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search routes by query
   */
  public static async searchRoutes(query: string) {
    const searchTerm = query.toLowerCase();

    const routes = await Route.find({
      status: 'active',
      $or: [
        { routeId: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
        { 'stops.name': { $regex: searchTerm, $options: 'i' } },
      ],
    }).lean();

    return routes.map(route => ({
      route_id: route.routeId,
      name: route.name,
      fare_per_km: route.farePerKm,
      stops: route.stops.map(s => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        sequence: s.sequence,
      })),
    }));
  }

  /**
   * Search routes by source and destination stops (partial matching)
   */
  public static async searchRoutesByStops(sourceStop: string, destinationStop: string) {
    const routes = await Route.find({ status: 'active' }).lean();
    const srcLower = sourceStop.toLowerCase();
    const destLower = destinationStop.toLowerCase();

    const validRoutes = routes.filter(route => {
      // Use partial/fuzzy matching for stop names
      const sourceIndex = route.stops.findIndex(s =>
        s.name.toLowerCase().includes(srcLower) || srcLower.includes(s.name.toLowerCase())
      );
      const destIndex = route.stops.findIndex(s =>
        s.name.toLowerCase().includes(destLower) || destLower.includes(s.name.toLowerCase())
      );
      return sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex;
    });

    return validRoutes.map(route => ({
      route_id: route.routeId,
      name: route.name,
      fare_per_km: route.farePerKm,
      stops: route.stops.map(s => s.name),
    }));
  }

  /**
   * Get live buses on a route with passenger load
   */
  public static async getRouteLiveBusesWithLoad(routeId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Get route for stop info
    const route = await Route.findOne({ routeId }).lean();

    // Get recent heartbeats
    const heartbeats = await Heartbeat.aggregate([
      {
        $match: {
          routeId,
          timestamp: { $gte: fiveMinutesAgo },
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$busId',
          lastHeartbeat: { $first: '$$ROOT' },
        },
      },
    ]);

    const buses = await Promise.all(
      heartbeats.map(async h => {
        const hb = h.lastHeartbeat;
        const loadPct = await PassengerLoadService.calculatePassengerLoad(hb.busId, hb.tripId);
        const loadCategory = PassengerLoadService.getLoadCategory(loadPct);

        let currentStop = null;
        let nextStop = null;
        let etaMinutes = null;

        if (route && route.stops.length > 0) {
          const stops = route.stops.map(s => ({ lat: s.lat, lng: s.lng }));
          const currentIdx = PassengerLoadService.findClosestStop(hb.lat, hb.lng, stops);
          currentStop = route.stops[currentIdx]?.name || null;

          if (currentIdx < route.stops.length - 1) {
            const nextStopData = route.stops[currentIdx + 1];
            nextStop = nextStopData.name;

            if (hb.speedKmph && hb.speedKmph > 0) {
              etaMinutes = PassengerLoadService.calculateETA(hb.lat, hb.lng, nextStopData.lat, nextStopData.lng, hb.speedKmph);
            }
          }
        }

        return {
          bus_id: hb.busId,
          trip_id: hb.tripId,
          lat: hb.lat,
          lng: hb.lng,
          speed_kmph: hb.speedKmph,
          last_update: hb.timestamp,
          passenger_load_pct: loadPct,
          load_category: loadCategory,
          current_stop: currentStop,
          next_stop: nextStop,
          eta_minutes: etaMinutes,
        };
      })
    );

    return {
      route_id: routeId,
      buses,
    };
  }

  /**
   * Get detailed tracking data for a bus
   */
  public static async getBusTrackingData(busId: string) {
    const heartbeat = await Heartbeat.findOne({ busId }).sort({ timestamp: -1 }).lean();

    if (!heartbeat) return null;

    const route = await Route.findOne({ routeId: heartbeat.routeId }).lean();
    if (!route) return null;

    const loadPct = await PassengerLoadService.calculatePassengerLoad(busId, heartbeat.tripId || undefined);
    const loadCategory = PassengerLoadService.getLoadCategory(loadPct);

    const stops = route.stops.map(s => ({ lat: s.lat, lng: s.lng }));
    const currentStopIndex = PassengerLoadService.findClosestStop(heartbeat.lat, heartbeat.lng, stops);

    const stopTimeline = route.stops.map((stop, index) => {
      let status: 'passed' | 'current' | 'upcoming';
      let eta: number | null = null;

      if (index < currentStopIndex) {
        status = 'passed';
      } else if (index === currentStopIndex) {
        status = 'current';
      } else {
        status = 'upcoming';
        if (index === currentStopIndex + 1 && heartbeat.speedKmph) {
          eta = PassengerLoadService.calculateETA(heartbeat.lat, heartbeat.lng, stop.lat, stop.lng, heartbeat.speedKmph);
        }
      }

      return {
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        sequence: stop.sequence,
        status,
        eta_minutes: eta,
      };
    });

    return {
      bus_id: busId,
      route_id: heartbeat.routeId,
      route_name: route.name,
      trip_id: heartbeat.tripId,
      current_location: {
        lat: heartbeat.lat,
        lng: heartbeat.lng,
        speed_kmph: heartbeat.speedKmph,
        bearing_deg: heartbeat.bearingDeg,
        timestamp: heartbeat.timestamp,
      },
      passenger_load_pct: loadPct,
      load_category: loadCategory,
      stop_timeline: stopTimeline,
    };
  }

  /**
   * Get all live buses
   */
  public static async getAllLiveBuses() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const heartbeats = await Heartbeat.aggregate([
      { $match: { timestamp: { $gte: fiveMinutesAgo } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$busId', lastHeartbeat: { $first: '$$ROOT' } } },
    ]);

    const buses = await Promise.all(
      heartbeats.map(async h => {
        const hb = h.lastHeartbeat;
        const loadPct = await PassengerLoadService.calculatePassengerLoad(hb.busId, hb.tripId);
        const loadCategory = PassengerLoadService.getLoadCategory(loadPct);

        let routeName = null;
        let currentStop = null;
        let nextStop = null;
        let etaMinutes = null;

        if (hb.routeId) {
          const route = await Route.findOne({ routeId: hb.routeId }).lean();
          if (route) {
            routeName = route.name;
            if (route.stops.length > 0) {
              const stops = route.stops.map(s => ({ lat: s.lat, lng: s.lng }));
              const currentIdx = PassengerLoadService.findClosestStop(hb.lat, hb.lng, stops);
              currentStop = route.stops[currentIdx]?.name || null;

              if (currentIdx < route.stops.length - 1) {
                const nextStopData = route.stops[currentIdx + 1];
                nextStop = nextStopData.name;
                if (hb.speedKmph && hb.speedKmph > 0) {
                  etaMinutes = PassengerLoadService.calculateETA(hb.lat, hb.lng, nextStopData.lat, nextStopData.lng, hb.speedKmph);
                }
              }
            }
          }
        }

        return {
          bus_id: hb.busId,
          route_id: hb.routeId,
          route_name: routeName,
          trip_id: hb.tripId,
          lat: hb.lat,
          lng: hb.lng,
          speed_kmph: hb.speedKmph,
          bearing_deg: hb.bearingDeg,
          last_update: hb.timestamp,
          passenger_load_pct: loadPct,
          load_category: loadCategory,
          current_stop: currentStop,
          next_stop: nextStop,
          eta_minutes: etaMinutes,
        };
      })
    );

    return buses;
  }
}

// Backward-compatible named exports
export const loginUser = AppService.loginUser;
export const getAllStops = AppService.getAllStops;
export const searchRoutes = AppService.searchRoutes;
export const searchRoutesByStops = AppService.searchRoutesByStops;
export const getRouteLiveBusesWithLoad = AppService.getRouteLiveBusesWithLoad;
export const getBusTrackingData = AppService.getBusTrackingData;
export const getAllLiveBuses = AppService.getAllLiveBuses;
