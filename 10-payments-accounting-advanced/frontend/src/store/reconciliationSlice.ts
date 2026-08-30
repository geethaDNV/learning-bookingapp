import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../services/apiClient.js";
import { Payment, ReconciliationResult, ReconciliationRecord } from "../types/index.js";

// Thunks
export const fetchUnreconciledPayments = createAsyncThunk<Payment[]>(
  "reconciliation/fetchUnreconciled",
  async () => {
    return apiClient.getUnreconciledPayments();
  }
);

export const markPaymentReconciled = createAsyncThunk<
  ReconciliationResult,
  { paymentId: string; bankReference?: string; notes?: string }
>("reconciliation/mark", async (params) => {
  return apiClient.markReconciled(
    params.paymentId,
    params.bankReference,
    params.notes
  );
});

export const fetchReconciliationStatus = createAsyncThunk<
  ReconciliationRecord | null,
  string
>("reconciliation/fetchStatus", async (paymentId) => {
  return apiClient.getReconciliationStatus(paymentId);
});

// State
export interface ReconciliationState {
  unreconciledPayments: Payment[];
  reconciliationStatuses: Map<string, ReconciliationRecord>;
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: ReconciliationState = {
  unreconciledPayments: [],
  reconciliationStatuses: new Map(),
  loading: false,
  error: null,
  success: null,
};

// Slice
const reconciliationSlice = createSlice({
  name: "reconciliation",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreconciledPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreconciledPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.unreconciledPayments = action.payload;
      })
      .addCase(fetchUnreconciledPayments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch unreconciled payments";
      })
      .addCase(markPaymentReconciled.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markPaymentReconciled.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message;
      })
      .addCase(markPaymentReconciled.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to mark as reconciled";
      })
      .addCase(fetchReconciliationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReconciliationStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.reconciliationStatuses.set(
            action.payload.paymentId,
            action.payload
          );
        }
      })
      .addCase(fetchReconciliationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch reconciliation status";
      });
  },
});

export const { clearError, clearSuccess } = reconciliationSlice.actions;
export default reconciliationSlice.reducer;
