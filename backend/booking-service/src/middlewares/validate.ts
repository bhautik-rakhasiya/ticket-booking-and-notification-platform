import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

/**
 * Joi validation middleware factory.
 *
 * Usage:
 *   router.post('/', validate(createBookingSchema), controller)
 *
 * Validates `req.body` against the provided Joi schema.
 * On failure → 400 Bad Request with the first validation error message.
 */
export function validate(schema: ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,      // Return only the first error
      stripUnknown: true,    // Remove extra fields not in schema
    });

    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
      return;
    }

    // Replace body with validated + stripped value
    req.body = value;
    next();
  };
}
