import axios, { AxiosInstance } from "axios";
import { Payment, ApiResponse, PaginatedResponse } from "../types/payment";

const API_BASE_URL = "/api/v1/payments";

export class PaymentApiService {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Create a payment link for an invoice
   */
  async createPaymentLink(invoiceId: string): Promise<Payment> {
    const response = await this.client.post<ApiResponse<Payment>>("/", {
      invoiceId,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to create payment link"
      );
    }

    return response.data.data;
  }

  /**
   * Get payment status by public ID
   */
  async getPaymentStatus(publicId: string): Promise<Payment> {
    const response = await this.client.get<ApiResponse<Payment>>(
      `/${publicId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to fetch payment status"
      );
    }

    return response.data.data;
  }

  /**
   * List all payments with filters
   */
  async listPayments(
    page: number = 1,
    pageSize: number = 10,
    filters?: { status?: string; invoiceId?: string }
  ): Promise<{ payments: Payment[]; total: number; pages: number }> {
    const response = await this.client.get<PaginatedResponse<Payment>>(
      "/",
      {
        params: {
          page,
          pageSize,
          ...filters,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to list payments"
      );
    }

    return {
      payments: response.data.data,
      total: response.data.pagination?.total || 0,
      pages: response.data.pagination?.pages || 1,
    };
  }

  /**
   * Simulate payment success (mock provider only)
   */
  async simulatePaymentSuccess(paymentId: string): Promise<Payment> {
    const response = await this.client.post<ApiResponse<Payment>>(
      `/${paymentId}/simulate/success`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to simulate payment success"
      );
    }

    return response.data.data;
  }

  /**
   * Simulate payment failure (mock provider only)
   */
  async simulatePaymentFailure(paymentId: string): Promise<Payment> {
    const response = await this.client.post<ApiResponse<Payment>>(
      `/${paymentId}/simulate/failure`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to simulate payment failure"
      );
    }

    return response.data.data;
  }
}

// Export singleton instance
export const paymentApiService = new PaymentApiService();
