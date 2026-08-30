/**
 * Frontend type definitions for invoice email feature.
 * Mirrors backend types for type safety across API boundary.
 */

/**
 * Email response from backend API.
 */
export interface SendEmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  provider?: string;
  error?: string;
  timestamp: string;
}

/**
 * Email preview response.
 */
export interface EmailPreviewResponse {
  subject: string;
  body: string;
  bodyHtml: string;
  recipientEmail: string;
  timestamp: string;
}

/**
 * Request payload for sending invoice email.
 */
export interface SendInvoiceEmailRequest {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  attachPdf?: boolean;
  paymentLink?: string;
}

/**
 * Form values for send email dialog.
 */
export interface SendEmailFormValues {
  to: string;
  cc: string; // CSV string, we split on comma
  bcc: string; // CSV string, we split on comma
  subject: string;
  body: string;
  attachPdf: boolean;
  paymentLink: string;
}

/**
 * Invoice data for display.
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
}

/**
 * Customer data for display.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  createdAt: string;
}

/**
 * API error response.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  details?: string;
  timestamp: string;
}
