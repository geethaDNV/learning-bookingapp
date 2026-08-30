// Payment Types
export interface Payment {
  id: string;
  publicId: string;
  status: "created" | "pending" | "captured" | "failed" | "cancelled";
  invoiceId: string;
  customerId: string;
  amount: number;
  providerPaymentId: string | null;
  providerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatus {
  id: string;
  publicId: string;
  status: string;
  amount: number;
  invoiceId: string;
  paidAmount: number;
  balanceDue: number;
  invoiceStatus: string;
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

export interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  pageSize: number;
}
