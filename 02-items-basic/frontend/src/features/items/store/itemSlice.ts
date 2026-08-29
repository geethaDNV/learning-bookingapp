import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createItem, deleteItem, fetchItemById, fetchItems, setItemStatus, updateItem } from './itemThunks';
import { Item, ItemStatusFilter, ItemTypeFilter } from '../types/item.types';

interface ItemState {
  rows: Item[];
  selectedItem: Item | null;
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: ItemStatusFilter;
  itemType: ItemTypeFilter;
  code: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ItemState = {
  rows: [],
  selectedItem: null,
  total: 0,
  page: 1,
  pageSize: 10,
  search: '',
  status: 'all',
  itemType: 'all',
  code: '',
  loading: false,
  saving: false,
  error: null,
  successMessage: null,
};

const itemSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setStatus(state, action: PayloadAction<ItemStatusFilter>) {
      state.status = action.payload;
      state.page = 1;
    },
    setItemType(state, action: PayloadAction<ItemTypeFilter>) {
      state.itemType = action.payload;
      state.page = 1;
    },
    setCode(state, action: PayloadAction<string>) {
      state.code = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.page = 1;
    },
    clearSelectedItem(state) {
      state.selectedItem = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    resetFilters(state) {
      state.search = '';
      state.status = 'all';
      state.itemType = 'all';
      state.code = '';
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch items';
      })
      .addCase(fetchItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedItem = null;
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch item';
      })
      .addCase(createItem.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.saving = false;
        state.selectedItem = action.payload;
        state.successMessage = 'Item created successfully';
      })
      .addCase(createItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to create item';
      })
      .addCase(updateItem.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.saving = false;
        state.selectedItem = action.payload;
        state.rows = state.rows.map((item) => (item.id === action.payload.id ? action.payload : item));
        state.successMessage = 'Item updated successfully';
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to update item';
      })
      .addCase(setItemStatus.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(setItemStatus.fulfilled, (state, action) => {
        state.saving = false;
        state.selectedItem = state.selectedItem?.id === action.payload.id ? action.payload : state.selectedItem;
        state.rows = state.rows.map((item) => (item.id === action.payload.id ? action.payload : item));
        state.successMessage = action.payload.isActive ? 'Item reactivated successfully' : 'Item inactivated successfully';
      })
      .addCase(setItemStatus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to update item status';
      })
      .addCase(deleteItem.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.saving = false;
        state.rows = state.rows.filter((item) => item.id !== action.payload.id);
        state.total = Math.max(0, state.total - 1);
        state.successMessage = action.payload.message;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to delete item';
      });
  },
});

export const {
  setSearch,
  setStatus,
  setItemType,
  setCode,
  setPage,
  setPageSize,
  clearSelectedItem,
  clearError,
  clearSuccessMessage,
  resetFilters,
} = itemSlice.actions;

export default itemSlice.reducer;