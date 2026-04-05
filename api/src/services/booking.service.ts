import { nanoid } from 'nanoid';
import { UserBooking, Route } from '../models';
import { generateBookingQR, verifyBookingQR } from './qr.service';
import { BookingInput } from '../types';

/**
 * Create a new booking with 12:01 AM constraint
 */
export async function createBooking(userId: string, data: BookingInput) {
  const now = new Date();
  
  // Parse journey date
  const journeyDate = new Date(`${data.journey_date}T00:00:00`);
  
  // Booking opens at 12:01 AM on the journey date
  const bookingOpenTime = new Date(journeyDate);
  bookingOpenTime.setHours(0, 1, 0, 0); // 12:01 AM
  
  // Check if we're past booking window (after journey date ended)
  const journeyEndTime = new Date(journeyDate);
  journeyEndTime.setHours(23, 59, 59, 999);
  
  if (now > journeyEndTime) {
    throw new Error('Cannot book for past date');
  }
  
  // Check if booking window has opened
  // For same-day booking: must be after 12:01 AM
  // For future dates: booking opens at 12:01 AM of that day
  const isSameDay = now.toDateString() === journeyDate.toDateString();
  
  if (!isSameDay) {
    // Future date - need to wait until 12:01 AM of journey date
    if (now < bookingOpenTime) {
      const formattedDate = journeyDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      throw new Error(`Booking for ${formattedDate} opens at 12:01 AM on that day`);
    }
  }
  
  // Validate route exists
  const route = await Route.findOne({ routeId: data.route_id, status: 'active' });
  if (!route) {
    throw new Error('Route not found');
  }
  
  // Validate stops exist on route
  const boardingStopExists = route.stops.some(s => s.name === data.boarding_stop);
  const destinationStopExists = route.stops.some(s => s.name === data.destination_stop);
  
  if (!boardingStopExists) {
    throw new Error('Boarding stop not found on this route');
  }
  if (!destinationStopExists) {
    throw new Error('Destination stop not found on this route');
  }
  
  // Validate boarding comes before destination
  const boardingIdx = route.stops.findIndex(s => s.name === data.boarding_stop);
  const destIdx = route.stops.findIndex(s => s.name === data.destination_stop);
  
  if (boardingIdx >= destIdx) {
    throw new Error('Boarding stop must come before destination stop');
  }
  
  // Calculate fare based on distance
  const stopsCount = destIdx - boardingIdx;
  const farePerStop = route.farePerKm * 2; // Approximate 2km per stop
  const baseFare = Math.max(farePerStop * stopsCount, 10); // Minimum 10 INR
  const totalFare = baseFare * data.passenger_count;
  
  // Create booking
  const bookingId = `BKG_${nanoid(12)}`;
  
  const booking = new UserBooking({
    bookingId,
    userId,
    routeId: data.route_id,
    boardingStop: data.boarding_stop,
    destinationStop: data.destination_stop,
    journeyDate,
    passengerCount: data.passenger_count,
    passengerType: data.passenger_type,
    fareAmount: Math.round(totalFare * 100) / 100,
    paymentMode: data.payment_mode || null,
    paymentStatus: 'pending',
    status: 'confirmed',
  });
  
  // Generate QR code
  const { qrData, qrImage } = await generateBookingQR(bookingId);
  booking.qrData = qrData;
  booking.qrCode = qrImage;
  
  await booking.save();
  
  return {
    booking_id: booking.bookingId,
    route_id: booking.routeId,
    boarding_stop: booking.boardingStop,
    destination_stop: booking.destinationStop,
    journey_date: booking.journeyDate.toISOString().split('T')[0],
    passenger_count: booking.passengerCount,
    passenger_type: booking.passengerType,
    fare_amount: booking.fareAmount,
    status: booking.status,
    qr_code: booking.qrCode,
  };
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: string, userId?: string) {
  const query: any = { bookingId };
  if (userId) query.userId = userId;
  
  const booking = await UserBooking.findOne(query).lean();
  
  if (!booking) {
    return null;
  }
  
  return {
    booking_id: booking.bookingId,
    route_id: booking.routeId,
    boarding_stop: booking.boardingStop,
    destination_stop: booking.destinationStop,
    journey_date: booking.journeyDate.toISOString().split('T')[0],
    passenger_count: booking.passengerCount,
    passenger_type: booking.passengerType,
    fare_amount: booking.fareAmount,
    status: booking.status,
    payment_status: booking.paymentStatus,
    qr_code: booking.qrCode,
    created_at: booking.createdAt,
  };
}

/**
 * Get user's bookings
 */
export async function getUserBookings(userId: string) {
  const bookings = await UserBooking.find({ userId })
    .sort({ journeyDate: -1 })
    .lean();
  
  return bookings.map(b => ({
    booking_id: b.bookingId,
    route_id: b.routeId,
    boarding_stop: b.boardingStop,
    destination_stop: b.destinationStop,
    journey_date: b.journeyDate.toISOString().split('T')[0],
    passenger_count: b.passengerCount,
    fare_amount: b.fareAmount,
    status: b.status,
    created_at: b.createdAt,
  }));
}

/**
 * Verify booking QR code (for conductors)
 */
export async function verifyBookingFromQR(qrData: string) {
  const verification = verifyBookingQR(qrData);
  
  if (!verification.valid || !verification.bookingId) {
    return {
      valid: false,
      error: verification.error || 'Invalid QR code',
    };
  }
  
  const booking = await UserBooking.findOne({ bookingId: verification.bookingId }).lean();
  
  if (!booking) {
    return {
      valid: false,
      error: 'Booking not found',
    };
  }
  
  // Check if booking is for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const journeyDate = new Date(booking.journeyDate);
  journeyDate.setHours(0, 0, 0, 0);
  
  if (journeyDate.getTime() !== today.getTime()) {
    return {
      valid: false,
      error: 'Booking is not for today',
      booking_date: booking.journeyDate.toISOString().split('T')[0],
    };
  }
  
  // Check booking status
  if (booking.status === 'used') {
    return {
      valid: false,
      error: 'Ticket already used',
    };
  }
  
  if (booking.status === 'cancelled') {
    return {
      valid: false,
      error: 'Booking cancelled',
    };
  }
  
  // Mark booking as used
  await UserBooking.updateOne(
    { bookingId: verification.bookingId },
    { status: 'used', updatedAt: new Date() }
  );
  
  return {
    valid: true,
    booking: {
      booking_id: booking.bookingId,
      route_id: booking.routeId,
      boarding_stop: booking.boardingStop,
      destination_stop: booking.destinationStop,
      passenger_count: booking.passengerCount,
      passenger_type: booking.passengerType,
      fare_amount: booking.fareAmount,
    },
  };
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await UserBooking.findOne({ bookingId, userId });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  if (booking.status === 'used') {
    throw new Error('Cannot cancel used ticket');
  }
  
  if (booking.status === 'cancelled') {
    throw new Error('Booking already cancelled');
  }
  
  booking.status = 'cancelled';
  booking.updatedAt = new Date();
  await booking.save();
  
  return {
    booking_id: booking.bookingId,
    status: 'cancelled',
    message: 'Booking cancelled successfully',
  };
}
