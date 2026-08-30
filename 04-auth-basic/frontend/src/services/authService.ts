/**
 * Typed API service for auth endpoints
 */

import type {
  SignInPayload,
  SignUpPayload,
  AuthResponse,
  RefreshTokenPayload,
  AuthTokens,
  AuthUser,
} from '../models/auth';

const API_BASE = '/api/v1';

/**
 * Helper to make API calls with auth token
 */
async function apiCall<T>(
  url: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API error');
  }

  return response.json();
}

export const authService = {
  /**
   * Sign up a new user
   */
  async signup(payload: SignUpPayload): Promise<AuthResponse> {
    return apiCall<AuthResponse>(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Sign in with email and password
   */
  async signin(payload: SignInPayload): Promise<AuthResponse> {
    return apiCall<AuthResponse>(`${API_BASE}/auth/signin`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Refresh access token using refresh token
   */
  async refresh(payload: RefreshTokenPayload): Promise<AuthTokens> {
    return apiCall<AuthTokens>(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Logout the current user
   */
  async logout(token: string): Promise<void> {
    return apiCall<void>(`${API_BASE}/auth/logout`, {
      method: 'POST',
      token,
    });
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(token: string): Promise<AuthUser> {
    return apiCall<AuthUser>(`${API_BASE}/auth/me`, {
      method: 'GET',
      token,
    });
  },

  /**
   * Demo protected endpoint
   */
  async getProtectedDemo(token: string): Promise<any> {
    return apiCall<any>(`${API_BASE}/protected-demo`, {
      method: 'GET',
      token,
    });
  },
};
