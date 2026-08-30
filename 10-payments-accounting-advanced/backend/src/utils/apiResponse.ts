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

export function successResponse<T>(
  message: string,
  data?: T,
  pagination?: { total: number; page: number; pageSize: number }
): ApiResponse<T> {
  return {
    message,
    ...(data !== undefined && { data }),
    ...(pagination && { pagination }),
  };
}

export function errorResponse(
  message: string,
  error: string
): ApiResponse<null> {
  return {
    message,
    error,
  };
}
