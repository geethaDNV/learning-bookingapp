/**
 * Auth thunks for async actions
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import type { AuthResponse, AuthTokens, AuthUser, SignInPayload, SignUpPayload } from '../models/auth';

export const signupThunk = createAsyncThunk<AuthResponse, SignUpPayload, { rejectValue: string }>(
  'auth/signup',
  async (payload: SignUpPayload, { rejectWithValue }) => {
    try {
      const result = await authService.signup(payload);
      tokenStorage.saveTokens(result.tokens.accessToken, result.tokens.refreshToken);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const signinThunk = createAsyncThunk<AuthResponse, SignInPayload, { rejectValue: string }>(
  'auth/signin',
  async (payload: SignInPayload, { rejectWithValue }) => {
    try {
      const result = await authService.signin(payload);
      tokenStorage.saveTokens(result.tokens.accessToken, result.tokens.refreshToken);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const refreshThunk = createAsyncThunk<AuthTokens, string, { rejectValue: string }>(
  'auth/refresh',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const result = await authService.refresh({ refreshToken });
      tokenStorage.saveTokens(result.accessToken, result.refreshToken);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const logoutThunk = createAsyncThunk<void, string, { rejectValue: string }>(
  'auth/logout',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      await authService.logout(refreshToken);
      tokenStorage.clearTokens();
    } catch (error) {
      tokenStorage.clearTokens();
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadCurrentUserThunk = createAsyncThunk<AuthUser, string, { rejectValue: string }>(
  'auth/loadCurrentUser',
  async (accessToken: string, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser(accessToken);
      return user;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);
