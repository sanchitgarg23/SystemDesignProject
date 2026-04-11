import { Router, Request, Response } from 'express';
import { authenticateBearer } from '../middleware/auth';
import { Heartbeat } from '../models';
import { EventBus } from '../core/EventBus';
import { SSEObserver } from '../core/SSEObserver';

const router = Router();

/**
 * GET /stream - SSE stream for live bus updates
 * 
 * Implements the Observer Pattern for real-time push notifications:
 * 
 * Subject:   EventBus (Singleton) — manages subscriptions & broadcasts
 * Observer:  SSEObserver — wraps Express Response for SSE output
 * Channel:   'bus-updates' (optionally filtered by route_id)
 * 
 * Flow:
 * 1. Client connects -> SSEObserver created -> subscribed to EventBus
 * 2. Interval fires  -> fetches heartbeats -> EventBus.notify() -> all observers get data
 * 3. Client disconnects -> SSEObserver unsubscribed -> resources cleaned up
 */
router.get('/stream', authenticateBearer, (req: Request, res: Response) => {
  const routeId = req.query.route_id as string | undefined;
  const channel = routeId ? `bus-updates:${routeId}` : 'bus-updates';

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Create Observer (concrete SSEObserver wrapping this client's Response)
  const clientId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const observer = new SSEObserver(clientId, res);

  // Subscribe Observer to the EventBus (Subject)
  const eventBus = EventBus.getInstance();
  eventBus.subscribe(channel, observer);

  console.log(`Client ${clientId} connected to stream${routeId ? ` (route: ${routeId})` : ''}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', client_id: clientId })}\n\n`);

  // Heartbeat interval to keep connection alive
  const heartbeatInterval = setInterval(() => {
    observer.sendHeartbeat();
  }, 30000);

  // Send updates interval — fetches data and notifies via EventBus
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

      // Notify all observers on this channel
      eventBus.notify(channel, { type: 'update', buses });
    } catch (error) {
      console.error('Stream update error:', error);
    }
  }, 5000);

  // Handle client disconnect — unsubscribe Observer from Subject
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(updateInterval);
    observer.deactivate();
    eventBus.unsubscribe(channel, observer);
    console.log(`Client ${clientId} disconnected from stream`);
  });
});

export default router;
