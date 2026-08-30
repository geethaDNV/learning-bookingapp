/**
 * AppError - Custom Error Class
 * 
 * Standardized error handling for the application.
 * Includes status codes, error codes, and messages for API responses.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error for Zod validation failures
 */
export class ValidationError extends AppError {
  public readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Duplicate error for duplicate constraints
 */
export class DuplicateError extends AppError {
  constructor(message: string, code: string = 'DUPLICATE_ERROR') {
    super(message, code, 409);
    Object.setPrototypeOf(this, DuplicateError.prototype);
  }
}
