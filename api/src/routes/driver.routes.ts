import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { loginDriver, getDriverActiveTrip } from '../services/driver.service';

const router = Router();

/**
 * POST /auth/login - Driver login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      device_id: z.string(),
      driver_id: z.string(),
    });

    const { device_id, driver_id } = schema.parse(req.body);
    const result = await loginDriver(device_id, driver_id);
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

    console.error('Driver login error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

/**
 * GET /trip/active - Get active trip for driver
 * Note: Uses X-Device-Key header for authentication
 */
router.get('/trip/active', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-device-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        code: 'MISSING_KEY',
        message: 'X-Device-Key header is required',
      });
    }

    // Extract device ID from DRIVER token
    if (!apiKey.startsWith('DRIVER_')) {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid driver token',
      });
    }

    const parts = apiKey.split('_');
    if (parts.length < 3) {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid token format',
      });
    }

    const deviceId = parts[1];
    const trip = await getDriverActiveTrip(deviceId);

    if (!trip) {
      return res.status(404).json({ code: 'NO_ACTIVE_TRIP', message: 'No active trip found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Get driver active trip error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch active trip' });
  }
});

export default router;
