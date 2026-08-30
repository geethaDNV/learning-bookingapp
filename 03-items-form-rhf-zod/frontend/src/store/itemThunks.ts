/**
 * Redux Async Thunks for Items
 * 
 * Typed thunks for async API operations.
 * These dispatch actions to update Redux state after API calls.
 * Errors are caught and passed to payload (fulfilled with error data).
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import * as itemService from '../services/itemService';
import { Item, CreateItemPayload, UpdateItemPayload, ItemListResponse, ApiError } from '../types/index';

/**
 * Fetch items list
 */
export const fetchItems = createAsyncThunk<
  ItemListResponse,
  { page?: number; pageSize?: number },
  { rejectValue: ApiError }
>(
  'items/fetchItems',
  async ({ page = 1, pageSize = 10 }, { rejectWithValue }) => {
    try {
      return await itemService.listItems(page, pageSize);
    } catch (error: unknown) {
      return rejectWithValue(error as ApiError);
    }
  }
);

/**
 * Fetch single item by ID
 */
export const fetchItemById = createAsyncThunk<
  Item,
  number,
  { rejectValue: ApiError }
>(
  'items/fetchItemById',
  async (id, { rejectWithValue }) => {
    try {
      return await itemService.getItemById(id);
    } catch (error: unknown) {
      return rejectWithValue(error as ApiError);
    }
  }
);

/**
 * Create a new item
 */
export const createItemThunk = createAsyncThunk<
  Item,
  CreateItemPayload,
  { rejectValue: ApiError }
>(
  'items/createItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await itemService.createItem(payload);
    } catch (error: unknown) {
      return rejectWithValue(error as ApiError);
    }
  }
);

/**
 * Update an existing item
 */
export const updateItemThunk = createAsyncThunk<
  Item,
  { id: number; payload: UpdateItemPayload },
  { rejectValue: ApiError }
>(
  'items/updateItem',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await itemService.updateItem(id, payload);
    } catch (error: unknown) {
      return rejectWithValue(error as ApiError);
    }
  }
);

/**
 * Delete an item
 */
export const deleteItemThunk = createAsyncThunk<
  void,
  number,
  { rejectValue: ApiError }
>(
  'items/deleteItem',
  async (id, { rejectWithValue }) => {
    try {
      return await itemService.deleteItem(id);
    } catch (error: unknown) {
      return rejectWithValue(error as ApiError);
    }
  }
);
