import { z } from 'zod';

const optionalQueryText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

const optionalBodyText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? null : value));

export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: optionalQueryText(255),
  status: z.enum(['active', 'inactive']).optional(),
  itemType: z.enum(['goods', 'service']).optional(),
  code: optionalQueryText(20),
});

export const itemIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const createItemBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  sku: optionalBodyText(100),
  itemType: z.enum(['goods', 'service']),
  hsnCode: optionalBodyText(20),
  sacCode: optionalBodyText(20),
  isActive: z.boolean().optional().default(true),
});

export const updateItemBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255).optional(),
    sku: optionalBodyText(100),
    itemType: z.enum(['goods', 'service']).optional(),
    hsnCode: optionalBodyText(20),
    sacCode: optionalBodyText(20),
    isActive: z.boolean().optional(),
  })
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

export const updateItemStatusBodySchema = z.object({
  isActive: z.boolean(),
});

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
export type ItemIdParams = z.infer<typeof itemIdParamSchema>;
export type CreateItemBody = z.infer<typeof createItemBodySchema>;
export type UpdateItemBody = z.infer<typeof updateItemBodySchema>;
export type UpdateItemStatusBody = z.infer<typeof updateItemStatusBodySchema>;