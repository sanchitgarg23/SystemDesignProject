import { Request, Response, NextFunction } from 'express';
import { IAuthStrategy } from './AuthStrategy';

/**
 * AuthMiddlewareFactory
 * 
 * Factory that converts any IAuthStrategy into Express middleware.
 * This decouples the authentication logic (strategies) from the
 * Express middleware interface.
 * 
 * Design Pattern: Strategy + Factory
 * 
 * Usage:
 *   const middleware = AuthMiddlewareFactory.create(new AdminAuthStrategy());
 *   router.get('/route', middleware, handler);
 */
export class AuthMiddlewareFactory {
  /**
   * Creates Express middleware from an authentication strategy.
   * The returned function has the standard (req, res, next) signature.
   */
  public static create(strategy: IAuthStrategy) {
    return (req: Request, res: Response, next: NextFunction) => {
      return strategy.authenticate(req, res, next);
    };
  }
}
