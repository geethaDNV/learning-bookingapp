import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type {
  Invoice,
  InvoiceListItem,
  InvoiceLineFormValue,
} from "../types/index.js";
import { InvoiceApiService } from "../services/api.js";

/**
 * Thunks (async actions)
 */
export const createInvoice = createAsyncThunk(
  "invoices/create",
  async (data: {
    customerId: number;
    dueDate?: string;
    notes?: string;
    lines: InvoiceLineFormValue[];
  }) => {
    return InvoiceApiService.createInvoice(data);
  }
);

export const fetchInvoice = createAsyncThunk(
  "invoices/fetchOne",
  async (publicId: string) => {
    return InvoiceApiService.getInvoice(publicId);
  }
);

export const fetchInvoices = createAsyncThunk(
  "invoices/fetchAll",
  async (options?: {
    customerId?: number;
    status?: string;
    skip?: number;
    take?: number;
  }) => {
    return InvoiceApiService.listInvoices(options);
  }
);

export const updateInvoice = createAsyncThunk(
  "invoices/update",
  async (data: {
    publicId: string;
    customerId?: number;
    dueDate?: string;
    notes?: string;
    lines?: InvoiceLineFormValue[];
  }) => {
    const { publicId, ...updateData } = data;
    return InvoiceApiService.updateInvoice(publicId, updateData);
  }
);

export const updateInvoiceStatus = createAsyncThunk(
  "invoices/updateStatus",
  async (data: {
    publicId: string;
    status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  }) => {
    return InvoiceApiService.updateInvoiceStatus(data.publicId, data.status);
  }
);

/**
 * Slice State
 */
interface InvoiceState {
  list: InvoiceListItem[];
  current: Invoice | null;
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: InvoiceState = {
  list: [],
  current: null,
  loading: false,
  error: null,
  total: 0,
};

/**
 * Invoice Slice
 */
export const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Invoice
    builder
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create invoice";
      });

    // Fetch Single Invoice
    builder
      .addCase(fetchInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch invoice";
      });

    // Fetch All Invoices
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.items;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch invoices";
      });

    // Update Invoice
    builder
      .addCase(updateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update invoice";
      });

    // Update Status
    builder
      .addCase(updateInvoiceStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(updateInvoiceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update status";
      });
  },
});

export const { clearCurrent, clearError } = invoiceSlice.actions;
export default invoiceSlice.reducer;

/**
 * Selectors
 */
export const selectInvoiceList = (state: any) => state.invoices.list;
export const selectCurrentInvoice = (state: any) => state.invoices.current;
export const selectInvoiceLoading = (state: any) => state.invoices.loading;
export const selectInvoiceError = (state: any) => state.invoices.error;
export const selectInvoiceTotal = (state: any) => state.invoices.total;
