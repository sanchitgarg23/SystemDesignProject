import { BusCapacity, Ticket } from '../models';

/**
 * Calculate passenger load percentage for a bus
 */
export async function calculatePassengerLoad(busId: string, tripId?: string): Promise<number> {
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
export function getLoadCategory(loadPct: number): 'low' | 'medium' | 'high' {
  if (loadPct < 40) return 'low';
  if (loadPct < 70) return 'medium';
  return 'high';
}

/**
 * Calculate ETA in minutes between two points given current speed
 */
export function calculateETA(
  currentLat: number,
  currentLng: number,
  destLat: number,
  destLng: number,
  speedKmph: number
): number {
  if (speedKmph <= 0) return 0;

  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destLat - currentLat);
  const dLng = toRad(destLng - currentLng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(currentLat)) * Math.cos(toRad(destLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  // Calculate time in minutes
  const timeHours = distance / speedKmph;
  const timeMinutes = timeHours * 60;

  return Math.round(timeMinutes);
}

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Find closest stop index given current position
 */
export function findClosestStop(
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
