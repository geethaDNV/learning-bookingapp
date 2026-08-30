// Payment feature contracts (interfaces)

import {
  PaymentDTO,
  InvoicePaymentInfo,
  NormalizedGatewayEvent,
  PaymentProvider,
} from "../types/payment.types.js";

/**
 * CreateHostedLinkInput - parameters for creating a payment link
 */
export interface CreateHostedLinkInput {
  amount: number;
  currency: string;
  invoiceNumber: string;
  invoiceId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  idempotencyKey: string;
}

/**
 * HostedLinkResult - result of creating a payment link
 */
export interface HostedLinkResult {
  provider: PaymentProvider;
  providerLinkId: string;
  hostedUrl: string;
  metadata: Record<string, unknown>;
}

/**
 * IPaymentGatewayProvider - abstracts payment provider integration
 * Both mock and Razorpay implement this interface
 */
export interface IPaymentGatewayProvider {
  provider: PaymentProvider;

  /**
   * Create a hosted payment link
   */
  createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(rawBody: Buffer, signature: string): boolean;

  /**
   * Normalize webhook body to our internal event format
   */
  normalizeWebhook(rawBody: Buffer): NormalizedGatewayEvent;

  /**
   * Fetch current link status from provider
   */
  fetchPaymentLinkStatus(providerLinkId: string): Promise<{
    provider: PaymentProvider;
    providerLinkId: string;
    status: string;
    amountPaid?: number;
    paymentStatus?: string;
    providerPaymentId?: string;
    failureReason?: string;
  }>;
}

export interface IPaymentNumberService {
  /**
   * Generate a unique public payment ID for status pages
   */
  generatePublicId(): Promise<string>;
}

export interface IPaymentRepository {
  /**
   * Create a new payment record
   */
  create(
    invoiceId: string,
    customerId: string,
    amount: number,
    currency: string,
    publicId: string,
    providerPaymentId: string,
    providerLinkId: string,
    hostedUrl: string,
    provider: PaymentProvider
  ): Promise<PaymentDTO>;

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
  updateProviderPaymentId(
    id: string,
    providerPaymentId: string
  ): Promise<PaymentDTO>;

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
    event: NormalizedGatewayEvent
  ): Promise<PaymentDTO>;
}

export interface IPaymentService {
  /**
   * Create a payment link for an invoice
   */
  createPaymentLink(invoiceId: string): Promise<PaymentDTO>;

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
   * Simulate payment success (for learning/testing with mock provider)
   */
  simulatePaymentSuccess(paymentId: string): Promise<PaymentDTO>;

  /**
   * Simulate payment failure (for learning/testing with mock provider)
   */
  simulatePaymentFailure(paymentId: string): Promise<PaymentDTO>;
}
