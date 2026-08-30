/**
 * Item Form Validation Schema
 * 
 * Defines Zod schema for Item create/edit form.
 * The schema is used by React Hook Form via zodResolver.
 * 
 * Key points:
 * - Infer TypeScript types from the schema using z.infer<>
 * - Optional fields use .optional() to allow undefined in form values
 * - This schema drives both client-side validation and form default values
 */

import { z } from 'zod';

/**
 * Item form schema for both create and edit
 * All fields match the database Item model
 */
export const itemFormSchema = z.object({
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
      errorMap: () => ({ message: 'Select a valid item type' }),
    }),
  hsnCode: z
    .union([
      z.string().max(8, 'HSN code must be 8 characters or less'),
      z.literal(null),
    ])
    .optional()
    .transform(val => val === '' ? null : val),
  sacCode: z
    .union([
      z.string().max(6, 'SAC code must be 6 characters or less'),
      z.literal(null),
    ])
    .optional()
    .transform(val => val === '' ? null : val),
  isActive: z.boolean().default(true),
});

/**
 * Inferred type from schema
 * Use this type for form values in React Hook Form
 */
export type ItemFormValues = z.infer<typeof itemFormSchema>;

/**
 * Helper to convert form values to API payload
 * Removes undefined fields for optional fields
 */
export function formValuesToPayload(values: ItemFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: values.name,
    sku: values.sku,
    itemType: values.itemType,
    isActive: values.isActive,
  };

  // Only include optional fields if they have values
  if (values.hsnCode !== null && values.hsnCode !== undefined) {
    payload.hsnCode = values.hsnCode;
  }
  if (values.sacCode !== null && values.sacCode !== undefined) {
    payload.sacCode = values.sacCode;
  }

  return payload;
}

/**
 * Default form values for create mode
 */
export const defaultFormValues: ItemFormValues = {
  name: '',
  sku: '',
  itemType: 'GOODS',
  hsnCode: null,
  sacCode: null,
  isActive: true,
};
