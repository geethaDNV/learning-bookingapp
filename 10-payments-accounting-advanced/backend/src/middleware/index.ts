import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/index.js";
import { errorResponse } from "../utils/apiResponse.js";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      errorResponse(err.message, err.code)
    );
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json(
      errorResponse("Validation failed", (err as any).message)
    );
  }

  console.error("Unhandled error:", err);
  return res.status(500).json(
    errorResponse("Internal server error", "INTERNAL_ERROR")
  );
};
