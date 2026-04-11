import { Route, Ticket, Trip, Heartbeat, Device, BusCapacity, UserBooking, Driver, Conductor, Bus, AdminUser } from '../models';
import { PassengerLoadService } from './passenger-load.service';

/**
 * AdminService — Admin Dashboard Business Logic (Facade)
 * 
 * The primary Facade in the system. Provides a greatly simplified
 * interface to complex subsystems: MongoDB aggregation pipelines,
 * cross-collection joins, date math, and fleet management.
 * 
 * Design Pattern: Facade
 * - Controllers call simple methods like AdminService.getRealtimeAnalytics()
 * - Behind the scenes, this class orchestrates queries across 6+ collections,
 *   performs aggregations, and returns clean, formatted objects.
 * 
 * OOP Concept: Abstraction + Encapsulation
 * - Complex query logic is hidden from controllers
 * - Business rules (e.g., "cannot delete route with active trips") are
 *   encapsulated here, not scattered across route handlers
 */
export class AdminService {
  // ============ ROUTES ============

  /**
   * Get all routes with stops
   */
  public static async getAllRoutes() {
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

  // ============ ANALYTICS ============

  /**
   * Get realtime analytics
   */
  public static async getRealtimeAnalytics() {
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
      const loadPct = await PassengerLoadService.calculatePassengerLoad(h._id, h.lastHb.tripId);
      const category = PassengerLoadService.getLoadCategory(loadPct);
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
  public static async getRevenueAnalytics(date: string) {
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
  public static async getTicketAnalytics(filters: {
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
        unique_seats_occupied: totalTickets
      },
      buses,
    };
  }

  // ============ DEVICE HEALTH ============

  /**
   * Get device health
   */
  public static async getDeviceHealth() {
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

  // ============ FLEET MANAGEMENT ============

  /**
   * Get fleet buses
   */
  public static async getFleetBuses() {
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
  public static async getFleetDrivers() {
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
  public static async getFleetConductors() {
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
  public static async getAllBookings(filters?: { status?: string; date?: string }) {
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
  public static async adminLogin(email: string, password: string) {
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
  public static async getBusTrackingData(busId: string) {
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
    const loadPct = await PassengerLoadService.calculatePassengerLoad(busId, trip?.tripId || '');

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
  public static async getDemandAnalysis(routeId: string) {
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

    const capacity = 50;

    const data = timeSlots.map(time => {
      const hour = parseInt(time.split(':')[0]);

      const slotTickets = tickets.filter(t => {
        const ticketHour = new Date(t.issuedAt).getHours();
        return ticketHour === hour;
      });

      let passengers = slotTickets.length > 0
        ? Math.round(slotTickets.length / 30)
        : AdminService.getEstimatedPassengers(hour, capacity);

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

  /**
   * Estimate passengers for a given hour (private helper)
   */
  private static getEstimatedPassengers(hour: number, capacity: number): number {
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
  public static async createRoute(data: {
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
  public static async updateRoute(routeId: string, data: {
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
  public static async deleteRoute(routeId: string) {
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
  public static async getFleetBusesEnhanced() {
    let buses = await Bus.find().lean();

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
  public static async createBus(data: {
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
  public static async updateBus(busId: string, data: {
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
  public static async deleteBus(busId: string) {
    const result = await Bus.deleteOne({ busId });
    await BusCapacity.deleteOne({ busId });
    return result.deletedCount > 0;
  }

  /**
   * Assign crew to bus
   */
  public static async assignCrewToBus(busId: string, driverId: string | null, conductorId: string | null) {
    if (busId) {
      await Driver.updateMany({ currentBusId: busId }, { $set: { currentBusId: null } });
      await Conductor.updateMany({ currentBusId: busId }, { $set: { currentBusId: null } });
    }

    if (driverId) {
      await Driver.updateOne({ driverId }, { $set: { currentBusId: null } });
      await Driver.updateOne({ driverId }, { $set: { currentBusId: busId } });
    }

    if (conductorId) {
      await Conductor.updateOne({ conductorId }, { $set: { currentBusId: null } });
      await Conductor.updateOne({ conductorId }, { $set: { currentBusId: busId } });
    }

    return { success: true };
  }

  // ============ DRIVER CRUD ============

  /**
   * Get all drivers (enhanced with proper model)
   */
  public static async getFleetDriversEnhanced() {
    let drivers = await Driver.find().lean();

    if (drivers.length > 0) {
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

    return AdminService.getFleetDrivers();
  }

  /**
   * Create a new driver
   */
  public static async createDriver(data: {
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
  public static async updateDriver(driverId: string, data: {
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
  public static async deleteDriver(driverId: string) {
    const result = await Driver.deleteOne({ driverId });
    return result.deletedCount > 0;
  }

  // ============ CONDUCTOR CRUD ============

  /**
   * Get all conductors (enhanced with proper model)
   */
  public static async getFleetConductorsEnhanced() {
    let conductors = await Conductor.find().lean();

    if (conductors.length > 0) {
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

    return AdminService.getFleetConductors();
  }

  /**
   * Create a new conductor
   */
  public static async createConductor(data: {
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
  public static async updateConductor(conductorId: string, data: {
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
  public static async deleteConductor(conductorId: string) {
    const result = await Conductor.deleteOne({ conductorId });
    return result.deletedCount > 0;
  }

  // ============ ROUTE PERFORMANCE ============

  /**
   * Get route performance analytics
   */
  public static async getRoutePerformance(period: string = 'daily') {
    const routes = await Route.find().lean();

    const routePerformance = await Promise.all(routes.map(async route => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const trips = await Trip.find({
        routeId: route.routeId,
        status: 'completed',
        createdAt: { $gte: thirtyDaysAgo }
      }).lean();

      let totalPassengers = 0;
      let totalRevenue = 0;
      let totalDuration = 0;
      let tripCount = trips.length;

      for (const trip of trips) {
        const tickets = await Ticket.find({ tripId: trip.tripId }).lean();
        totalPassengers += tickets.length;
        totalRevenue += tickets.reduce((sum, t) => sum + t.fareAmount, 0);
        totalDuration += 60;
      }

      const avgDuration = tripCount > 0 ? totalDuration / tripCount : 0;
      const defaultBusCapacity = 50;
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
          on_time_percentage: Math.round(85 + Math.random() * 15),
          avg_trip_duration_mins: Math.round(avgDuration)
        },
        daily_passengers: totalPassengers,
      };
    }));

    return routePerformance;
  }

  /**
   * Get route schedule
   */
  public static async getRouteSchedule(routeId: string) {
    const trips = await Trip.find({
      routeId,
      status: { $in: ['scheduled', 'active', 'completed'] }
    })
    .sort({ plannedStartTime: 1 })
    .limit(50)
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
  public static async bulkCreateRoutes(
    routesData: Array<{
      routeId: string;
      name: string;
      farePerKm: number;
      status?: string;
      stops?: Array<{ name: string; lat: number; lng: number; sequence: number }>;
    }>,
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

    for (let i = 0; i < routesData.length; i += batchSize) {
      const batch = routesData.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (routeData) => {
          try {
            const existingRoute = await Route.findOne({ routeId: routeData.routeId });

            if (existingRoute) {
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
}

// Backward-compatible named exports
export const getAllRoutes = AdminService.getAllRoutes;
export const getRealtimeAnalytics = AdminService.getRealtimeAnalytics;
export const getRevenueAnalytics = AdminService.getRevenueAnalytics;
export const getTicketAnalytics = AdminService.getTicketAnalytics;
export const getDeviceHealth = AdminService.getDeviceHealth;
export const getFleetBuses = AdminService.getFleetBuses;
export const getFleetDrivers = AdminService.getFleetDrivers;
export const getFleetConductors = AdminService.getFleetConductors;
export const getAllBookings = AdminService.getAllBookings;
export const adminLogin = AdminService.adminLogin;
export const getBusTrackingData = AdminService.getBusTrackingData;
export const getDemandAnalysis = AdminService.getDemandAnalysis;
export const createRoute = AdminService.createRoute;
export const updateRoute = AdminService.updateRoute;
export const deleteRoute = AdminService.deleteRoute;
export const getFleetBusesEnhanced = AdminService.getFleetBusesEnhanced;
export const createBus = AdminService.createBus;
export const updateBus = AdminService.updateBus;
export const deleteBus = AdminService.deleteBus;
export const assignCrewToBus = AdminService.assignCrewToBus;
export const getFleetDriversEnhanced = AdminService.getFleetDriversEnhanced;
export const createDriver = AdminService.createDriver;
export const updateDriver = AdminService.updateDriver;
export const deleteDriver = AdminService.deleteDriver;
export const getFleetConductorsEnhanced = AdminService.getFleetConductorsEnhanced;
export const createConductor = AdminService.createConductor;
export const updateConductor = AdminService.updateConductor;
export const deleteConductor = AdminService.deleteConductor;
export const getRoutePerformance = AdminService.getRoutePerformance;
export const getRouteSchedule = AdminService.getRouteSchedule;
export const bulkCreateRoutes = AdminService.bulkCreateRoutes;
