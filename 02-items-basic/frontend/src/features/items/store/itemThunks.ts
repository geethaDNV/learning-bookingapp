import { createAsyncThunk } from '@reduxjs/toolkit';
import { itemService } from '../services/itemService';
import { CreateItemPayload, ItemListQuery, UpdateItemPayload, UpdateItemStatusPayload } from '../types/item.types';

export const fetchItems = createAsyncThunk('items/fetchItems', async (query: ItemListQuery) => {
  return itemService.getItemList(query);
});

export const fetchItemById = createAsyncThunk('items/fetchItemById', async (id: number) => {
  return itemService.getById(id);
});

export const createItem = createAsyncThunk('items/createItem', async (payload: CreateItemPayload) => {
  return itemService.create(payload);
});

export const updateItem = createAsyncThunk(
  'items/updateItem',
  async ({ id, payload }: { id: number; payload: UpdateItemPayload }) => {
    return itemService.update(id, payload);
  },
);

export const setItemStatus = createAsyncThunk('items/setItemStatus', async ({ id, isActive }: UpdateItemStatusPayload) => {
  return itemService.setStatus(id, isActive);
});

export const deleteItem = createAsyncThunk('items/deleteItem', async (id: number) => {
  const message = await itemService.delete(id);
  return { id, message };
});