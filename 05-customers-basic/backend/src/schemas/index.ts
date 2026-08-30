// Zod schemas for validation

import { z } from 'zod';

// Customer creation payload schema
export const createCustomerSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(255),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gstin: z.string().max(15).optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
});

// Customer update payload schema
export const updateCustomerSchema = z.object({
  displayName: z.string().min(2).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gstin: z.string().max(15).optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// Customer status update schema
export const statusUpdateSchema = z.object({
  isActive: z.boolean(),
});

// List query schema
export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  sortBy: z.enum(['displayName', 'createdAt', 'email', 'phone']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Autocomplete query schema
export const autocompleteQuerySchema = z.object({
  search: z.string().min(1, 'Search term required'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});

// Public ID params schema
export const publicIdParamsSchema = z.object({
  publicId: z.string().uuid(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
