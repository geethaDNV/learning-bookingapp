// Payment-related types for the learning module

export interface PaymentDTO {
  id: string;
  publicId: string;
  status: "created" | "pending" | "captured" | "failed" | "cancelled";
  invoiceId: string;
  customerId: string;
  amount: number;
  providerPaymentId: string | null;
  providerName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  invoiceId: string;
}

export interface CreatePaymentResponse {
  id: string;
  publicId: string;
  status: string;
  amount: number;
  providerPaymentId: string | null;
  invoiceId: string;
  message: string;
}

export interface PaymentStatusResponse {
  id: string;
  publicId: string;
  status: string;
  amount: number;
  invoiceId: string;
  paidAmount: number;
  balanceDue: number;
  invoiceStatus: string;
}

export interface MockPaymentCallbackRequest {
  paymentId: string;
  status: "captured" | "failed";
  providerEventId: string;
}

export interface PaymentListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  invoiceId?: string;
}

export interface PaymentListResponse {
  items: PaymentDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InvoicePaymentInfo {
  id: string;
  number: string;
  status: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
}
