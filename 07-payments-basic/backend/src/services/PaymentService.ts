import { v4 as uuidv4 } from "uuid";
import { PaymentDTO } from "../types/payment.types.js";
import {
  IPaymentService,
  IPaymentRepository,
  IPaymentNumberService,
  IPaymentGatewayProvider,
  IPaymentWebhookService,
} from "../di/contracts.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { PrismaClient } from "@prisma/client";

/**
 * Payment service - orchestrates payment creation, status checks, and mock callbacks
 */
export class PaymentService implements IPaymentService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentNumberService: IPaymentNumberService,
    private readonly gatewayProvider: IPaymentGatewayProvider,
    private readonly webhookService: IPaymentWebhookService,
    private readonly prisma: PrismaClient
  ) {}

  async createPayment(invoiceId: string): Promise<PaymentDTO> {
    // Fetch invoice to ensure it exists and has a valid amount
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice ${invoiceId} not found`);
    }

    if (invoice.balanceDue <= 0) {
      throw new ValidationError("Invoice has no outstanding balance");
    }

    // Generate public ID and create payment record
    const publicId = await this.paymentNumberService.generatePublicId();
    const tempProviderPaymentId = `temp_${uuidv4()}`;

    const payment = await this.paymentRepository.create(
      invoiceId,
      invoice.customerId,
      invoice.balanceDue,
      publicId,
      tempProviderPaymentId
    );

    // Call gateway provider to create intent/link
    const { providerPaymentId } = await this.gatewayProvider.createPaymentIntent(
      payment.id,
      invoice.balanceDue,
      `Invoice ${invoice.number}`
    );

    // Update payment with real provider ID
    const updatedPayment = await this.paymentRepository.updateProviderPaymentId(
      payment.id,
      providerPaymentId
    );

    return updatedPayment;
  }

  async getPayment(id: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.getById(id);
    if (!payment) {
      throw new NotFoundError(`Payment ${id} not found`);
    }
    return payment;
  }

  async getPaymentByPublicId(publicId: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.getByPublicId(publicId);
    if (!payment) {
      throw new NotFoundError(`Payment with public ID ${publicId} not found`);
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
    const payment = await this.getPayment(paymentId);

    // Simulate provider webhook with success
    const eventId = `evt_${uuidv4()}`;
    const updatedPayment = await this.webhookService.processPaymentEvent(
      paymentId,
      eventId,
      "payment.captured",
      "captured"
    );

    return updatedPayment;
  }

  async simulatePaymentFailure(paymentId: string): Promise<PaymentDTO> {
    const payment = await this.getPayment(paymentId);

    // Simulate provider webhook with failure
    const eventId = `evt_${uuidv4()}`;
    const updatedPayment = await this.webhookService.processPaymentEvent(
      paymentId,
      eventId,
      "payment.failed",
      "failed"
    );

    return updatedPayment;
  }
}
