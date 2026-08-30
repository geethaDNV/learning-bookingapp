import { get, post } from "../../../services/api";
import {
  Payment,
  PaymentStatus,
  CreatePaymentResponse,
  PaymentListResponse,
} from "../types/payment.types";

export const paymentAPI = {
  /**
   * Create a payment for an invoice
   */
  createPayment: async (invoiceId: string): Promise<CreatePaymentResponse> => {
    return post(`/payments/invoices/${invoiceId}/payments`, {
      invoiceId,
    });
  },

  /**
   * Get payment by ID
   */
  getPayment: async (id: string): Promise<Payment> => {
    return get(`/payments/${id}`);
  },

  /**
   * Get payment status by public ID (for status page)
   */
  getPaymentStatus: async (publicId: string): Promise<PaymentStatus> => {
    return get(`/payments/public/status/${publicId}`);
  },

  /**
   * List all payments with filters
   */
  listPayments: async (
    page?: number,
    pageSize?: number,
    status?: string,
    invoiceId?: string
  ): Promise<PaymentListResponse> => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (pageSize) params.append("pageSize", pageSize.toString());
    if (status) params.append("status", status);
    if (invoiceId) params.append("invoiceId", invoiceId);

    return get(`/payments?${params.toString()}`);
  },

  /**
   * Simulate payment success (for learning)
   */
  simulatePaymentSuccess: async (paymentId: string): Promise<Payment> => {
    return post(`/payments/mock/${paymentId}/succeed`, {});
  },

  /**
   * Simulate payment failure (for learning)
   */
  simulatePaymentFailure: async (paymentId: string): Promise<Payment> => {
    return post(`/payments/mock/${paymentId}/fail`, {});
  },
};
