import { Request, Response, NextFunction } from 'express';
import { Device } from '../models';

/**
 * Authenticate ETM Device via X-Device-Key header
 */
export async function authenticateDevice(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-device-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      code: 'MISSING_KEY',
      message: 'X-Device-Key header is required',
    });
  }

  try {
    const device = await Device.findOne({ apiKey, status: 'active' });

    if (!device) {
      return res.status(401).json({
        code: 'INVALID_KEY',
        message: 'Invalid or inactive device key',
      });
    }

    // Update last seen
    device.lastSeen = new Date();
    await device.save();

    req.device = {
      device_id: device.deviceId,
      bus_id: device.busId,
    };

    next();
  } catch (error) {
    console.error('Device auth error:', error);
    res.status(500).json({
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
    });
  }
}

/**
 * Authenticate via Bearer token (for query endpoints)
 */
export function authenticateBearer(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'MISSING_AUTH',
      message: 'Authorization header required',
    });
  }

  const token = authHeader.split(' ')[1];
  const validToken = process.env.ETM_BEARER_TOKEN || 'demo_token_12345';

  if (token !== validToken) {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid bearer token',
    });
  }

  req.authenticated = true;
  next();
}

/**
 * Authenticate Admin users
 */
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'MISSING_AUTH',
      message: 'Authorization header required',
    });
  }

  const token = authHeader.split(' ')[1];
  const validToken = process.env.ADMIN_DEMO_TOKEN || 'admin_demo_token_12345';

  if (token !== validToken) {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid admin token',
    });
  }

  req.authenticated = true;
  next();
}

/**
 * Authenticate App users (passengers)
 */
export function authenticateAppUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'MISSING_AUTH',
      message: 'Authorization header required',
    });
  }

  const token = authHeader.split(' ')[1];

  // Token format: APP_userId_timestamp
  if (!token.startsWith('APP_')) {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid app token',
    });
  }

  // Extract user ID from token
  const parts = token.split('_');
  if (parts.length >= 2) {
    req.user = {
      user_id: parts[1],
      mobile: '', // Would be looked up in production
    };
  }

  req.authenticated = true;
  next();
}

/**
 * Authenticate Conductors
 */
export async function authenticateConductor(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'MISSING_AUTH',
      message: 'Authorization header required',
    });
  }

  const token = authHeader.split(' ')[1];

  // Token format: CONDUCTOR_deviceId_conductorId_timestamp
  if (!token.startsWith('CONDUCTOR_')) {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid conductor token',
    });
  }

  const parts = token.split('_');
  if (parts.length >= 3) {
    req.device = {
      device_id: parts[1],
      bus_id: null,
    };
  }

  req.authenticated = true;
  next();
}
