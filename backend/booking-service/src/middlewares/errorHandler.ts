import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { Prisma } from "@prisma/client";
import logger from "../utils/logger";

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware chain.
 *
 * Handles:
 *  - AppError subclasses (operational errors with known status codes)
 *  - Prisma unique constraint violations → 409
 *  - Everything else → 500 Internal Server Error
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Operational errors (our custom AppError hierarchy)
  if (err instanceof AppError) {
    logger.warn(`Operational Error [${req.method} ${req.originalUrl}]: ${err.message}`, {
      statusCode: err.statusCode,
      url: req.originalUrl,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma unique constraint violation (e.g., duplicate idempotency key)
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    logger.warn(`Prisma Unique Constraint P2002 [${req.method} ${req.originalUrl}]: Duplicate booking attempt.`, {
      url: req.originalUrl,
    });

    res.status(409).json({
      success: false,
      message: "A booking with the same user, event, and seat count already exists.",
    });
    return;
  }

  // Prisma record not found (findUniqueOrThrow etc.)
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    logger.warn(`Prisma Record Not Found P2025 [${req.method} ${req.originalUrl}]`, {
      url: req.originalUrl,
    });

    res.status(404).json({
      success: false,
      message: "Resource not found",
    });
    return;
  }

  // Unknown / programming errors
  logger.error(`Unhandled Error [${req.method} ${req.originalUrl}]: %s`, err.message, {
    stack: err.stack,
    url: req.originalUrl,
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
