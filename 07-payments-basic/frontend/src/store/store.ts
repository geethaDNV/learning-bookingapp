import { configureStore } from "@reduxjs/toolkit";
import paymentsReducer from "../features/payments/store/paymentSlice";

export const store = configureStore({
  reducer: {
    payments: paymentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
