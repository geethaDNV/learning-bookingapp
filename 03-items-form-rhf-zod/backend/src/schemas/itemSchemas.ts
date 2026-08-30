/**
 * Zod Schemas for Item Validation
 * 
 * Define validation schemas for:
 * - Request payloads (create, update, query params)
 * - These schemas ensure type safety and validation at the API boundary
 */

import { z } from 'zod';

/**
 * Schema for creating a new item
 */
export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be 50 characters or less'),
  itemType: z
    .enum(['GOODS', 'SERVICES', 'CONSUMABLE'], {
      errorMap: () => ({ message: 'Item type must be GOODS, SERVICES, or CONSUMABLE' }),
    }),
  hsnCode: z
    .string()
    .max(8, 'HSN code must be 8 characters or less')
    .nullable()
    .optional(),
  sacCode: z
    .string()
    .max(6, 'SAC code must be 6 characters or less')
    .nullable()
    .optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for updating an item (all fields optional)
 */
export const updateItemSchema = createItemSchema.partial();

/**
 * Schema for URL parameters containing item ID
 */
export const itemIdSchema = z.object({
  id: z.coerce.number().int().positive('Item ID must be a positive integer'),
});

/**
 * Schema for list query parameters
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
});

// Export inferred types for use in services and controllers
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemIdParam = z.infer<typeof itemIdSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
