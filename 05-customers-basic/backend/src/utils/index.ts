// Utility functions

import type { Response } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function parseBody<T>(schema: ZodSchema, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Validation error: ${messages}`);
    }
    throw error;
  }
}

export function parseParams<T>(schema: ZodSchema, data: unknown): T {
  return parseBody(schema, data);
}

export function parseQuery<T>(schema: ZodSchema, data: unknown): T {
  return parseBody(schema, data);
}

export function sendResponse(
  res: Response,
  payload: { message: string; data?: any; meta?: any },
  status: number = 200
): void {
  res.status(status).json({
    success: true,
    message: payload.message,
    data: payload.data || null,
    ...(payload.meta && { meta: payload.meta }),
  });
}

export function sendMessageResponse(res: Response, message: string, status: number = 200): void {
  res.status(status).json({
    success: status < 400,
    message,
    data: null,
  });
}
