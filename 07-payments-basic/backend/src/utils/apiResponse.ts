import { Response } from "express";
import { AppError } from "../errors/AppError.js";

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  pagination?: { total: number; page: number; pageSize: number }
): Response {
  const response: ApiResponse<T> = { message };
  if (data !== undefined) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: unknown
): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      error: error.code,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      message: error.message,
      error: "INTERNAL_ERROR",
    });
  }

  return res.status(500).json({
    message: "An unexpected error occurred",
    error: "INTERNAL_ERROR",
  });
}
