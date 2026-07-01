import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { Prisma } from "@prisma/client";

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
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Operational errors (our custom AppError hierarchy)
  if (err instanceof AppError) {
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
    res.status(409).json({
      success: false,
      message: "A booking with this idempotency key already exists",
    });
    return;
  }

  // Prisma record not found (findUniqueOrThrow etc.)
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({
      success: false,
      message: "Resource not found",
    });
    return;
  }

  // Unknown / programming errors
  console.error("[Unhandled Error]", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
