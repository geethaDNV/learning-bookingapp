// API Configuration
const API_BASE_URL = "http://localhost:3001/api/v1";

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};

// API response wrapper
interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "API error");
  }

  return data.data as T;
}

export async function get<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`);
  return handleResponse<T>(response);
}

export async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}
