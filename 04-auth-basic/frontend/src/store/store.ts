/**
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  authStartLoading,
  authSetUser,
  authSetTokens,
  authSetError,
} from './authSlice';
import {
  signupThunk,
  signinThunk,
  refreshThunk,
  logoutThunk,
  loadCurrentUserThunk,
} from './authThunks';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Add extra reducers for thunk states
import { authSlice } from './authSlice';

const authSliceWithExtraReducers = authSlice.getReducers();

// Note: Extra reducers would be added to the auth slice for handling
// pending, fulfilled, and rejected states of thunks.
// For simplicity in this learning module, components handle loading states directly.
