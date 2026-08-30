import { PrismaClient } from "@prisma/client";
import { IPaymentService, IPaymentRepository } from "../di/contracts.js";
import { IPaymentGatewayProvider } from "../di/contracts.js";
import { IPaymentNumberService } from "../di/contracts.js";
import { IPaymentWebhookService } from "../di/contracts.js";
import { PaymentDTO } from "../types/payment.types.js";
import { NotFoundError, ValidationError } from "../errors/CustomErrors.js";
import { MockPaymentGatewayProvider } from "./MockPaymentGatewayProvider.js";

/**
 * Core payment service
 * Orchestrates payment creation, status updates, and webhook processing
 */
export class PaymentService implements IPaymentService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private paymentNumberService: IPaymentNumberService,
    private gatewayProvider: IPaymentGatewayProvider,
    private paymentWebhookService: IPaymentWebhookService,
    private prisma: PrismaClient
  ) {}

  async createPaymentLink(invoiceId: string): Promise<PaymentDTO> {
    // Fetch invoice
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice not found: ${invoiceId}`);
    }

    // Fetch customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: invoice.customerId },
    });

    if (!customer) {
      throw new NotFoundError(
        `Customer not found: ${invoice.customerId}`
      );
    }

    // Generate public ID for payment
    const publicId = await this.paymentNumberService.generatePublicId();

    // Create payment link with gateway provider
    const hostedLinkResult = await this.gatewayProvider.createHostedLink({
      amount: invoice.amount,
      currency: invoice.currency || "INR",
      invoiceNumber: invoice.invoiceNumber,
      invoiceId,
      customerId: invoice.customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerContact: customer.phone,
      idempotencyKey: publicId,
    });

    // Extract provider-specific IDs
    const providerPaymentId = String(
      hostedLinkResult.metadata.providerPaymentId || "unknown"
    );
    const providerLinkId = hostedLinkResult.providerLinkId;

    // Create payment record
    const payment = await this.paymentRepository.create(
      invoiceId,
      invoice.customerId,
      invoice.amount,
      invoice.currency || "INR",
      publicId,
      providerPaymentId,
      providerLinkId,
      hostedLinkResult.hostedUrl,
      this.gatewayProvider.provider
    );

    return payment;
  }

  async getPayment(id: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.getById(id);
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${id}`);
    }
    return payment;
  }

  async getPaymentByPublicId(publicId: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.getByPublicId(publicId);
    if (!payment) {
      throw new NotFoundError(`Payment not found with public ID: ${publicId}`);
    }
    return payment;
  }

  async listPayments(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    invoiceId?: string;
  }): Promise<{ items: PaymentDTO[]; total: number }> {
    return this.paymentRepository.list(filters);
  }

  async simulatePaymentSuccess(paymentId: string): Promise<PaymentDTO> {
    // Only works with mock provider
    if (!(this.gatewayProvider instanceof MockPaymentGatewayProvider)) {
      throw new ValidationError(
        "Payment simulation only works with mock provider"
      );
    }

    const payment = await this.getPayment(paymentId);

    // Create and process a mock success event
    const mockPayload = this.gatewayProvider.createMockWebhookPayload(
      "payment.captured",
      payment.providerPaymentId,
      payment.amount,
      payment.currency
    );

    const event = this.gatewayProvider.normalizeWebhook(mockPayload);

    // Process the event
    return this.paymentWebhookService.processPaymentEvent(paymentId, event);
  }

  async simulatePaymentFailure(paymentId: string): Promise<PaymentDTO> {
    // Only works with mock provider
    if (!(this.gatewayProvider instanceof MockPaymentGatewayProvider)) {
      throw new ValidationError(
        "Payment simulation only works with mock provider"
      );
    }

    const payment = await this.getPayment(paymentId);

    // Create and process a mock failure event
    const mockPayload = this.gatewayProvider.createMockWebhookPayload(
      "payment.failed",
      payment.providerPaymentId,
      0, // No amount captured
      payment.currency
    );

    const event = this.gatewayProvider.normalizeWebhook(mockPayload);

    // Process the event
    return this.paymentWebhookService.processPaymentEvent(paymentId, event);
  }
}
