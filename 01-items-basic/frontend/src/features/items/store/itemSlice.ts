import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchItems } from './itemThunks';
import { Item, ItemStatusFilter } from '../types/item.types';

interface ItemState {
  rows: Item[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: ItemStatusFilter;
  loading: boolean;
  error: string | null;
}

const initialState: ItemState = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 10,
  search: '',
  status: 'all',
  loading: false,
  error: null,
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
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
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
      });
  },
});

export const { setSearch, setStatus, setPage } = itemSlice.actions;
export default itemSlice.reducer;
