/**
 * Redux Slice for Items
 * 
 * Manages Item state: list, loading state, errors, and current item.
 * Actions are dispatched by thunks after API calls.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item, ItemListResponse, ApiError } from '../types/index';
import { fetchItems, fetchItemById, createItemThunk, updateItemThunk, deleteItemThunk } from './itemThunks';

export interface ItemsState {
  list: Item[];
  currentItem: Item | null;
  loading: boolean;
  error: ApiError | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  submitError: ApiError | null; // Errors from create/update/delete actions
}

const initialState: ItemsState = {
  list: [],
  currentItem: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
  submitError: null,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSubmitError: (state) => {
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch items list
    builder.addCase(fetchItems.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchItems.fulfilled, (state, action: PayloadAction<ItemListResponse>) => {
      state.loading = false;
      state.list = action.payload.items;
      state.pagination = {
        page: action.payload.page,
        pageSize: action.payload.pageSize,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };
    });
    builder.addCase(fetchItems.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as ApiError;
    });

    // Fetch item by ID
    builder.addCase(fetchItemById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchItemById.fulfilled, (state, action: PayloadAction<Item>) => {
      state.loading = false;
      state.currentItem = action.payload;
    });
    builder.addCase(fetchItemById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as ApiError;
    });

    // Create item
    builder.addCase(createItemThunk.pending, (state) => {
      state.loading = true;
      state.submitError = null;
    });
    builder.addCase(createItemThunk.fulfilled, (state) => {
      state.loading = false;
      state.submitError = null;
    });
    builder.addCase(createItemThunk.rejected, (state, action) => {
      state.loading = false;
      state.submitError = action.payload as ApiError;
    });

    // Update item
    builder.addCase(updateItemThunk.pending, (state) => {
      state.loading = true;
      state.submitError = null;
    });
    builder.addCase(updateItemThunk.fulfilled, (state) => {
      state.loading = false;
      state.submitError = null;
    });
    builder.addCase(updateItemThunk.rejected, (state, action) => {
      state.loading = false;
      state.submitError = action.payload as ApiError;
    });

    // Delete item
    builder.addCase(deleteItemThunk.pending, (state) => {
      state.loading = true;
      state.submitError = null;
    });
    builder.addCase(deleteItemThunk.fulfilled, (state) => {
      state.loading = false;
      state.submitError = null;
    });
    builder.addCase(deleteItemThunk.rejected, (state, action) => {
      state.loading = false;
      state.submitError = action.payload as ApiError;
    });
  },
});

export const { clearError, clearSubmitError } = itemsSlice.actions;
export default itemsSlice.reducer;
