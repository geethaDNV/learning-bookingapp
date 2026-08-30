// Payment feature contracts (interfaces)

import { PaymentDTO, InvoicePaymentInfo } from "./payment.types.js";

export interface IPaymentGatewayProvider {
  /**
   * Create a payment intent/link
   * In real Razorpay, this would call their API
   * Here we generate a mock provider ID
   */
  createPaymentIntent(
    paymentId: string,
    amount: number,
    description: string
  ): Promise<{ providerPaymentId: string; paymentLink: string }>;

  /**
   * Get payment status from provider
   */
  getPaymentStatus(providerPaymentId: string): Promise<string>;
}

export interface IPaymentNumberService {
  /**
   * Generate a unique public payment number/ID for status pages
   */
  generatePublicId(): Promise<string>;
}

export interface IPaymentRepository {
  /**
   * Create a new payment record
   */
  create(invoiceId: string, customerId: string, amount: number, publicId: string, providerPaymentId: string): Promise<PaymentDTO>;

  /**
   * Get payment by ID
   */
  getById(id: string): Promise<PaymentDTO | null>;

  /**
   * Get payment by public ID (for status page)
   */
  getByPublicId(publicId: string): Promise<PaymentDTO | null>;

  /**
   * List payments with filters
   */
  list(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    invoiceId?: string;
  }): Promise<{ items: PaymentDTO[]; total: number }>;

  /**
   * Update payment status
   */
  updateStatus(id: string, status: string): Promise<PaymentDTO>;

  /**
   * Update provider payment ID
   */
  updateProviderPaymentId(id: string, providerPaymentId: string): Promise<PaymentDTO>;

  /**
   * Record last processed event ID for idempotency
   */
  recordEventId(id: string, eventId: string): Promise<void>;

  /**
   * Get last processed event ID
   */
  getLastEventId(id: string): Promise<string | null>;
}

export interface IInvoicePaymentApplicationService {
  /**
   * Apply a captured payment to an invoice
   * Updates invoice paidAmount, balanceDue, and status
   */
  applyPaymentToInvoice(invoiceId: string, amount: number): Promise<InvoicePaymentInfo>;

  /**
   * Get current invoice payment info
   */
  getInvoicePaymentInfo(invoiceId: string): Promise<InvoicePaymentInfo>;
}

export interface IPaymentWebhookService {
  /**
   * Process a payment event (success/failure/etc)
   * Handles idempotency and calls invoice application service
   */
  processPaymentEvent(
    paymentId: string,
    eventId: string,
    eventType: string,
    status: string
  ): Promise<PaymentDTO>;
}

export interface IPaymentService {
  /**
   * Create a payment for an invoice
   */
  createPayment(invoiceId: string): Promise<PaymentDTO>;

  /**
   * Get payment by ID
   */
  getPayment(id: string): Promise<PaymentDTO>;

  /**
   * Get payment by public ID (for status page)
   */
  getPaymentByPublicId(publicId: string): Promise<PaymentDTO>;

  /**
   * List payments
   */
  listPayments(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    invoiceId?: string;
  }): Promise<{ items: PaymentDTO[]; total: number }>;

  /**
   * Simulate payment success (for learning/testing)
   */
  simulatePaymentSuccess(paymentId: string): Promise<PaymentDTO>;

  /**
   * Simulate payment failure (for learning/testing)
   */
  simulatePaymentFailure(paymentId: string): Promise<PaymentDTO>;
}
