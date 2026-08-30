import { z } from "zod";

export const CreatePaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

export const MockPaymentCallbackSchema = z.object({
  status: z.enum(["captured", "failed"], {
    errorMap: () => ({ message: "Status must be 'captured' or 'failed'" }),
  }),
});

export const PaymentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
  status: z.string().optional(),
  invoiceId: z.string().optional(),
});
