/**
 * Error Handler Middleware
 * 
 * Centralized error handling for all routes.
 * Catches AppError, ValidationError, and generic errors.
 * Formats responses consistently for the frontend.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, DuplicateError } from '../errors/appError';

export function errorHandler(
  err: Error | AppError | ZodError | DuplicateError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    });

    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle DuplicateError
  if (err instanceof DuplicateError || (err as any).code === 'DUPLICATE_NAME' || (err as any).code === 'DUPLICATE_SKU') {
    const code = (err as any).code || 'DUPLICATE_ERROR';
    res.status(409).json({
      error: code,
      message: err.message,
      statusCode: 409,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle generic errors
  const statusCode = (err as any).statusCode || 500;
  const code = (err as any).code || 'INTERNAL_ERROR';
  res.status(statusCode).json({
    error: code,
    message: err.message || 'Internal server error',
    statusCode,
    timestamp: new Date().toISOString(),
  });
}
