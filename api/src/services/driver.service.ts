import { nanoid } from 'nanoid';
import { Device, Trip } from '../models';

/**
 * DriverService — Driver Operations
 * 
 * Handles driver-facing operations including login and active trip lookup.
 * 
 * Design Pattern: Facade
 * - Simplifies device validation and trip association for driver workflows.
 */
export class DriverService {
  /**
   * Driver login
   */
  public static async loginDriver(deviceId: string, driverId: string) {
    const device = await Device.findOne({ deviceId });

    if (!device || device.status !== 'active') {
      throw new Error('Invalid or inactive device');
    }

    // Find active trip
    const activeTrip = await Trip.findOne({ deviceId, status: 'active' }).lean();

    // Generate JWT-like token
    const token = `DRIVER_${deviceId}_${driverId}_${Date.now()}`;

    return {
      device_id: deviceId,
      driver_id: driverId,
      bus_id: device.busId,
      api_key: device.apiKey, // For ingest endpoints
      token, // For authenticated requests
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
   * Get active trip for driver
   */
  public static async getDriverActiveTrip(deviceId: string) {
    const trip = await Trip.findOne({ deviceId, status: 'active' }).lean();

    if (!trip) return null;

    return {
      trip_id: trip.tripId,
      bus_id: trip.busId,
      route_id: trip.routeId,
      driver_id: trip.driverId,
      start_time: trip.actualStartTime?.toISOString(),
      status: trip.status,
    };
  }
}

// Backward-compatible named exports
export const loginDriver = DriverService.loginDriver;
export const getDriverActiveTrip = DriverService.getDriverActiveTrip;
