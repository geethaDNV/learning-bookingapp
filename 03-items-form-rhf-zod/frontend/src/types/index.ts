/**
 * Frontend Type Definitions
 * 
 * Typed API models for Item domain.
 * These match the backend types but are defined independently in the frontend
 * to ensure the frontend can function even if the backend contract changes temporarily.
 */

/**
 * Item data model matching database representation
 */
export interface Item {
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
 * Form values for Item create/edit form
 * Note: Empty strings are used for optional fields (to align with Zod form schema)
 */
export interface ItemFormValues {
  name: string;
  sku: string;
  itemType: string;
  hsnCode: string | null;
  sacCode: string | null;
  isActive: boolean;
}

/**
 * Payload for creating an item (sent to backend)
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
 * Payload for updating an item (sent to backend)
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
 * API response for list endpoint
 */
export interface ItemListResponse {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API error response format
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
  timestamp?: string;
}
