import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateAppUser } from '../middleware/auth';
import {
  loginUser,
  getAllStops,
  searchRoutes,
  searchRoutesByStops,
  getRouteLiveBusesWithLoad,
  getBusTrackingData,
  getAllLiveBuses,
} from '../services/app.service';
import {
  createBooking,
  getBookingById,
  getUserBookings,
  cancelBooking,
} from '../services/booking.service';
import { BookingSchema } from '../types';

const router = Router();

/**
 * POST /auth/login - User login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ mobile: z.string().min(10).max(15) });
    const { mobile } = schema.parse(req.body);

    const result = await loginUser(mobile);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: error.errors,
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

/**
 * GET /stops - Get all stops
 */
router.get('/stops', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const stops = await getAllStops();
    res.json({ stops });
  } catch (error) {
    console.error('Get stops error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch stops' });
  }
});

/**
 * GET /routes/search - Search routes
 */
router.get('/routes/search', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;

    if (!query) {
      return res.status(400).json({ code: 'MISSING_QUERY', message: 'query parameter is required' });
    }

    const results = await searchRoutes(query);
    res.json({ query, results });
  } catch (error) {
    console.error('Route search error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Search failed' });
  }
});

/**
 * GET /routes/search-by-stops - Search by source/destination
 */
router.get('/routes/search-by-stops', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const destination = req.query.destination as string;

    if (!source || !destination) {
      return res.status(400).json({
        code: 'MISSING_PARAMS',
        message: 'source and destination parameters are required',
      });
    }

    const results = await searchRoutesByStops(source, destination);
    res.json({ source, destination, results });
  } catch (error) {
    console.error('Route search by stops error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Search failed' });
  }
});

/**
 * GET /routes/:route_id/live-buses - Live buses on route
 */
router.get('/routes/:route_id/live-buses', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const { route_id } = req.params;
    const data = await getRouteLiveBusesWithLoad(route_id);
    res.json(data);
  } catch (error) {
    console.error('Get route live buses error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch live buses' });
  }
});

/**
 * GET /bus/:bus_id/track - Track specific bus
 */
router.get('/bus/:bus_id/track', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const { bus_id } = req.params;
    const data = await getBusTrackingData(bus_id);

    if (!data) {
      return res.status(404).json({ code: 'BUS_NOT_FOUND', message: 'No tracking data found for this bus' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get bus tracking error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch bus tracking data' });
  }
});

/**
 * GET /buses/live - All live buses
 */
router.get('/buses/live', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const buses = await getAllLiveBuses();
    res.json({ buses, count: buses.length });
  } catch (error) {
    console.error('Get all live buses error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch live buses' });
  }
});

// ============ Booking Endpoints ============

/**
 * POST /booking - Create booking (12:01 AM constraint)
 */
router.post('/booking', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const data = BookingSchema.parse(req.body);
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID not found' });
    }

    const booking = await createBooking(userId, data);
    res.status(201).json(booking);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: error.errors,
      });
    }

    // Handle booking constraint errors
    if (error.message.includes('opens at 12:01 AM') || 
        error.message.includes('Cannot book') ||
        error.message.includes('not found')) {
      return res.status(400).json({ code: 'BOOKING_ERROR', message: error.message });
    }

    console.error('Create booking error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create booking' });
  }
});

/**
 * GET /booking/:id - Get booking details
 */
router.get('/booking/:id', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;

    const booking = await getBookingById(id, userId);

    if (!booking) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch booking' });
  }
});

/**
 * GET /bookings - User's bookings
 */
router.get('/bookings', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID not found' });
    }

    const bookings = await getUserBookings(userId);
    res.json({ bookings, count: bookings.length });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' });
  }
});

/**
 * DELETE /booking/:id - Cancel booking
 */
router.delete('/booking/:id', authenticateAppUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID not found' });
    }

    const result = await cancelBooking(id, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('Cannot cancel')) {
      return res.status(400).json({ code: 'CANCEL_ERROR', message: error.message });
    }
    console.error('Cancel booking error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to cancel booking' });
  }
});

export default router;
