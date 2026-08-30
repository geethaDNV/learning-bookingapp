export class PaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class NotFoundError extends PaymentError {
  constructor(message: string) {
    super("NOT_FOUND", message, 404);
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
  }
}

export class UnauthorizedError extends PaymentError {
  constructor(message: string) {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ConflictError extends PaymentError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}

export class InternalServerError extends PaymentError {
  constructor(message: string) {
    super("INTERNAL_SERVER_ERROR", message, 500);
  }
}
