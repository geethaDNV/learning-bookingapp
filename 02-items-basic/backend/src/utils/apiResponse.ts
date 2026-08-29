import { Response } from 'express';

interface SendResponseOptions<T> {
  message: string;
  data: T;
}

interface SendPaginatedResponseOptions<T> {
  message: string;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function sendResponse<T>(res: Response, options: SendResponseOptions<T>, status = 200) {
  res.status(status).json({ message: options.message, data: options.data });
}

export function sendPaginatedResponse<T>(res: Response, options: SendPaginatedResponseOptions<T>) {
  const { message, data, total, page, pageSize } = options;
  res.status(200).json({
    message,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}

export function sendMessageResponse(res: Response, message: string, status = 200) {
  res.status(status).json({ message });
}