import { z } from "zod";

export const PostPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  idempotencyKey: z.string().optional(),
});

export const RefundPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
});

export const MarkReconciledSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  bankReference: z.string().optional(),
  notes: z.string().optional(),
});

export const CreatePaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentGatewayId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export type PostPaymentInput = z.infer<typeof PostPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof RefundPaymentSchema>;
export type MarkReconciledInput = z.infer<typeof MarkReconciledSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
