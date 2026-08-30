/**
 * Backend Type Definitions
 * 
 * This file defines all TypeScript types and interfaces used in the backend.
 * Strong typing ensures contracts between API and frontend are explicit and validated.
 */

/**
 * Item DTO (Data Transfer Object) returned from API
 */
export interface ItemResponse {
  id: number;
  name: string;
  sku: string;
  itemType: string;
  hsnCode: string | null;
  sacCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for creating a new item
 */
export interface CreateItemPayload {
  name: string;
  sku: string;
  itemType: string;
  hsnCode?: string | null;
  sacCode?: string | null;
  isActive?: boolean;
}

/**
 * Payload for updating an existing item
 */
export interface UpdateItemPayload {
  name?: string;
  sku?: string;
  itemType?: string;
  hsnCode?: string | null;
  sacCode?: string | null;
  isActive?: boolean;
}

/**
 * List response with pagination metadata
 */
export interface ItemListResponse {
  items: ItemResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}
