// Redux Slice for Customers with Thunks & Selectors

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './store';
import type { Customer, CustomerListQuery, CustomerListResponse } from '@types';
import { customerService } from '@services/customerService';

export interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  listMeta: {
    total: number;
    page: number;
    pageSize: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  listMeta: { total: 0, page: 1, pageSize: 20 },
  loading: false,
  error: null,
};

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchList',
  async (query: CustomerListQuery = {}) => {
    const response = await customerService.listCustomers(query);
    if (!response.success) throw new Error(response.message);
    return {
      customers: response.data || [],
      meta: response.meta,
    };
  }
);

export const fetchCustomer = createAsyncThunk('customers/fetchOne', async (publicId: string) => {
  const response = await customerService.getCustomer(publicId);
  if (!response.success) throw new Error(response.message);
  return response.data;
});

export const createCustomer = createAsyncThunk('customers/create', async (payload: any) => {
  const response = await customerService.createCustomer(payload);
  if (!response.success) throw new Error(response.message);
  return response.data;
});

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ publicId, payload }: { publicId: string; payload: any }) => {
    const response = await customerService.updateCustomer(publicId, payload);
    if (!response.success) throw new Error(response.message);
    return response.data;
  }
);

export const setCustomerStatus = createAsyncThunk(
  'customers/setStatus',
  async ({ publicId, isActive }: { publicId: string; isActive: boolean }) => {
    const response = await customerService.setCustomerStatus(publicId, isActive);
    if (!response.success) throw new Error(response.message);
    return response.data;
  }
);

// Slice
const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch customers
    builder.addCase(fetchCustomers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      state.loading = false;
      state.customers = action.payload.customers;
      if (action.payload.meta) {
        state.listMeta = action.payload.meta;
      }
    });
    builder.addCase(fetchCustomers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch customers';
    });

    // Fetch single customer
    builder.addCase(fetchCustomer.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomer.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedCustomer = action.payload;
    });
    builder.addCase(fetchCustomer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch customer';
    });

    // Create customer
    builder.addCase(createCustomer.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.loading = false;
      state.customers.push(action.payload);
      state.selectedCustomer = action.payload;
    });
    builder.addCase(createCustomer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to create customer';
    });

    // Update customer
    builder.addCase(updateCustomer.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.customers.findIndex((c) => c.publicId === action.payload.publicId);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
      state.selectedCustomer = action.payload;
    });
    builder.addCase(updateCustomer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to update customer';
    });

    // Set status
    builder.addCase(setCustomerStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(setCustomerStatus.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.customers.findIndex((c) => c.publicId === action.payload.publicId);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
      state.selectedCustomer = action.payload;
    });
    builder.addCase(setCustomerStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to update customer status';
    });
  },
});

// Selectors
export const selectAllCustomers = (state: RootState) => state.customers.customers;
export const selectSelectedCustomer = (state: RootState) => state.customers.selectedCustomer;
export const selectCustomersLoading = (state: RootState) => state.customers.loading;
export const selectCustomersError = (state: RootState) => state.customers.error;
export const selectCustomersListMeta = (state: RootState) => state.customers.listMeta;

// Actions & reducer
export const { clearError, clearSelectedCustomer } = customerSlice.actions;
export default customerSlice.reducer;
