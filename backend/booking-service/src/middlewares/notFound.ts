import { Request, Response, NextFunction } from "express";

/**
 * 404 Not Found handler.
 * Catches any request that doesn't match a registered route.
 * Must be registered AFTER all routes, BEFORE the error handler.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    message: `Route '${req.method} ${req.originalUrl}' not found`,
  });
}
