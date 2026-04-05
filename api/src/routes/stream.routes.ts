import { Router, Request, Response } from 'express';
import { authenticateBearer } from '../middleware/auth';
import { Heartbeat } from '../models';

const router = Router();

// Store connected clients
const clients: Map<string, Response> = new Map();

/**
 * GET /stream - SSE stream for live bus updates
 */
router.get('/stream', authenticateBearer, (req: Request, res: Response) => {
  const routeId = req.query.route_id as string | undefined;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Generate client ID
  const clientId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  clients.set(clientId, res);

  console.log(`Client ${clientId} connected to stream${routeId ? ` (route: ${routeId})` : ''}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', client_id: clientId })}\n\n`);

  // Heartbeat interval to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  // Send updates interval
  const updateInterval = setInterval(async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const query: any = { timestamp: { $gte: fiveMinutesAgo } };
      if (routeId) query.routeId = routeId;

      const heartbeats = await Heartbeat.aggregate([
        { $match: query },
        { $sort: { timestamp: -1 } },
        { $group: { _id: '$busId', latestHb: { $first: '$$ROOT' } } },
      ]);

      const buses = heartbeats.map(h => ({
        bus_id: h.latestHb.busId,
        route_id: h.latestHb.routeId,
        trip_id: h.latestHb.tripId,
        lat: h.latestHb.lat,
        lng: h.latestHb.lng,
        speed_kmph: h.latestHb.speedKmph,
        timestamp: h.latestHb.timestamp,
      }));

      res.write(`data: ${JSON.stringify({ type: 'update', buses })}\n\n`);
    } catch (error) {
      console.error('Stream update error:', error);
    }
  }, 5000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(updateInterval);
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected from stream`);
  });
});

export default router;
