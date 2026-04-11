import { Router, Request, Response } from 'express';

/**
 * BaseController — Abstract Controller Class
 * 
 * Provides a template for all API controllers in the system.
 * Each concrete controller (Admin, App, Conductor, Ingest) extends
 * this base class and implements its own route definitions.
 * 
 * OOP Concepts: Abstraction + Inheritance
 * - Abstract class defines shared structure (router, helpers)
 * - Concrete classes implement domain-specific routes
 * - Common response formatting is inherited, not duplicated
 * 
 * Design Pattern: Template Method (partial)
 * - initializeRoutes() is the "template method" that subclasses override
 */
export abstract class BaseController {
  protected router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  /**
   * Subclasses must implement this to register their routes.
   * Called automatically by the constructor.
   */
  protected abstract initializeRoutes(): void;

  /**
   * Returns the Express Router for mounting in the application.
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Send a standardized success response.
   */
  protected sendSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json(data);
  }

  /**
   * Send a standardized error response.
   */
  protected sendError(res: Response, code: string, message: string, statusCode: number = 500): void {
    res.status(statusCode).json({ code, message });
  }
}
