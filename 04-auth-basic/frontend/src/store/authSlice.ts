/**
 * Redux auth slice for managing auth state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser, AuthTokens } from '../models/auth';
import type { RootState } from './store';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Start loading
    authStartLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    // Success actions
    authSetUser: (state, action: PayloadAction<{ user: AuthUser; tokens: AuthTokens }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isLoading = false;
      state.error = null;
    },

    authSetTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isLoading = false;
      state.error = null;
    },

    // Clear auth
    authClear: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isLoading = false;
      state.error = null;
    },

    // Set error
    authSetError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Restore from storage
    authRestoreFromStorage: (state, action: PayloadAction<{ user: AuthUser | null; accessToken: string | null; refreshToken: string | null }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
});

export const {
  authStartLoading,
  authSetUser,
  authSetTokens,
  authClear,
  authSetError,
  authRestoreFromStorage,
} = authSlice.actions;

// Selectors
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;

export default authSlice.reducer;
