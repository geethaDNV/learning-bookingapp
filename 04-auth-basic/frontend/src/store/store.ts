/**
 * Redux store configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Note: Extra reducers would be added to the auth slice for handling
// pending, fulfilled, and rejected states of thunks.
// For simplicity in this learning module, components handle loading states directly.
