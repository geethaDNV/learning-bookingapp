import axios, { AxiosInstance } from 'axios';
import {
  SendEmailResponse,
  EmailPreviewResponse,
  SendInvoiceEmailRequest,
} from '@types/index';

/**
 * API Service for invoice email feature.
 * 
 * Responsible for:
 * - HTTP communication with backend
 * - Type-safe API calls
 * - Error handling and logging
 * - Base URL and headers setup
 */
export class InvoiceEmailApiService {
  private apiClient: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:4000';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log all requests in development
    if (import.meta.env.DEV) {
      this.apiClient.interceptors.request.use((config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      });

      this.apiClient.interceptors.response.use(
        (response) => {
          console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
          return response;
        },
        (error) => {
          console.error(`[API Error] ${error.response?.status} ${error.config?.url}`, error.response?.data);
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Send invoice email.
   * 
   * POST /api/v1/invoices/{invoiceId}/send-email
   * 
   * @param invoiceId - ID of invoice to send
   * @param payload - Email details (to, cc, bcc, subject, body, etc.)
   * @returns Success response with messageId
   * @throws Error if request fails
   */
  async sendInvoiceEmail(
    invoiceId: string,
    payload: SendInvoiceEmailRequest
  ): Promise<SendEmailResponse> {
    const response = await this.apiClient.post<SendEmailResponse>(
      `/api/v1/invoices/${invoiceId}/send-email`,
      payload
    );
    return response.data;
  }

  /**
   * Preview email before sending.
   * 
   * GET /api/v1/invoices/{invoiceId}/preview-email
   * 
   * @param invoiceId - ID of invoice to preview
   * @param customBody - Optional custom email body
   * @returns Preview with subject, body, recipientEmail
   * @throws Error if request fails
   */
  async previewInvoiceEmail(
    invoiceId: string,
    recipientEmail?: string,
    customBody?: string
  ): Promise<EmailPreviewResponse> {
    const params = new URLSearchParams();
    if (recipientEmail) params.append('to', recipientEmail);
    if (customBody) params.append('body', customBody);

    const response = await this.apiClient.get<EmailPreviewResponse>(
      `/api/v1/invoices/${invoiceId}/preview-email?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get health status of API.
   * Useful to check if backend is running.
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.apiClient.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API info.
   */
  async getApiInfo(): Promise<any> {
    try {
      const response = await this.apiClient.get('/api/v1');
      return response.data;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const invoiceEmailApi = new InvoiceEmailApiService();
