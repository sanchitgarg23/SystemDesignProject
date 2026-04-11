import { Request, Response, NextFunction } from 'express';
import {
  DeviceAuthStrategy,
  BearerAuthStrategy,
  AdminAuthStrategy,
  AppUserAuthStrategy,
  ConductorAuthStrategy,
} from './strategies/AuthStrategy';
import { AuthMiddlewareFactory } from './strategies/AuthMiddlewareFactory';

/**
 * Authentication Middleware
 * 
 * Implements the Strategy Pattern: each authentication function uses a
 * different concrete strategy class internally, but they all share the
 * same Express middleware signature (req, res, next).
 * 
 * Design Pattern: Strategy
 * - IAuthStrategy defines the common interface
 * - DeviceAuthStrategy, AdminAuthStrategy, etc. are concrete strategies
 * - AuthMiddlewareFactory converts strategies into Express middleware
 * 
 * OOP Concept: Polymorphism
 * - All 5 functions below have identical signatures
 * - Express treats them interchangeably in the middleware chain
 * - Each internally delegates to a different strategy with different logic
 */

// Instantiate strategy objects (reusable across requests)
const deviceStrategy = new DeviceAuthStrategy();
const bearerStrategy = new BearerAuthStrategy();
const adminStrategy = new AdminAuthStrategy();
const appUserStrategy = new AppUserAuthStrategy();
const conductorStrategy = new ConductorAuthStrategy();

/**
 * Authenticate ETM Device via X-Device-Key header
 */
export const authenticateDevice = AuthMiddlewareFactory.create(deviceStrategy);

/**
 * Authenticate via Bearer token (for query endpoints)
 */
export const authenticateBearer = AuthMiddlewareFactory.create(bearerStrategy);

/**
 * Authenticate Admin users
 */
export const authenticateAdmin = AuthMiddlewareFactory.create(adminStrategy);

/**
 * Authenticate App users (passengers)
 */
export const authenticateAppUser = AuthMiddlewareFactory.create(appUserStrategy);

/**
 * Authenticate Conductors
 */
export const authenticateConductor = AuthMiddlewareFactory.create(conductorStrategy);
