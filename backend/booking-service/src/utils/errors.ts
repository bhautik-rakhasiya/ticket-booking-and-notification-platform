/**
 * Base application error class.
 * All custom errors extend this.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 – Validation / bad request */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/** 404 – Resource not found */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

/** 409 – Business logic conflict (e.g. insufficient seats, duplicate idempotency key) */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
