import { z } from "zod";

/**
 * Invoice Line Schema
 */
export const createInvoiceLineSchema = z.object({
  itemId: z.number().int().positive("Item ID must be a positive integer"),
  quantity: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().positive("Quantity must be greater than 0")),
  rate: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().nonnegative("Rate must be non-negative")),
});

export const updateInvoiceLineSchema = createInvoiceLineSchema.extend({
  id: z.number().int().positive().optional(),
});

export type CreateInvoiceLineSchemaType = z.infer<
  typeof createInvoiceLineSchema
>;
export type UpdateInvoiceLineSchemaType = z.infer<
  typeof updateInvoiceLineSchema
>;

/**
 * Invoice Schema
 */
export const createInvoiceSchema = z.object({
  customerId: z
    .number()
    .int()
    .positive("Customer ID must be a positive integer"),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional(),
  lines: z
    .array(createInvoiceLineSchema)
    .min(1, "Invoice must have at least one line"),
});

export const updateInvoiceSchema = z.object({
  customerId: z
    .number()
    .int()
    .positive("Customer ID must be a positive integer")
    .optional(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional(),
  lines: z.array(updateInvoiceLineSchema).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]),
});

export const listInvoicesQuerySchema = z.object({
  status: z
    .enum(["DRAFT", "SENT", "PAID", "CANCELLED"])
    .optional(),
  customerId: z.coerce.number().int().positive().optional(),
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().positive().default(10),
});

export type CreateInvoiceSchemaType = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceSchemaType = z.infer<typeof updateInvoiceSchema>;
export type UpdateInvoiceStatusSchemaType = z.infer<
  typeof updateInvoiceStatusSchema
>;
export type ListInvoicesQuerySchemaType = z.infer<
  typeof listInvoicesQuerySchema
>;
