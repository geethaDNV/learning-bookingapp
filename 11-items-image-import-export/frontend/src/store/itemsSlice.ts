/**
 * Redux Slice for Items
 * 
 * Manages Item state: list, loading state, errors, and current item.
 * Actions are dispatched by thunks after API calls.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiError, Item, ItemImportPreviewResult, ItemImportResult, ItemListResponse } from '../types/index';
import {
  confirmItemImportThunk,
  createItemThunk,
  deleteItemImageThunk,
  deleteItemThunk,
  exportItemsThunk,
  fetchItemById,
  fetchItems,
  previewItemImportThunk,
  updateItemThunk,
  uploadItemImageThunk,
} from './itemThunks';

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
  fileWorkflowLoading: boolean;
  fileWorkflowError: ApiError | null;
  importPreview: ItemImportPreviewResult | null;
  importResult: ItemImportResult | null;
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
  fileWorkflowLoading: false,
  fileWorkflowError: null,
  importPreview: null,
  importResult: null,
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
    clearFileWorkflowState: (state) => {
      state.fileWorkflowError = null;
      state.importPreview = null;
      state.importResult = null;
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

    builder.addCase(uploadItemImageThunk.pending, (state) => {
      state.fileWorkflowLoading = true;
      state.fileWorkflowError = null;
    });
    builder.addCase(uploadItemImageThunk.fulfilled, (state, action) => {
      state.fileWorkflowLoading = false;
      state.currentItem = action.payload.item;
      state.list = state.list.map((item) => item.id === action.payload.item.id ? action.payload.item : item);
    });
    builder.addCase(uploadItemImageThunk.rejected, (state, action) => {
      state.fileWorkflowLoading = false;
      state.fileWorkflowError = action.payload as ApiError;
    });

    builder.addCase(deleteItemImageThunk.fulfilled, (state, action) => {
      state.currentItem = action.payload;
      state.list = state.list.map((item) => item.id === action.payload.id ? action.payload : item);
    });
    builder.addCase(deleteItemImageThunk.rejected, (state, action) => {
      state.fileWorkflowError = action.payload as ApiError;
    });

    builder.addCase(previewItemImportThunk.pending, (state) => {
      state.fileWorkflowLoading = true;
      state.fileWorkflowError = null;
      state.importPreview = null;
      state.importResult = null;
    });
    builder.addCase(previewItemImportThunk.fulfilled, (state, action: PayloadAction<ItemImportPreviewResult>) => {
      state.fileWorkflowLoading = false;
      state.importPreview = action.payload;
    });
    builder.addCase(previewItemImportThunk.rejected, (state, action) => {
      state.fileWorkflowLoading = false;
      state.fileWorkflowError = action.payload as ApiError;
    });

    builder.addCase(confirmItemImportThunk.pending, (state) => {
      state.fileWorkflowLoading = true;
      state.fileWorkflowError = null;
    });
    builder.addCase(confirmItemImportThunk.fulfilled, (state, action: PayloadAction<ItemImportResult>) => {
      state.fileWorkflowLoading = false;
      state.importResult = action.payload;
    });
    builder.addCase(confirmItemImportThunk.rejected, (state, action) => {
      state.fileWorkflowLoading = false;
      state.fileWorkflowError = action.payload as ApiError;
    });

    builder.addCase(exportItemsThunk.pending, (state) => {
      state.fileWorkflowLoading = true;
      state.fileWorkflowError = null;
    });
    builder.addCase(exportItemsThunk.fulfilled, (state) => {
      state.fileWorkflowLoading = false;
    });
    builder.addCase(exportItemsThunk.rejected, (state, action) => {
      state.fileWorkflowLoading = false;
      state.fileWorkflowError = action.payload as ApiError;
    });
  },
});

export const { clearError, clearFileWorkflowState, clearSubmitError } = itemsSlice.actions;
export default itemsSlice.reducer;
