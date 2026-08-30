export type PaymentStatus = "PENDING" | "CAPTURED" | "FAILED" | "CANCELLED";
export type PaymentProvider = "mock" | "razorpay";

export interface PaymentDTO {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  publicId: string;
  providerPaymentId: string;
  providerLinkId?: string;
  hostedUrl?: string;
  lastEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDTO {
  id: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paidAmount: number;
  balanceDue: number;
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoicePaymentInfo {
  invoiceId: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
}

export interface CustomerDTO {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NormalizedGatewayEvent {
  provider: PaymentProvider;
  providerEventId: string;
  eventType: "payment.captured" | "payment.failed" | "payment.pending";
  providerPaymentId?: string;
  providerLinkId?: string;
  amount?: number;
  currency?: string;
  occurredAt?: Date;
  metadata: Record<string, unknown>;
}
