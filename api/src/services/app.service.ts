import { nanoid } from 'nanoid';
import { AppUser, Route, Heartbeat, Ticket, BusCapacity } from '../models';
import {
  calculatePassengerLoad,
  getLoadCategory,
  calculateETA,
  findClosestStop,
} from './passenger-load.service';

/**
 * Login user by mobile number
 */
export async function loginUser(mobile: string) {
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
export async function getAllStops() {
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
export async function searchRoutes(query: string) {
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
export async function searchRoutesByStops(sourceStop: string, destinationStop: string) {
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
export async function getRouteLiveBusesWithLoad(routeId: string) {
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
      const loadPct = await calculatePassengerLoad(hb.busId, hb.tripId);
      const loadCategory = getLoadCategory(loadPct);

      let currentStop = null;
      let nextStop = null;
      let etaMinutes = null;

      if (route && route.stops.length > 0) {
        const stops = route.stops.map(s => ({ lat: s.lat, lng: s.lng }));
        const currentIdx = findClosestStop(hb.lat, hb.lng, stops);
        currentStop = route.stops[currentIdx]?.name || null;

        if (currentIdx < route.stops.length - 1) {
          const nextStopData = route.stops[currentIdx + 1];
          nextStop = nextStopData.name;

          if (hb.speedKmph && hb.speedKmph > 0) {
            etaMinutes = calculateETA(hb.lat, hb.lng, nextStopData.lat, nextStopData.lng, hb.speedKmph);
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
export async function getBusTrackingData(busId: string) {
  const heartbeat = await Heartbeat.findOne({ busId }).sort({ timestamp: -1 }).lean();

  if (!heartbeat) return null;

  const route = await Route.findOne({ routeId: heartbeat.routeId }).lean();
  if (!route) return null;

  const loadPct = await calculatePassengerLoad(busId, heartbeat.tripId || undefined);
  const loadCategory = getLoadCategory(loadPct);

  const stops = route.stops.map(s => ({ lat: s.lat, lng: s.lng }));
  const currentStopIndex = findClosestStop(heartbeat.lat, heartbeat.lng, stops);

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
        eta = calculateETA(heartbeat.lat, heartbeat.lng, stop.lat, stop.lng, heartbeat.speedKmph);
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
export async function getAllLiveBuses() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const heartbeats = await Heartbeat.aggregate([
    { $match: { timestamp: { $gte: fiveMinutesAgo } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$busId', lastHeartbeat: { $first: '$$ROOT' } } },
  ]);

  const buses = await Promise.all(
    heartbeats.map(async h => {
      const hb = h.lastHeartbeat;
      const loadPct = await calculatePassengerLoad(hb.busId, hb.tripId);
      const loadCategory = getLoadCategory(loadPct);

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
            const currentIdx = findClosestStop(hb.lat, hb.lng, stops);
            currentStop = route.stops[currentIdx]?.name || null;

            if (currentIdx < route.stops.length - 1) {
              const nextStopData = route.stops[currentIdx + 1];
              nextStop = nextStopData.name;
              if (hb.speedKmph && hb.speedKmph > 0) {
                etaMinutes = calculateETA(hb.lat, hb.lng, nextStopData.lat, nextStopData.lng, hb.speedKmph);
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
