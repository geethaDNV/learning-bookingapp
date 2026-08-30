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
 * Payload for creating a new item
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
 * Payload for updating an existing item
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
  item: ItemResponse;
  image: ItemImageMetadata;
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

export interface ItemExportFilters {
  itemType?: string;
  isActive?: boolean;
}

export interface ItemExportResult {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
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
