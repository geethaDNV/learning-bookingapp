import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  AsyncThunk,
} from "@reduxjs/toolkit";
import { apiClient } from "../services/apiClient.js";
import {
  Payment,
  PostingResult,
  RefundResult,
  AccountingHistory,
} from "../types/index.js";

// Thunks
export const postPayment = createAsyncThunk<
  PostingResult,
  { paymentId: string; idempotencyKey?: string }
>("payments/post", async (params) => {
  return apiClient.postPayment(params.paymentId, params.idempotencyKey);
});

export const refundPayment = createAsyncThunk<
  RefundResult,
  { paymentId: string; amount: number; reason: string }
>("payments/refund", async (params) => {
  return apiClient.refundPayment(params.paymentId, params.amount, params.reason);
});

export const fetchPaymentAccounting = createAsyncThunk<
  AccountingHistory,
  string
>("payments/fetchAccounting", async (paymentId) => {
  return apiClient.getPaymentAccountingHistory(paymentId);
});

export const createPayment = createAsyncThunk<
  Payment,
  {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    idempotencyKey?: string;
  }
>("payments/create", async (params) => {
  return apiClient.createPayment(
    params.invoiceId,
    params.amount,
    params.paymentMethod,
    params.idempotencyKey
  );
});

// State
export interface PaymentsState {
  payments: Payment[];
  currentPayment: Payment | null;
  accounting: AccountingHistory | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: PaymentsState = {
  payments: [],
  currentPayment: null,
  accounting: null,
  loading: false,
  error: null,
  success: null,
};

// Slice
const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setCurrentPayment: (state, action: PayloadAction<Payment | null>) => {
      state.currentPayment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message;
      })
      .addCase(postPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to post payment";
      })
      .addCase(refundPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message;
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to refund payment";
      })
      .addCase(fetchPaymentAccounting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentAccounting.fulfilled, (state, action) => {
        state.loading = false;
        state.accounting = action.payload;
      })
      .addCase(fetchPaymentAccounting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch accounting";
      })
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
        state.payments.push(action.payload);
        state.success = "Payment created successfully";
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create payment";
      });
  },
});

export const { clearError, clearSuccess, setCurrentPayment } =
  paymentsSlice.actions;
export default paymentsSlice.reducer;
