import { z } from "zod";

// Create payment link request body
export const createPaymentLinkSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
});

// Webhook body - flexible schema for Razorpay event
export const webhookBodySchema = z.record(z.unknown());

// Public payment status query parameters
export const paymentPublicStatusSchema = z.object({
  publicId: z.string().min(1, "Public ID is required"),
});

// Payment list query parameters
export const paymentListQuerySchema = z.object({
  page: z.string().optional().default("1").pipe(z.coerce.number().min(1)),
  pageSize: z.string().optional().default("10").pipe(z.coerce.number().min(1).max(100)),
  status: z.string().optional(),
  invoiceId: z.string().uuid().optional(),
});

export type CreatePaymentLinkRequest = z.infer<typeof createPaymentLinkSchema>;
export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;
export type PaymentPublicStatusQuery = z.infer<typeof paymentPublicStatusSchema>;
