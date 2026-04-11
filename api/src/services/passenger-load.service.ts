import { BusCapacity, Ticket } from '../models';

/**
 * PassengerLoadService — Passenger Load Estimation
 * 
 * Provides calculations for bus occupancy levels, ETAs, and
 * geospatial nearest-stop lookup.
 * 
 * Design Pattern: Facade
 * - Hides complex Haversine calculations and DB queries behind
 *   simple static method calls.
 * 
 * OOP Concept: Encapsulation
 * - Internal helper (toRad) is a private implementation detail
 */
export class PassengerLoadService {
  /**
   * Calculate passenger load percentage for a bus
   */
  public static async calculatePassengerLoad(busId: string, tripId?: string): Promise<number> {
    // Get bus capacity
    const busCapacity = await BusCapacity.findOne({ busId });
    const capacity = busCapacity?.capacity || 50; // Default 50 seats

    if (!tripId) {
      return 0;
    }

    // Count tickets for this trip (simplified - assumes each ticket = 1 passenger)
    const ticketCount = await Ticket.countDocuments({ tripId });

    // Calculate percentage
    const loadPct = Math.min((ticketCount / capacity) * 100, 100);

    return Math.round(loadPct);
  }

  /**
   * Get load category based on percentage
   */
  public static getLoadCategory(loadPct: number): 'low' | 'medium' | 'high' {
    if (loadPct < 40) return 'low';
    if (loadPct < 70) return 'medium';
    return 'high';
  }

  /**
   * Calculate ETA in minutes between two points given current speed.
   * Uses the Haversine formula for great-circle distance.
   */
  public static calculateETA(
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    speedKmph: number
  ): number {
    if (speedKmph <= 0) return 0;

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = PassengerLoadService.toRad(destLat - currentLat);
    const dLng = PassengerLoadService.toRad(destLng - currentLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(PassengerLoadService.toRad(currentLat)) * Math.cos(PassengerLoadService.toRad(destLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Calculate time in minutes
    const timeHours = distance / speedKmph;
    const timeMinutes = timeHours * 60;

    return Math.round(timeMinutes);
  }

  /**
   * Find closest stop index given current position.
   * Uses Euclidean distance approximation for nearby points.
   */
  public static findClosestStop(
    lat: number,
    lng: number,
    stops: Array<{ lat: number; lng: number }>
  ): number {
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const distance = Math.sqrt(
        Math.pow(lat - stop.lat, 2) + Math.pow(lng - stop.lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  /**
   * Convert degrees to radians (private helper)
   */
  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Backward-compatible named exports
export const calculatePassengerLoad = PassengerLoadService.calculatePassengerLoad;
export const getLoadCategory = PassengerLoadService.getLoadCategory;
export const calculateETA = PassengerLoadService.calculateETA;
export const findClosestStop = PassengerLoadService.findClosestStop;
