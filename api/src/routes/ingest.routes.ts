import { Router, Request, Response } from 'express';
import { authenticateDevice } from '../middleware/auth';
import {
  HeartbeatSchema,
  TicketSchema,
  TripStartSchema,
  TripEndSchema,
  OfflineBatchSchema,
} from '../types';
import {
  storeHeartbeat,
  storeTicket,
  startTrip,
  endTrip,
  processOfflineBatch,
} from '../services/ingest.service';

const router = Router();

/**
 * POST /heartbeat - Store GPS heartbeat
 */
router.post('/heartbeat', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const data = HeartbeatSchema.parse(req.body);

    if (data.device_id !== req.device?.device_id) {
      return res.status(403).json({
        code: 'DEVICE_MISMATCH',
        message: 'device_id does not match authenticated device',
      });
    }

    await storeHeartbeat(data);
    res.status(200).json({ status: 'accepted' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'INVALID_PAYLOAD',
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Heartbeat error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to store heartbeat' });
  }
});

/**
 * POST /ticket - Store ticket
 */
router.post('/ticket', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const data = TicketSchema.parse(req.body);

    if (data.device_id !== req.device?.device_id) {
      return res.status(403).json({
        code: 'DEVICE_MISMATCH',
        message: 'device_id does not match authenticated device',
      });
    }

    const result = await storeTicket(data);

    if (result.duplicate) {
      return res.status(200).json({
        status: 'duplicate',
        ticket_id: result.ticket_id,
        message: 'Ticket already exists',
      });
    }

    res.status(201).json({ status: 'created', ticket_id: result.ticket_id });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'INVALID_PAYLOAD',
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Ticket error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to store ticket' });
  }
});

/**
 * POST /trip/start - Start trip
 */
router.post('/trip/start', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const data = TripStartSchema.parse(req.body);

    if (data.device_id !== req.device?.device_id) {
      return res.status(403).json({
        code: 'DEVICE_MISMATCH',
        message: 'device_id does not match authenticated device',
      });
    }

    const result = await startTrip(data);

    if (result.exists) {
      return res.status(200).json({
        status: 'exists',
        trip_id: result.trip_id,
        message: 'Trip already started',
      });
    }

    res.status(201).json({ status: 'started', trip_id: result.trip_id });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'INVALID_PAYLOAD',
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Trip start error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to start trip' });
  }
});

/**
 * POST /trip/end - End trip
 */
router.post('/trip/end', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const data = TripEndSchema.parse(req.body);

    if (data.device_id !== req.device?.device_id) {
      return res.status(403).json({
        code: 'DEVICE_MISMATCH',
        message: 'device_id does not match authenticated device',
      });
    }

    const result = await endTrip(data);

    if (!result.found) {
      return res.status(404).json({ code: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }

    res.status(200).json({ status: 'ended', trip_id: result.trip_id });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'INVALID_PAYLOAD',
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Trip end error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to end trip' });
  }
});

/**
 * POST /offline-batch - Process offline tickets
 */
router.post('/offline-batch', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const data = OfflineBatchSchema.parse(req.body);

    if (data.device_id !== req.device?.device_id) {
      return res.status(403).json({
        code: 'DEVICE_MISMATCH',
        message: 'device_id does not match authenticated device',
      });
    }

    const result = await processOfflineBatch(data);

    res.status(200).json({
      status: 'processed',
      batch_id: result.batch_id,
      accepted: result.accepted,
      duplicates: result.duplicates,
      rejected: result.rejected,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        code: 'INVALID_PAYLOAD',
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Offline batch error:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to process offline batch' });
  }
});

export default router;
