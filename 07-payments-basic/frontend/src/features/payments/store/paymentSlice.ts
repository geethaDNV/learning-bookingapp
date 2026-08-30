import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentAPI } from "../services/paymentService";
import { Payment, CreatePaymentResponse, PaymentStatus } from "../types/payment.types";

interface PaymentState {
  payments: Payment[];
  selectedPayment: Payment | null;
  paymentStatus: PaymentStatus | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

const initialState: PaymentState = {
  payments: [],
  selectedPayment: null,
  paymentStatus: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 10,
};

// Async thunks
export const createPayment = createAsyncThunk(
  "payments/createPayment",
  async (invoiceId: string) => {
    return paymentAPI.createPayment(invoiceId);
  }
);

export const fetchPayment = createAsyncThunk(
  "payments/fetchPayment",
  async (id: string) => {
    return paymentAPI.getPayment(id);
  }
);

export const fetchPaymentStatus = createAsyncThunk(
  "payments/fetchPaymentStatus",
  async (publicId: string) => {
    return paymentAPI.getPaymentStatus(publicId);
  }
);

export const fetchPayments = createAsyncThunk(
  "payments/fetchPayments",
  async (params: { page?: number; pageSize?: number; status?: string; invoiceId?: string }) => {
    return paymentAPI.listPayments(params.page, params.pageSize, params.status, params.invoiceId);
  }
);

export const simulatePaymentSuccess = createAsyncThunk(
  "payments/simulatePaymentSuccess",
  async (paymentId: string) => {
    return paymentAPI.simulatePaymentSuccess(paymentId);
  }
);

export const simulatePaymentFailure = createAsyncThunk(
  "payments/simulatePaymentFailure",
  async (paymentId: string) => {
    return paymentAPI.simulatePaymentFailure(paymentId);
  }
);

const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
  },
  extraReducers: (builder) => {
    // Create payment
    builder
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create payment";
      });

    // Fetch payment
    builder
      .addCase(fetchPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPayment = action.payload;
      })
      .addCase(fetchPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch payment";
      });

    // Fetch payment status
    builder
      .addCase(fetchPaymentStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPaymentStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentStatus = action.payload;
      })
      .addCase(fetchPaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch payment status";
      });

    // Fetch payments list
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch payments";
      });

    // Simulate success
    builder
      .addCase(simulatePaymentSuccess.pending, (state) => {
        state.loading = true;
      })
      .addCase(simulatePaymentSuccess.fulfilled, (state, action) => {
        state.loading = false;
        if (state.selectedPayment && state.selectedPayment.id === action.payload.id) {
          state.selectedPayment = action.payload;
        }
      })
      .addCase(simulatePaymentSuccess.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to simulate payment success";
      });

    // Simulate failure
    builder
      .addCase(simulatePaymentFailure.pending, (state) => {
        state.loading = true;
      })
      .addCase(simulatePaymentFailure.fulfilled, (state, action) => {
        state.loading = false;
        if (state.selectedPayment && state.selectedPayment.id === action.payload.id) {
          state.selectedPayment = action.payload;
        }
      })
      .addCase(simulatePaymentFailure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to simulate payment failure";
      });
  },
});

export const { setPage, setPageSize, clearError, clearSelectedPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
