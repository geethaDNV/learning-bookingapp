/**
 * Item API Service
 * 
 * Typed API methods for Item operations.
 * Handles HTTP requests and response mapping.
 * Errors are thrown and handled by Redux thunks.
 */

import {
  CreateItemPayload,
  Item,
  ItemExportFilters,
  ItemExportFormat,
  ItemImageUploadResult,
  ItemImportOptions,
  ItemImportPreviewResult,
  ItemImportResult,
  ItemListResponse,
  UpdateItemPayload,
} from '../types/index';

const API_BASE = '/api/v1';

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

export async function uploadItemImage(itemId: number, file: File): Promise<ItemImageUploadResult> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/items/${itemId}/image`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<ItemImageUploadResult>(response);
}

export async function deleteItemImage(itemId: number): Promise<Item> {
  const response = await fetch(`${API_BASE}/items/${itemId}/image`, {
    method: 'DELETE',
  });

  return handleResponse<Item>(response);
}

export async function previewItemImport(file: File, options: ItemImportOptions): Promise<ItemImportPreviewResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options));

  const response = await fetch(`${API_BASE}/items/import/preview`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<ItemImportPreviewResult>(response);
}

export async function confirmItemImport(file: File, options: ItemImportOptions): Promise<ItemImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options));

  const response = await fetch(`${API_BASE}/items/import/confirm`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<ItemImportResult>(response);
}

export async function exportItems(format: ItemExportFormat, filters: ItemExportFilters = {}): Promise<void> {
  const params = new URLSearchParams({ format });
  if (filters.itemType) {
    params.set('itemType', filters.itemType);
  }
  if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  const response = await fetch(`${API_BASE}/items/export?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'EXPORT_FAILED',
      message: 'Failed to export items',
      statusCode: response.status,
    }));
    throw error;
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  const match = contentDisposition?.match(/filename="(?<fileName>[^"]+)"/);
  const fileName = match?.groups?.fileName || `items-export.${format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
