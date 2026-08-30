import { PaymentDTO } from "../types/payment.types.js";
import {
  IPaymentWebhookService,
  IPaymentRepository,
  IInvoicePaymentApplicationService,
} from "../di/contracts.js";
import { NotFoundError } from "../errors/AppError.js";

/**
 * Webhook/callback service for processing payment events
 * Handles idempotency and invoice payment application
 */
export class PaymentWebhookService implements IPaymentWebhookService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly invoicePaymentService: IInvoicePaymentApplicationService
  ) {}

  async processPaymentEvent(
    paymentId: string,
    eventId: string,
    eventType: string,
    status: string
  ): Promise<PaymentDTO> {
    // Check idempotency: have we already processed this event?
    const lastEventId = await this.paymentRepository.getLastEventId(paymentId);

    if (lastEventId === eventId) {
      // Event already processed, return current payment state
      const payment = await this.paymentRepository.getById(paymentId);
      if (!payment) {
        throw new NotFoundError(`Payment ${paymentId} not found`);
      }
      return payment;
    }

    // Update payment status
    let payment = await this.paymentRepository.updateStatus(paymentId, status);

    // If payment was captured, apply it to invoice
    if (status === "captured") {
      await this.invoicePaymentService.applyPaymentToInvoice(
        payment.invoiceId,
        payment.amount
      );
    }

    // Record the event ID for idempotency
    await this.paymentRepository.recordEventId(paymentId, eventId);

    return payment;
  }
}
