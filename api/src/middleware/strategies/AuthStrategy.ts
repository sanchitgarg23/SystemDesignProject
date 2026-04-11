import { Request, Response, NextFunction } from 'express';
import { Device } from '../../models';

/**
 * Authentication Strategy Interface
 * 
 * Implements the Gang of Four Strategy Pattern for authentication.
 * Each user type (Admin, AppUser, Conductor, Device, Bearer) has a
 * different authentication algorithm, but all share the same interface.
 * 
 * Express doesn't care which strategy is used — they all conform to
 * the same (req, res, next) middleware shape via the factory.
 * 
 * Design Pattern: Strategy
 */
export interface IAuthStrategy {
  /** Authenticate the incoming request */
  authenticate(req: Request, res: Response, next: NextFunction): Promise<void> | void;
}

/**
 * DeviceAuthStrategy — Authenticates IoT ETM devices via X-Device-Key header.
 * Performs asynchronous database lookup to validate the API key.
 */
export class DeviceAuthStrategy implements IAuthStrategy {
  public async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const apiKey = req.headers['x-device-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        code: 'MISSING_KEY',
        message: 'X-Device-Key header is required',
      });
      return;
    }

    try {
      const device = await Device.findOne({ apiKey, status: 'active' });

      if (!device) {
        res.status(401).json({
          code: 'INVALID_KEY',
          message: 'Invalid or inactive device key',
        });
        return;
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
}

/**
 * BearerAuthStrategy — Authenticates via generic Bearer token.
 * Used for ETM query endpoints.
 */
export class BearerAuthStrategy implements IAuthStrategy {
  public authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: 'MISSING_AUTH',
        message: 'Authorization header required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const validToken = process.env.ETM_BEARER_TOKEN || 'demo_token_12345';

    if (token !== validToken) {
      res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid bearer token',
      });
      return;
    }

    req.authenticated = true;
    next();
  }
}

/**
 * AdminAuthStrategy — Authenticates admin portal users via Bearer token.
 * Validates against a configured admin token.
 */
export class AdminAuthStrategy implements IAuthStrategy {
  public authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: 'MISSING_AUTH',
        message: 'Authorization header required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const validToken = process.env.ADMIN_DEMO_TOKEN || 'admin_demo_token_12345';

    if (token !== validToken) {
      res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid admin token',
      });
      return;
    }

    req.authenticated = true;
    next();
  }
}

/**
 * AppUserAuthStrategy — Authenticates passenger mobile app users.
 * Validates APP_ prefixed tokens and extracts user ID.
 */
export class AppUserAuthStrategy implements IAuthStrategy {
  public authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: 'MISSING_AUTH',
        message: 'Authorization header required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Token format: APP_userId_timestamp
    if (!token.startsWith('APP_')) {
      res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid app token',
      });
      return;
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
}

/**
 * ConductorAuthStrategy — Authenticates conductor app users.
 * Validates CONDUCTOR_ prefixed tokens and extracts device info.
 */
export class ConductorAuthStrategy implements IAuthStrategy {
  public async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: 'MISSING_AUTH',
        message: 'Authorization header required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Token format: CONDUCTOR_deviceId_conductorId_timestamp
    if (!token.startsWith('CONDUCTOR_')) {
      res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid conductor token',
      });
      return;
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
}
