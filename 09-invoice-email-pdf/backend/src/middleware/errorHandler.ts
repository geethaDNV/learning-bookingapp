import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@errors/index';

/**
 * Global error handling middleware.
 * 
 * Catches errors from route handlers and formats them consistently.
 * 
 * Error types:
 * - ValidationError: Zod validation or business logic validation
 * - AppError: Custom application errors
 * - ZodError: Raw Zod parsing errors
 * - Other: Unexpected errors
 */
export const errorHandler = (
  err: Error | ZodError | AppError | ValidationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    // Handle Zod validation errors
    const fieldErrors = err.flatten().fieldErrors;
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: fieldErrors,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof ValidationError) {
    // Handle validation errors
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof AppError) {
    // Handle custom app errors
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle unexpected errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 Not Found middleware.
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
};
