import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/apiResponse.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  sendError(res, err);
}
