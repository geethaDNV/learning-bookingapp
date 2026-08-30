/**
 * Auth thunks for async actions
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import type { SignInPayload, SignUpPayload } from '../models/auth';

export const signupThunk = createAsyncThunk(
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

export const signinThunk = createAsyncThunk(
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

export const refreshThunk = createAsyncThunk(
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

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (accessToken: string, { rejectWithValue }) => {
    try {
      await authService.logout(accessToken);
      tokenStorage.clearTokens();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const loadCurrentUserThunk = createAsyncThunk(
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
