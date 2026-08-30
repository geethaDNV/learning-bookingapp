export const ITEM_IMAGE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const ITEM_IMAGE_UPLOAD_LIMITS = {
  MAX_SIZE_BYTES: 2 * 1024 * 1024,
};

export const ITEM_IMPORT_ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const ITEM_EXPORT_FORMATS = ['csv', 'xlsx'] as const;

export const ITEM_IMPORT_FIELD_KEYS = [
  'name',
  'sku',
  'itemType',
  'unit',
  'salesPrice',
  'hsnCode',
  'sacCode',
  'isActive',
] as const;

export const DEFAULT_IMPORT_FIELD_MAPPING: Record<string, string> = {
  name: 'Name',
  sku: 'SKU',
  itemType: 'Item Type',
  unit: 'Unit',
  salesPrice: 'Sales Price',
  hsnCode: 'HSN Code',
  sacCode: 'SAC Code',
  isActive: 'Active',
};

export const REQUIRED_IMPORT_FIELDS = ['name', 'sku', 'itemType'] as const;
