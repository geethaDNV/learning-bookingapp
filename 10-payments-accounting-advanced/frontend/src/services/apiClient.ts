import axios, { AxiosInstance } from "axios";
import {
  ApiResponse,
  PostingResult,
  RefundResult,
  ReconciliationResult,
  AccountingHistory,
  Payment,
  Account,
  ReconciliationRecord,
} from "../types/index.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Payment endpoints
  async postPayment(
    paymentId: string,
    idempotencyKey?: string
  ): Promise<PostingResult> {
    const response = await this.client.post<ApiResponse<PostingResult>>(
      `/api/v1/payments/${paymentId}/post`,
      { paymentId, idempotencyKey }
    );
    return response.data.data as PostingResult;
  }

  async refundPayment(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResult> {
    const response = await this.client.post<ApiResponse<RefundResult>>(
      `/api/v1/payments/${paymentId}/refunds`,
      { paymentId, amount, reason }
    );
    return response.data.data as RefundResult;
  }

  async getPaymentAccountingHistory(
    paymentId: string
  ): Promise<AccountingHistory> {
    const response = await this.client.get<ApiResponse<AccountingHistory>>(
      `/api/v1/payments/${paymentId}/accounting`
    );
    return response.data.data as AccountingHistory;
  }

  async createPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    idempotencyKey?: string
  ): Promise<Payment> {
    const response = await this.client.post<ApiResponse<Payment>>(
      `/api/v1/payments`,
      { invoiceId, amount, paymentMethod, idempotencyKey }
    );
    return response.data.data as Payment;
  }

  // Reconciliation endpoints
  async getUnreconciledPayments(): Promise<Payment[]> {
    const response = await this.client.get<ApiResponse<Payment[]>>(
      `/api/v1/reconciliation/payments`
    );
    return response.data.data as Payment[];
  }

  async markReconciled(
    paymentId: string,
    bankReference?: string,
    notes?: string
  ): Promise<ReconciliationResult> {
    const response = await this.client.post<ApiResponse<ReconciliationResult>>(
      `/api/v1/reconciliation/payments/${paymentId}/mark-reconciled`,
      { paymentId, bankReference, notes }
    );
    return response.data.data as ReconciliationResult;
  }

  async getReconciliationStatus(
    paymentId: string
  ): Promise<ReconciliationRecord | null> {
    const response = await this.client.get<
      ApiResponse<ReconciliationRecord | null>
    >(`/api/v1/reconciliation/payments/${paymentId}/status`);
    return response.data.data as ReconciliationRecord | null;
  }

  // Account endpoints
  async getAllAccounts(): Promise<Account[]> {
    const response = await this.client.get<ApiResponse<Account[]>>(
      `/api/v1/accounts`
    );
    return response.data.data as Account[];
  }

  async getAccount(id: string): Promise<Account> {
    const response = await this.client.get<ApiResponse<Account>>(
      `/api/v1/accounts/${id}`
    );
    return response.data.data as Account;
  }
}

export const apiClient = new ApiClient();
