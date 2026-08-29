const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api/v1';

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }
  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params']) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};