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
  unit: string;
  salesPrice: number;
  isActive: boolean;
  image: ItemImageMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemImageMetadata {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  imageDataUrl: string;
  thumbnailDataUrl: string;
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
  unit: string;
  salesPrice: number;
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
  unit?: string;
  salesPrice?: number;
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
  unit?: string;
  salesPrice?: number;
  isActive?: boolean;
}

export interface ItemImageUploadResult {
  item: Item;
  image: ItemImageMetadata;
}

export type ItemExportFormat = 'csv' | 'xlsx';

export interface ItemExportFilters {
  itemType?: string;
  isActive?: boolean;
}

export interface ItemImportOptions {
  fieldMapping: Record<string, string>;
  duplicateHandling: 'skip' | 'overwrite';
  uniqueKey: 'sku' | 'name';
}

export interface ParsedImportRow {
  rowNumber: number;
  source: Record<string, string>;
  item: CreateItemPayload;
}

export interface ItemImportRowError {
  rowNumber: number;
  field: string;
  message: string;
  rawValue?: string;
}

export interface ItemImportPreviewResult {
  fileName: string;
  headers: string[];
  validRows: ParsedImportRow[];
  errors: ItemImportRowError[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export interface ItemImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ItemImportRowError[];
  errorReportCsv: string;
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
