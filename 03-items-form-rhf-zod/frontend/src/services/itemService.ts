/**
 * Item API Service
 * 
 * Typed API methods for Item operations.
 * Handles HTTP requests and response mapping.
 * Errors are thrown and handled by Redux thunks.
 */

import { Item, ItemListResponse, CreateItemPayload, UpdateItemPayload } from '../types/index';

const API_BASE = '/api';

/**
 * Helper to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      statusCode: response.status,
    }));
    throw error;
  }
  return response.json();
}

/**
 * Create a new item
 * POST /items
 */
export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Item>(response);
}

/**
 * Get item by ID
 * GET /items/:id
 */
export async function getItemById(id: number): Promise<Item> {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'GET',
  });
  return handleResponse<Item>(response);
}

/**
 * Update an existing item
 * PUT /items/:id
 */
export async function updateItem(id: number, payload: UpdateItemPayload): Promise<Item> {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Item>(response);
}

/**
 * Delete an item
 * DELETE /items/:id
 */
export async function deleteItem(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: 'Failed to delete item',
      statusCode: response.status,
    }));
    throw error;
  }
}

/**
 * List items with pagination
 * GET /items?page=1&pageSize=10
 */
export async function listItems(page: number = 1, pageSize: number = 10): Promise<ItemListResponse> {
  const response = await fetch(
    `${API_BASE}/items?page=${page}&pageSize=${pageSize}`,
    { method: 'GET' }
  );
  return handleResponse<ItemListResponse>(response);
}
