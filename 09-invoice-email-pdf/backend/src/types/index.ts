// ── Email Service Contracts ──────────────────────────────────────────────────

/**
 * Input for sending an invoice email.
 * This is what the controller/service layer will prepare
 * before passing to the email provider.
 */
export interface SendInvoiceEmailInput {
  /** Recipient email address */
  to: string;
  /** CC recipients (optional) */
  cc?: string[];
  /** BCC recipients (optional) */
  bcc?: string[];
  /** Email subject line */
  subject: string;
  /** Email body (HTML) */
  body: string;
  /** Invoice PDF as buffer (optional, for attachment) */
  invoicePdfBuffer?: Buffer;
  /** Invoice number (used in attachment filename) */
  invoiceNumber: string;
  /** Optional payment link to include in body */
  paymentLink?: string;
}

/**
 * Result returned from email provider after sending.
 */
export interface SendEmailResult {
  /** Unique message ID from provider (if applicable) */
  messageId?: string;
  /** Whether send was successful */
  success: boolean;
  /** Error message if send failed */
  error?: string;
  /** Email provider name (for debugging/logging) */
  provider?: string;
}

/**
 * Core email service contract.
 * Implementations: MockEmailService, ResendEmailService
 */
export interface IEmailService {
  /**
   * Send an invoice email through the configured provider.
   * Validates recipient emails before sending.
   */
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult>;

  /**
   * Validate an email address format.
   */
  validateEmail(email: string): boolean;
}

// ── Invoice/Customer Models (Minimal for Learning) ────────────────────────────

/**
 * Customer model for invoice context.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  createdAt: Date;
}

/**
 * Invoice model for email context.
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: Date;
}

// ── Repository Contracts ─────────────────────────────────────────────────────

/**
 * Invoice repository contract.
 * Used to load invoice data before sending email.
 */
export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
}

/**
 * Customer repository contract.
 * Used to load customer data (name, email) for email content.
 */
export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
}

// ── Invoice Email Service Contract ───────────────────────────────────────────

/**
 * Higher-level service that orchestrates invoice email workflow:
 * - Load invoice and customer data
 * - Prepare email content
 * - Call email provider
 */
export interface IInvoiceEmailService {
  /**
   * Send invoice email by loading data and preparing content.
   * Throws ValidationError or NotFoundError if data is invalid/missing.
   */
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult>;

  /**
   * Generate preview email content without sending.
   * Useful for frontend to show what will be sent.
   */
  previewInvoiceEmail(invoiceId: string, customizableBody?: string): Promise<{ subject: string; body: string }>;
}

// ── API Payload Types ────────────────────────────────────────────────────────

/**
 * Request payload for sending invoice email via API.
 */
export interface SendInvoiceEmailRequest {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject?: string; // Auto-generated if not provided
  body?: string; // Auto-generated if not provided
  attachPdf?: boolean;
  paymentLink?: string;
}

/**
 * Response payload after sending email.
 */
export interface SendInvoiceEmailResponse {
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
export interface InvoiceEmailPreviewResponse {
  subject: string;
  body: string;
  bodyHtml: string;
  recipientEmail: string;
  timestamp: string;
}
