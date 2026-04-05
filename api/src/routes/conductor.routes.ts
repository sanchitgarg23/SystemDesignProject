import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateConductor } from '../middleware/auth';
import {
  loginConductor,
  getActiveTrip,
  createConductorTicket,
  syncOfflineTickets,
} from '../services/conductor.service';
import { getTripTickets } from '../services/query.service';
import { verifyBookingFromQR } from '../services/booking.service';
import { QRVerifySchema } from '../types';

const router = Router();

/**
 * POST /auth/login - Conductor login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      device_id: z.string(),
      conductor_id: z.string(),
    });

    const { device_id, conductor_id } = schema.parse(req.body);
    const result = await loginConductor(device_id, conductor_id);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: error.errors,
      });
    }

    if (error.message === 'Invalid or inactive device') {
      return res.status(401).json({ code: 'INVALID_DEVICE', message: error.message });
    }

    console.error('Conductor login error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

/**
 * GET /trip/active - Get active trip
 */
router.get('/trip/active', authenticateConductor, async (req: Request, res: Response) => {
  try {
    const deviceId = req.device?.device_id;

    if (!deviceId) {
      return res.status(400).json({ code: 'MISSING_DEVICE_ID', message: 'Device ID not found in token' });
    }

    const trip = await getActiveTrip(deviceId);

    if (!trip) {
      return res.status(404).json({ code: 'NO_ACTIVE_TRIP', message: 'No active trip found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Get active trip error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch active trip' });
  }
});

/**
 * POST /ticket - Create ticket
 */
router.post('/ticket', authenticateConductor, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      boarding_stop: z.string(),
      destination_stop: z.string(),
      fare_amount: z.number().positive(),
      payment_mode: z.enum(['cash', 'card', 'upi', 'pass']),
      passenger_type: z.enum(['adult', 'student', 'senior', 'pass']).optional(),
    });

    const ticketData = schema.parse(req.body);
    const deviceId = req.device?.device_id;

    if (!deviceId) {
      return res.status(400).json({ code: 'MISSING_DEVICE_ID', message: 'Device ID not found in token' });
    }

    const ticket = await createConductorTicket(deviceId, ticketData);
    res.status(201).json(ticket);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: error.errors,
      });
    }

    if (error.message === 'No active trip found') {
      return res.status(400).json({ code: 'NO_ACTIVE_TRIP', message: error.message });
    }

    console.error('Create conductor ticket error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create ticket' });
  }
});

/**
 * POST /offline-sync - Sync offline tickets
 */
router.post('/offline-sync', authenticateConductor, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      tickets: z.array(
        z.object({
          ticket_id: z.string(),
          boarding_stop: z.string(),
          destination_stop: z.string(),
          fare_amount: z.number().positive(),
          payment_mode: z.string(),
          passenger_type: z.string().optional(),
          issued_at: z.string(),
        })
      ),
    });

    const { tickets } = schema.parse(req.body);
    const deviceId = req.device?.device_id;

    if (!deviceId) {
      return res.status(400).json({ code: 'MISSING_DEVICE_ID', message: 'Device ID not found in token' });
    }

    const result = await syncOfflineTickets(deviceId, tickets);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: error.errors,
      });
    }
    console.error('Offline sync error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to sync offline tickets' });
  }
});

/**
 * GET /trip/tickets - Get tickets for current trip
 */
router.get('/trip/tickets', authenticateConductor, async (req: Request, res: Response) => {
  try {
    const deviceId = req.device?.device_id;

    if (!deviceId) {
      return res.status(400).json({ code: 'MISSING_DEVICE_ID', message: 'Device ID not found in token' });
    }

    const activeTrip = await getActiveTrip(deviceId);

    if (!activeTrip) {
      return res.status(404).json({ code: 'NO_ACTIVE_TRIP', message: 'No active trip found' });
    }

    const data = await getTripTickets(activeTrip.trip_id);
    res.json(data);
  } catch (error) {
    console.error('Get trip tickets error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch trip tickets' });
  }
});

/**
 * POST /verify-qr - Verify booking QR code
 */
router.post('/verify-qr', authenticateConductor, async (req: Request, res: Response) => {
  try {
    const { qr_data } = QRVerifySchema.parse(req.body);

    const result = await verifyBookingFromQR(qr_data);

    if (!result.valid) {
      return res.status(400).json({
        code: 'INVALID_QR',
        message: result.error,
        ...(result.booking_date && { booking_date: result.booking_date }),
      });
    }

    res.json({
      valid: true,
      message: 'Ticket verified successfully',
      booking: result.booking,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: error.errors,
      });
    }
    console.error('Verify QR error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to verify QR code' });
  }
});

export default router;
