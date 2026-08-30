import { IPaymentWebhookService, IPaymentRepository } from "../di/contracts.js";
import { IInvoicePaymentApplicationService } from "../di/contracts.js";
import { PaymentDTO, NormalizedGatewayEvent } from "../types/payment.types.js";
import { NotFoundError, ConflictError } from "../errors/CustomErrors.js";

/**
 * Handles webhook event processing with idempotency
 * Prevents duplicate payment application
 */
export class PaymentWebhookService implements IPaymentWebhookService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private invoicePaymentApplicationService: IInvoicePaymentApplicationService
  ) {}

  async processPaymentEvent(
    paymentId: string,
    event: NormalizedGatewayEvent
  ): Promise<PaymentDTO> {
    // Get the payment
    const payment = await this.paymentRepository.getById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${paymentId}`);
    }

    // Check idempotency: has this event been processed before?
    const lastEventId = await this.paymentRepository.getLastEventId(paymentId);
    if (lastEventId === event.providerEventId) {
      // Event already processed, return existing payment
      console.log(
        `Duplicate event detected: ${event.providerEventId}, skipping`
      );
      return payment;
    }

    // Record event ID for idempotency
    await this.paymentRepository.recordEventId(
      paymentId,
      event.providerEventId
    );

    // Process based on event type
    let updatedPayment = payment;

    if (event.eventType === "payment.captured" && event.amount) {
      // Apply payment to invoice
      await this.invoicePaymentApplicationService.applyPaymentToInvoice(
        payment.invoiceId,
        event.amount
      );

      // Update payment status
      updatedPayment = await this.paymentRepository.updateStatus(
        paymentId,
        "CAPTURED"
      );
    } else if (event.eventType === "payment.failed") {
      // Mark payment as failed
      updatedPayment = await this.paymentRepository.updateStatus(
        paymentId,
        "FAILED"
      );
    }

    return updatedPayment;
  }
}
