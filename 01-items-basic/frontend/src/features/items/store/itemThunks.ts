import { createAsyncThunk } from '@reduxjs/toolkit';
import { itemService } from '../services/itemService';
import { ItemListQuery } from '../types/item.types';

// Dispatched whenever search/status/page changes; the slice's extraReducers track pending/fulfilled/rejected.
export const fetchItems = createAsyncThunk('items/fetchItems', async (query: ItemListQuery) => {
  return itemService.getItemList(query);
});
