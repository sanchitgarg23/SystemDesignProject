import { Router, Request, Response } from 'express';
import { authenticateBearer } from '../middleware/auth';
import {
  getBusLiveData,
  getRouteLiveBuses,
  getTripTickets,
  getRevenueSummary,
} from '../services/query.service';

const router = Router();

/**
 * GET /bus/:bus_id/live - Live data for bus
 */
router.get('/bus/:bus_id/live', authenticateBearer, async (req: Request, res: Response) => {
  try {
    const { bus_id } = req.params;
    const data = await getBusLiveData(bus_id);

    if (!data) {
      return res.status(404).json({ code: 'BUS_NOT_FOUND', message: 'No data found for this bus' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get bus live data error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch bus data' });
  }
});

/**
 * GET /route/:route_id/live-buses - Live buses on route
 */
router.get('/route/:route_id/live-buses', authenticateBearer, async (req: Request, res: Response) => {
  try {
    const { route_id } = req.params;
    const data = await getRouteLiveBuses(route_id);
    res.json(data);
  } catch (error) {
    console.error('Get route live buses error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch route buses' });
  }
});

/**
 * GET /trip/:trip_id/tickets - Tickets for trip
 */
router.get('/trip/:trip_id/tickets', authenticateBearer, async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.params;
    const data = await getTripTickets(trip_id);

    if (!data) {
      return res.status(404).json({ code: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get trip tickets error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch trip tickets' });
  }
});

/**
 * GET /summary/revenue - Revenue summary for date
 */
router.get('/summary/revenue', authenticateBearer, async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;

    if (!date) {
      return res.status(400).json({
        code: 'MISSING_DATE',
        message: 'date query parameter is required (format: YYYY-MM-DD)',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        code: 'INVALID_DATE_FORMAT',
        message: 'date must be in format YYYY-MM-DD',
      });
    }

    const data = await getRevenueSummary(date);
    res.json(data);
  } catch (error) {
    console.error('Get revenue summary error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch revenue summary' });
  }
});

export default router;
