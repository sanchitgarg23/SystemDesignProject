import { Route, Ticket, Trip, Heartbeat, Device, BusCapacity, UserBooking, Driver, Conductor, Bus, AdminUser } from '../models';
import { calculatePassengerLoad, getLoadCategory } from './passenger-load.service';

/**
 * Get all routes with stops
 */
export async function getAllRoutes() {
  const routes = await Route.find({ status: 'active' }).lean();

  return routes.map(route => ({
    route_id: route.routeId,
    name: route.name,
    fare_per_km: route.farePerKm,
    status: route.status,
    stops: route.stops.map(stop => ({
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      sequence: stop.sequence,
    })),
  }));
}

/**
 * Get realtime analytics
 */
export async function getRealtimeAnalytics() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const heartbeats = await Heartbeat.aggregate([
    { $match: { timestamp: { $gte: fiveMinutesAgo } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$busId', lastHb: { $first: '$$ROOT' } } },
  ]);

  const activeBusCount = heartbeats.length;

  // Average speed
  const speeds = heartbeats
    .map(h => h.lastHb.speedKmph)
    .filter((s): s is number => s !== null && s !== undefined);
  const avgSpeed = speeds.length > 0
    ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length
    : 0;

  // Crowding breakdown
  const crowding = { low: 0, medium: 0, high: 0 };

  for (const h of heartbeats) {
    const loadPct = await calculatePassengerLoad(h._id, h.lastHb.tripId);
    const category = getLoadCategory(loadPct);
    crowding[category]++;
  }

  return {
    active_buses: activeBusCount,
    avg_speed_kmph: Math.round(avgSpeed * 10) / 10,
    crowding_breakdown: crowding,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get revenue analytics for a date
 */
export async function getRevenueAnalytics(date: string) {
  const startDate = new Date(`${date}T00:00:00Z`);
  const endDate = new Date(`${date}T23:59:59Z`);

  const tickets = await Ticket.find({
    issuedAt: { $gte: startDate, $lte: endDate },
  }).lean();

  const routeMap = new Map<string, { tickets: number; revenue: number; trips: Set<string> }>();

  for (const ticket of tickets) {
    if (!routeMap.has(ticket.routeId)) {
      routeMap.set(ticket.routeId, { tickets: 0, revenue: 0, trips: new Set() });
    }
    const data = routeMap.get(ticket.routeId)!;
    data.tickets++;
    data.revenue += ticket.fareAmount;
    data.trips.add(ticket.tripId);
  }

  const routes = Array.from(routeMap.entries()).map(([routeId, data]) => ({
    route_id: routeId,
    total_tickets: data.tickets,
    total_revenue: Math.round(data.revenue * 100) / 100,
    total_trips: data.trips.size,
  }));

  const totalTickets = tickets.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + t.fareAmount, 0);

  return {
    date,
    total_tickets: totalTickets,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    routes,
  };
}

/**
 * Get ticket analytics
 */
export async function getTicketAnalytics(filters: {
  boarding_stop?: string;
  destination_stop?: string;
  start_date?: string;
  end_date?: string;
}) {
  const query: any = {};

  if (filters.boarding_stop) {
    query.boardingStop = { $regex: filters.boarding_stop, $options: 'i' };
  }
  if (filters.destination_stop) {
    query.destinationStop = { $regex: filters.destination_stop, $options: 'i' };
  }
  if (filters.start_date || filters.end_date) {
    query.issuedAt = {};
    if (filters.start_date) query.issuedAt.$gte = new Date(`${filters.start_date}T00:00:00Z`);
    if (filters.end_date) query.issuedAt.$lte = new Date(`${filters.end_date}T23:59:59Z`);
  }

  const tickets = await Ticket.find(query).sort({ issuedAt: -1 }).lean();

  const totalTickets = tickets.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + t.fareAmount, 0);
  const uniqueTrips = new Set(tickets.map(t => t.tripId));
  const uniqueBuses = new Set(tickets.map(t => t.busId));

  // Group by bus
  const busMap = new Map<string, any>();
  for (const ticket of tickets) {
    if (!busMap.has(ticket.busId)) {
      busMap.set(ticket.busId, {
        bus_id: ticket.busId,
        route_id: ticket.routeId,
        trips: new Set(),
        ticketCount: 0,
        revenue: 0,
      });
    }
    const busData = busMap.get(ticket.busId)!;
    busData.trips.add(ticket.tripId);
    busData.ticketCount++;
    busData.revenue += ticket.fareAmount;
  }

  const buses = Array.from(busMap.values()).map(bus => ({
    bus_id: bus.bus_id,
    route_id: bus.route_id,
    total_trips: bus.trips.size,
    total_tickets: bus.ticketCount,
    total_revenue: Math.round(bus.revenue * 100) / 100,
    avg_fare: bus.ticketCount > 0 ? Math.round((bus.revenue / bus.ticketCount) * 100) / 100 : 0,
  }));

  return {
    search_criteria: filters,
    combined_totals: {
      total_buses: uniqueBuses.size,
      total_trips: uniqueTrips.size,
      total_tickets: totalTickets,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      avg_fare: totalTickets > 0 ? Math.round((totalRevenue / totalTickets) * 100) / 100 : 0,
      unique_seats_occupied: totalTickets // Best proxy for now
    },
    buses,
  };
}

/**
 * Get device health
 */
export async function getDeviceHealth() {
  const devices = await Device.find().lean();
  const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

  return devices.map(device => ({
    device_id: device.deviceId,
    bus_id: device.busId,
    status: device.status,
    last_seen: device.lastSeen?.toISOString() || null,
    offline: !device.lastSeen || device.lastSeen < threshold,
  }));
}

/**
 * Get fleet buses
 */
export async function getFleetBuses() {
  const devices = await Device.find({ busId: { $ne: null } }).lean();
  const capacities = await BusCapacity.find().lean();
  const capacityMap = new Map(capacities.map(bc => [bc.busId, bc.capacity]));

  const busMap = new Map<string, any>();

  for (const device of devices) {
    if (device.busId && !busMap.has(device.busId)) {
      busMap.set(device.busId, {
        bus_id: device.busId,
        status: device.status,
        last_seen: device.lastSeen,
        capacity: capacityMap.get(device.busId) || 50,
        type: 'Standard Non-AC',
      });
    }
  }

  return Array.from(busMap.values());
}

/**
 * Get fleet drivers
 */
export async function getFleetDrivers() {
  const trips = await Trip.find({ driverId: { $ne: null } })
    .sort({ createdAt: -1 })
    .lean();

  const driverMap = new Map<string, any>();

  for (const trip of trips) {
    if (trip.driverId && !driverMap.has(trip.driverId)) {
      driverMap.set(trip.driverId, {
        driver_id: trip.driverId,
        name: `Driver ${trip.driverId}`,
        status: trip.status === 'active' ? 'On Duty' : 'Off Duty',
        current_bus: trip.status === 'active' ? trip.busId : null,
        license_no: `DL-${trip.driverId.toUpperCase()}`,
        phone: '+91 98765 43210',
      });
    }
  }

  return Array.from(driverMap.values());
}

/**
 * Get fleet conductors
 */
export async function getFleetConductors() {
  const trips = await Trip.find({ conductorId: { $ne: null } })
    .sort({ createdAt: -1 })
    .lean();

  const conductorMap = new Map<string, any>();

  for (const trip of trips) {
    if (trip.conductorId && !conductorMap.has(trip.conductorId)) {
      conductorMap.set(trip.conductorId, {
        conductor_id: trip.conductorId,
        name: `Conductor ${trip.conductorId}`,
        status: trip.status === 'active' ? 'On Duty' : 'Off Duty',
        current_bus: trip.status === 'active' ? trip.busId : null,
        license_no: `CL-${trip.conductorId.toUpperCase()}`,
        phone: '+91 98765 43210',
      });
    }
  }

  return Array.from(conductorMap.values());
}

/**
 * Get all bookings for admin
 */
export async function getAllBookings(filters?: { status?: string; date?: string }) {
  const query: any = {};

  if (filters?.status) {
    query.status = filters.status;
  }
  if (filters?.date) {
    const startDate = new Date(`${filters.date}T00:00:00Z`);
    const endDate = new Date(`${filters.date}T23:59:59Z`);
    query.journeyDate = { $gte: startDate, $lte: endDate };
  }

  const bookings = await UserBooking.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return bookings.map(b => ({
    booking_id: b.bookingId,
    user_id: b.userId,
    route_id: b.routeId,
    boarding_stop: b.boardingStop,
    destination_stop: b.destinationStop,
    journey_date: b.journeyDate,
    passenger_count: b.passengerCount,
    fare_amount: b.fareAmount,
    status: b.status,
    payment_status: b.paymentStatus,
    created_at: b.createdAt,
  }));
}

// ============ ADMIN AUTHENTICATION ============

/**
 * Admin login
 */
export async function adminLogin(email: string, password: string) {
  // For demo, accept specific credentials or check DB
  const validEmail = process.env.ADMIN_EMAIL || 'admin@nextstop.com';
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Simple check (in production, use bcrypt and proper auth)
  if (email === validEmail && password === validPassword) {
    const token = process.env.ADMIN_DEMO_TOKEN || 'admin_demo_token_12345';
    return {
      success: true,
      token,
      user: {
        id: 'admin-001',
        email,
        name: 'Admin User',
        role: 'admin',
      },
    };
  }
  
  // Also check database for admin users
  const adminUser = await AdminUser.findOne({ email: email.toLowerCase(), isActive: true }).lean();
  if (adminUser && adminUser.password === password) {
    const token = `ADMIN_${adminUser._id}_${Date.now()}`;
    return {
      success: true,
      token,
      user: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    };
  }
  
  return { success: false, error: 'Invalid credentials' };
}

// ============ BUS TRACKING ============

/**
 * Get detailed bus tracking data with stop timeline
 */
export async function getBusTrackingData(busId: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Get latest heartbeat for this bus
  const heartbeat = await Heartbeat.findOne({ busId })
    .sort({ timestamp: -1 })
    .lean();
  
  if (!heartbeat) {
    return null;
  }
  
  // Get active trip for this bus
  const trip = await Trip.findOne({ busId, status: 'active' }).lean();
  
  // Get route info
  const route = await Route.findOne({ routeId: heartbeat.routeId || trip?.routeId }).lean();
  
  // Calculate passenger load
  const loadPct = await calculatePassengerLoad(busId, trip?.tripId || '');
  
  // Build stop timeline
  let stopTimeline: any[] = [];
  if (route && route.stops) {
    const currentStopIndex = route.stops.findIndex(
      (s: any) => s.name.toLowerCase().includes((heartbeat as any).currentStop?.toLowerCase() || '')
    );
    
    stopTimeline = route.stops.map((stop: any, idx: number) => ({
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      status: idx < currentStopIndex ? 'passed' : idx === currentStopIndex ? 'current' : 'upcoming',
      eta_minutes: idx > currentStopIndex ? (idx - currentStopIndex) * 10 : null,
    }));
  }
  
  return {
    bus_id: busId,
    route_id: heartbeat.routeId || trip?.routeId || '',
    route_name: route?.name || 'Unknown Route',
    passenger_load_pct: loadPct,
    current_location: {
      lat: heartbeat.lat,
      lng: heartbeat.lng,
      speed_kmph: heartbeat.speedKmph || 0,
    },
    stop_timeline: stopTimeline,
    last_update: heartbeat.timestamp,
  };
}

// ============ DEMAND ANALYSIS ============

/**
 * Get demand analysis for a route
 */
export async function getDemandAnalysis(routeId: string) {
  const route = await Route.findOne({ routeId }).lean();
  if (!route) {
    return null;
  }
  
  // Get tickets for this route to analyze patterns
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const tickets = await Ticket.find({
    routeId,
    issuedAt: { $gte: thirtyDaysAgo },
  }).lean();
  
  // Generate time slots from 06:00 to 22:00
  const timeSlots: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  
  const capacity = 50; // Default bus capacity
  
  // Calculate demand based on ticket data or generate realistic patterns
  const data = timeSlots.map(time => {
    const hour = parseInt(time.split(':')[0]);
    
    // Filter tickets for this time slot
    const slotTickets = tickets.filter(t => {
      const ticketHour = new Date(t.issuedAt).getHours();
      return ticketHour === hour;
    });
    
    // Calculate average passengers or use pattern-based estimate
    let passengers = slotTickets.length > 0 
      ? Math.round(slotTickets.length / 30) // Average per day
      : getEstimatedPassengers(hour, capacity);
    
    return {
      time,
      passengers,
      capacity,
      requiredBuses: Math.ceil(passengers / capacity),
    };
  });
  
  return {
    routeId: route.routeId,
    routeName: route.name,
    capacity,
    data,
  };
}

function getEstimatedPassengers(hour: number, capacity: number): number {
  // Morning peak: 7-9
  if (hour >= 7 && hour <= 9) return Math.round(capacity * (1.8 + Math.random() * 0.4));
  // Evening peak: 17-19
  if (hour >= 17 && hour <= 19) return Math.round(capacity * (1.6 + Math.random() * 0.4));
  // Lunch: 12-14
  if (hour >= 12 && hour <= 14) return Math.round(capacity * (1.2 + Math.random() * 0.2));
  // Off-peak
  return Math.round(capacity * (0.5 + Math.random() * 0.3));
}

// ============ ROUTE CRUD ============

/**
 * Create a new route
 */
export async function createRoute(data: {
  name: string;
  farePerKm: number;
  stops: Array<{ name: string; lat: number; lng: number; sequence: number }>;
}) {
  const routeId = `R-${Date.now().toString(36).toUpperCase()}`;
  
  const route = new Route({
    routeId,
    name: data.name,
    farePerKm: data.farePerKm || 2.5,
    status: 'active',
    stops: data.stops,
  });
  
  await route.save();
  
  return {
    route_id: route.routeId,
    name: route.name,
    fare_per_km: route.farePerKm,
    status: route.status,
    stops: route.stops,
  };
}

/**
 * Update an existing route
 */
export async function updateRoute(routeId: string, data: {
  name?: string;
  farePerKm?: number;
  status?: string;
  stops?: Array<{ name: string; lat: number; lng: number; sequence: number }>;
}) {
  const route = await Route.findOneAndUpdate(
    { routeId },
    { $set: data },
    { new: true }
  ).lean();
  
  if (!route) return null;
  
  return {
    route_id: route.routeId,
    name: route.name,
    fare_per_km: route.farePerKm,
    status: route.status,
    stops: route.stops,
  };
}

/**
 * Delete a route
 */
export async function deleteRoute(routeId: string) {
  // Check if route has active or scheduled trips
  const activeTrips = await Trip.findOne({
    routeId: routeId,
    status: { $in: ['scheduled', 'active'] }
  }).lean();

  if (activeTrips) {
    throw new Error('Cannot delete route with active or scheduled trips');
  }

  const result = await Route.deleteOne({ routeId });
  return result.deletedCount > 0;
}

// ============ BUS CRUD ============

/**
 * Get all buses from Bus model (enhanced)
 */
export async function getFleetBusesEnhanced() {
  // Try to get from Bus model first
  let buses = await Bus.find().lean();
  
  // If no buses in Bus model, fallback to Device-based lookup
  if (buses.length === 0) {
    const devices = await Device.find({ busId: { $ne: null } }).lean();
    const capacities = await BusCapacity.find().lean();
    const capacityMap = new Map(capacities.map(bc => [bc.busId, bc.capacity]));
    
    return devices.map(device => ({
      bus_id: device.busId,
      registration_no: device.busId,
      type: 'Standard Non-AC',
      capacity: capacityMap.get(device.busId!) || 50,
      status: device.status,
      last_seen: device.lastSeen,
    }));
  }
  
  return buses.map(bus => ({
    bus_id: bus.busId,
    registration_no: bus.registrationNo,
    type: bus.type,
    capacity: bus.capacity,
    status: bus.status,
    last_seen: bus.lastSeen,
  }));
}

/**
 * Create a new bus
 */
export async function createBus(data: {
  bus_id: string;
  type: string;
  capacity: number;
  status?: string;
}) {
  const bus = new Bus({
    busId: data.bus_id,
    registrationNo: data.bus_id,
    type: data.type,
    capacity: data.capacity,
    status: data.status || 'active',
  });
  
  await bus.save();
  
  // Also create BusCapacity entry for compatibility
  await BusCapacity.findOneAndUpdate(
    { busId: data.bus_id },
    { busId: data.bus_id, capacity: data.capacity },
    { upsert: true }
  );
  
  return {
    bus_id: bus.busId,
    registration_no: bus.registrationNo,
    type: bus.type,
    capacity: bus.capacity,
    status: bus.status,
    last_seen: bus.lastSeen,
  };
}

/**
 * Update a bus
 */
export async function updateBus(busId: string, data: {
  type?: string;
  capacity?: number;
  status?: string;
}) {
  const bus = await Bus.findOneAndUpdate(
    { busId },
    { $set: data },
    { new: true, upsert: true }
  ).lean();
  
  if (!bus) return null;
  
  // Update BusCapacity if capacity changed
  if (data.capacity) {
    await BusCapacity.findOneAndUpdate(
      { busId },
      { capacity: data.capacity },
      { upsert: true }
    );
  }
  
  return {
    bus_id: bus.busId,
    registration_no: bus.registrationNo,
    type: bus.type,
    capacity: bus.capacity,
    status: bus.status,
    last_seen: bus.lastSeen,
  };
}

/**
 * Delete a bus
 */
export async function deleteBus(busId: string) {
  const result = await Bus.deleteOne({ busId });
  await BusCapacity.deleteOne({ busId });
  return result.deletedCount > 0;
}

/**
 * Assign crew to bus
 */
export async function assignCrewToBus(busId: string, driverId: string | null, conductorId: string | null) {
  // 1. Clear previous assignments for this bus
  if (busId) {
    await Driver.updateMany({ currentBusId: busId }, { $set: { currentBusId: null } });
    await Conductor.updateMany({ currentBusId: busId }, { $set: { currentBusId: null } });
  }

  // 2. Assign new driver
  if (driverId) {
    // Clear driver's previous bus
    await Driver.updateOne({ driverId }, { $set: { currentBusId: null } });
    // Assign to new bus
    await Driver.updateOne({ driverId }, { $set: { currentBusId: busId } });
  }

  // 3. Assign new conductor
  if (conductorId) {
    // Clear conductor's previous bus
    await Conductor.updateOne({ conductorId }, { $set: { currentBusId: null } });
    // Assign to new bus
    await Conductor.updateOne({ conductorId }, { $set: { currentBusId: busId } });
  }

  return { success: true };
}

// ============ DRIVER CRUD ============

/**
 * Get all drivers (enhanced with proper model)
 */
export async function getFleetDriversEnhanced() {
  // Try Driver model first
  let drivers = await Driver.find().lean();
  
  if (drivers.length > 0) {
    // Get active trips to check current assignments
    const activeTrips = await Trip.find({ status: 'active' }).lean();
    const tripMap = new Map(activeTrips.map(t => [t.driverId, t.busId]));
    
    return drivers.map(driver => ({
      driver_id: driver.driverId,
      name: driver.name,
      phone: driver.phone,
      license_no: driver.licenseNo,
      status: driver.status === 'active' ? 'On Duty' : 'Off Duty',
      current_bus: tripMap.get(driver.driverId) || driver.currentBusId || null,
    }));
  }
  
  // Fallback to trip-based lookup
  return getFleetDrivers();
}

/**
 * Create a new driver
 */
export async function createDriver(data: {
  name: string;
  phone: string;
  license_no: string;
}) {
  const driverId = `DRV-${Date.now().toString(36).toUpperCase()}`;
  
  const driver = new Driver({
    driverId,
    name: data.name,
    phone: data.phone,
    licenseNo: data.license_no,
    status: 'active',
  });
  
  await driver.save();
  
  return {
    driver_id: driver.driverId,
    name: driver.name,
    phone: driver.phone,
    license_no: driver.licenseNo,
    status: 'On Duty',
    current_bus: null,
  };
}

/**
 * Update a driver
 */
export async function updateDriver(driverId: string, data: {
  name?: string;
  phone?: string;
  license_no?: string;
  status?: string;
}) {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;
  if (data.license_no) updateData.licenseNo = data.license_no;
  if (data.status) updateData.status = data.status;
  
  const driver = await Driver.findOneAndUpdate(
    { driverId },
    { $set: updateData },
    { new: true, upsert: true }
  ).lean();
  
  if (!driver) return null;
  
  return {
    driver_id: driver.driverId,
    name: driver.name,
    phone: driver.phone,
    license_no: driver.licenseNo,
    status: driver.status === 'active' ? 'On Duty' : 'Off Duty',
    current_bus: driver.currentBusId,
  };
}

/**
 * Delete a driver
 */
export async function deleteDriver(driverId: string) {
  const result = await Driver.deleteOne({ driverId });
  return result.deletedCount > 0;
}

// ============ CONDUCTOR CRUD ============

/**
 * Get all conductors (enhanced with proper model)
 */
export async function getFleetConductorsEnhanced() {
  // Try Conductor model first
  let conductors = await Conductor.find().lean();
  
  if (conductors.length > 0) {
    // Get active trips to check current assignments
    const activeTrips = await Trip.find({ status: 'active' }).lean();
    const tripMap = new Map(activeTrips.map(t => [t.conductorId, t.busId]));
    
    return conductors.map(conductor => ({
      conductor_id: conductor.conductorId,
      name: conductor.name,
      phone: conductor.phone,
      license_no: conductor.licenseNo,
      status: conductor.status === 'active' ? 'On Duty' : 'Off Duty',
      current_bus: tripMap.get(conductor.conductorId) || conductor.currentBusId || null,
    }));
  }
  
  // Fallback to trip-based lookup
  return getFleetConductors();
}

/**
 * Create a new conductor
 */
export async function createConductor(data: {
  name: string;
  phone: string;
  license_no: string;
}) {
  const conductorId = `CON-${Date.now().toString(36).toUpperCase()}`;
  
  const conductor = new Conductor({
    conductorId,
    name: data.name,
    phone: data.phone,
    licenseNo: data.license_no,
    status: 'active',
  });
  
  await conductor.save();
  
  return {
    conductor_id: conductor.conductorId,
    name: conductor.name,
    phone: conductor.phone,
    license_no: conductor.licenseNo,
    status: 'On Duty',
    current_bus: null,
  };
}

/**
 * Update a conductor
 */
export async function updateConductor(conductorId: string, data: {
  name?: string;
  phone?: string;
  license_no?: string;
  status?: string;
}) {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;
  if (data.license_no) updateData.licenseNo = data.license_no;
  if (data.status) updateData.status = data.status;
  
  const conductor = await Conductor.findOneAndUpdate(
    { conductorId },
    { $set: updateData },
    { new: true, upsert: true }
  ).lean();
  
  if (!conductor) return null;
  
  return {
    conductor_id: conductor.conductorId,
    name: conductor.name,
    phone: conductor.phone,
    license_no: conductor.licenseNo,
    status: conductor.status === 'active' ? 'On Duty' : 'Off Duty',
    current_bus: conductor.currentBusId,
  };
}

/**
 * Delete a conductor
 */
export async function deleteConductor(conductorId: string) {
  const result = await Conductor.deleteOne({ conductorId });
  return result.deletedCount > 0;
}

interface RouteInput {
  routeId: string;
  name: string;
  farePerKm: number;
  status?: string;
  stops?: Array<{
    name: string;
    lat: number;
    lng: number;
    sequence: number;
  }>;
}

/**
 * Get route performance analytics
 */
export async function getRoutePerformance(period: string = 'daily') {
  // Get all routes
  const routes = await Route.find().lean();

  const routePerformance = await Promise.all(routes.map(async route => {
    // For simplicity, we'll aggregate data for the last 30 days for 'daily' performance
    // In a real app, 'period' would dictate the date range for filtering trips and tickets
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trips = await Trip.find({
      routeId: route.routeId,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo } // Assuming createdAt is a good proxy for trip date
    }).lean();

    let totalPassengers = 0;
    let totalRevenue = 0;
    let totalDuration = 0; // In minutes
    let tripCount = trips.length;

    for (const trip of trips) {
      const tickets = await Ticket.find({ tripId: trip.tripId }).lean();
      totalPassengers += tickets.length;
      totalRevenue += tickets.reduce((sum, t) => sum + t.fareAmount, 0);
      // Placeholder for trip duration. In a real system, trip model would have start/end times.
      totalDuration += 60; // Assuming average 60 mins per trip
    }

    const avgDuration = tripCount > 0 ? totalDuration / tripCount : 0;
    const defaultBusCapacity = 50; // Assuming a default bus capacity
    const efficiency = tripCount > 0 ? Math.min(100, (totalPassengers / (tripCount * defaultBusCapacity)) * 100) : 0;

    return {
      route_id: route.routeId,
      name: route.name,
      stops_count: Array.isArray(route.stops) ? route.stops.length : 0,
      status: route.status,
      performance: {
        daily_passengers: totalPassengers,
        daily_trips: tripCount,
        revenue: Math.round(totalRevenue * 100) / 100,
        efficiency: Math.round(efficiency),
        on_time_percentage: Math.round(85 + Math.random() * 15), // Still simulated as we lack real-time vs scheduled data in db
        avg_trip_duration_mins: Math.round(avgDuration)
      },
      daily_passengers: totalPassengers, // Top level for frontend compatibility
    };
  }));

  return routePerformance;
}

/**
 * Get route schedule
 */
export async function getRouteSchedule(routeId: string) {
  const trips = await Trip.find({ 
    routeId,
    status: { $in: ['scheduled', 'active', 'completed'] }
  })
  .sort({ plannedStartTime: 1 }) // Sort by start time ascending
  .limit(50) // Limit to 50 for now
  .lean();

  return trips.map(trip => ({
    trip_id: trip.tripId,
    start_time: trip.plannedStartTime || trip.actualStartTime,
    end_time: trip.actualEndTime,
    status: trip.status,
    bus_id: trip.busId || 'Unassigned',
    driver_id: trip.driverId || 'Unassigned',
  }));
}

/**
 * Bulk create routes from CSV data with batching
 */
export async function bulkCreateRoutes(
  routesData: RouteInput[],
  batchSize: number = 100
): Promise<{
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ routeId: string; error: string }>;
}> {
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as Array<{ routeId: string; error: string }>,
  };

  // Process in batches
  for (let i = 0; i < routesData.length; i += batchSize) {
    const batch = routesData.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (routeData) => {
        try {
          const existingRoute = await Route.findOne({ routeId: routeData.routeId });

          if (existingRoute) {
            // Update existing route
            await Route.updateOne(
              { routeId: routeData.routeId },
              {
                $set: {
                  name: routeData.name,
                  farePerKm: routeData.farePerKm,
                  status: routeData.status || 'active',
                  ...(routeData.stops && { stops: routeData.stops }),
                },
              }
            );
            results.updated++;
          } else {
            // Create new route
            await Route.create({
              routeId: routeData.routeId,
              name: routeData.name,
              farePerKm: routeData.farePerKm,
              status: routeData.status || 'active',
              stops: routeData.stops || [],
            });
            results.created++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            routeId: routeData.routeId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );
  }

  return results;
}
