import { z } from 'zod';

// Query params for GET /items — only name/sku (via `search`) and `status` are filterable in module 01.
export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;

export const createItemBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  sku: z.string().trim().max(100).optional(),
  itemType: z.enum(['goods', 'service']),
  hsnCode: z.string().trim().max(20).optional(),
  sacCode: z.string().trim().max(20).optional(),
});

export type CreateItemBody = z.infer<typeof createItemBodySchema>;
