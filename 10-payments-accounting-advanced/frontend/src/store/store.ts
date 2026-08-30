import { configureStore } from "@reduxjs/toolkit";
import paymentsReducer from "./paymentsSlice.js";
import reconciliationReducer from "./reconciliationSlice.js";

export const store = configureStore({
  reducer: {
    payments: paymentsReducer,
    reconciliation: reconciliationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
