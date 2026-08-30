import { Request, Response, NextFunction } from "express";
import { PaymentError } from "../errors/CustomErrors.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  if (err instanceof PaymentError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
}

/**
 * Middleware to capture raw body for webhook signature verification
 */
export function rawBodyMiddleware(
  req: Request & { rawBody?: Buffer },
  res: Response,
  next: NextFunction
) {
  const chunks: Buffer[] = [];

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
}
