// Zod schemas for validation

import { z } from 'zod';

const customerTypeSchema = z.enum(['business', 'individual']);
const gstinSchema = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN format');
const panSchema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format');

// Customer creation payload schema
export const createCustomerSchema = z.object({
  customerType: customerTypeSchema,
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(255),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gstin: gstinSchema.optional().or(z.literal('')),
  pan: panSchema.optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
}).superRefine((value, context) => {
  if (value.customerType === 'business' && !value.gstin) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['gstin'], message: 'GSTIN is required for a business customer' });
  }
  if (value.customerType === 'individual' && !value.pan) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['pan'], message: 'PAN is required for an individual customer' });
  }
});

// Customer update payload schema
export const updateCustomerSchema = z.object({
  customerType: customerTypeSchema.optional(),
  displayName: z.string().min(2).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gstin: gstinSchema.optional().or(z.literal('')),
  pan: panSchema.optional().or(z.literal('')),
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
  isActive: z.enum(['true', 'false']).optional().transform(v => (v === undefined ? undefined : v === 'true')),
  sortBy: z.enum(['displayName', 'createdAt', 'email', 'phone']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Autocomplete query schema
export const autocompleteQuerySchema = z.object({
  search: z.string().min(1, 'Search term required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  isActive: z.enum(['true', 'false']).optional().transform(v => (v === undefined ? undefined : v === 'true')),
});

// Public ID params schema
export const publicIdParamsSchema = z.object({
  publicId: z.string().uuid(),
});

export const gstinParamsSchema = z.object({
  gstin: gstinSchema,
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
