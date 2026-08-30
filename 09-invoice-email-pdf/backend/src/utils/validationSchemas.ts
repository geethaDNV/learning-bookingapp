import { z } from 'zod';
import { EMAIL_CONSTRAINTS } from '@constants/index';

/**
 * Email validation schema.
 * Checks:
 * - Valid format
 * - Length constraint
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(EMAIL_CONSTRAINTS.MAX_EMAIL_LENGTH, 'Email is too long');

/**
 * Request schema for sending invoice email.
 * 
 * Fields:
 * - to: Primary recipient (required)
 * - cc: Carbon copy recipients (optional array)
 * - bcc: Blind carbon copy recipients (optional array)
 * - subject: Email subject (optional, auto-generated if not provided)
 * - body: Email body HTML (optional, auto-generated if not provided)
 * - attachPdf: Whether to attach invoice PDF (optional, default true)
 * - paymentLink: URL for payment link in email body (optional)
 */
export const sendInvoiceEmailRequestSchema = z.object({
  to: emailSchema,
  cc: z.array(emailSchema).optional(),
  bcc: z.array(emailSchema).optional(),
  subject: z
    .string()
    .max(EMAIL_CONSTRAINTS.MAX_SUBJECT_LENGTH, 'Subject is too long')
    .optional(),
  body: z
    .string()
    .max(EMAIL_CONSTRAINTS.MAX_BODY_LENGTH, 'Body is too long')
    .optional(),
  attachPdf: z.boolean().optional().default(true),
  paymentLink: z.string().url('Invalid payment link URL').optional(),
});

export type SendInvoiceEmailRequest = z.infer<typeof sendInvoiceEmailRequestSchema>;

/**
 * Route params schema for /:invoiceId endpoints.
 */
export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID format'),
});

export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>;
