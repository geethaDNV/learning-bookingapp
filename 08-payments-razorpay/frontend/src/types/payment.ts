export type PaymentStatus = "PENDING" | "CAPTURED" | "FAILED" | "CANCELLED";
export type PaymentProvider = "mock" | "razorpay";

export interface Payment {
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
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paidAmount: number;
  balanceDue: number;
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  description?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data?: T[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    pages: number;
  };
}
