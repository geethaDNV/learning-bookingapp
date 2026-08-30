import {
  IPaymentGatewayProvider,
  CreateHostedLinkInput,
  HostedLinkResult,
} from "../di/contracts.js";
import {
  NormalizedGatewayEvent,
  PaymentProvider,
} from "../types/payment.types.js";
import {
  generateMockProviderPaymentId,
  generateMockProviderLinkId,
  generateMockHostedUrl,
} from "../utils/helpers.js";
import { createHmac } from "crypto";

/**
 * MockPaymentGatewayProvider - simulates payment provider for learning
 * Useful for testing without Razorpay credentials
 */
export class MockPaymentGatewayProvider implements IPaymentGatewayProvider {
  readonly provider: PaymentProvider = "mock";
  private readonly mockWebhookSecret = "mock-webhook-secret-for-learning";

  async createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult> {
    // Generate mock provider IDs
    const providerPaymentId = generateMockProviderPaymentId();
    const providerLinkId = generateMockProviderLinkId();
    const hostedUrl = generateMockHostedUrl();

    return {
      provider: this.provider,
      providerLinkId,
      hostedUrl,
      metadata: {
        providerPaymentId,
        invoiceId: input.invoiceId,
        customerId: input.customerId,
        idempotencyKey: input.idempotencyKey,
        invoiceNumber: input.invoiceNumber,
      },
    };
  }

  verifyWebhook(rawBody: Buffer, signature: string): boolean {
    // For mock, we just verify the signature using our mock secret
    const expectedSignature = createHmac("sha256", this.mockWebhookSecret)
      .update(rawBody)
      .digest("hex");

    return signature === expectedSignature;
  }

  normalizeWebhook(rawBody: Buffer): NormalizedGatewayEvent {
    try {
      const payload = JSON.parse(rawBody.toString("utf8"));

      return {
        provider: this.provider,
        providerEventId:
          payload.id || `mock-event-${Date.now()}`,
        eventType: payload.eventType || "payment.captured",
        providerPaymentId: payload.providerPaymentId,
        providerLinkId: payload.providerLinkId,
        amount: payload.amount,
        currency: payload.currency || "INR",
        occurredAt: payload.occurredAt
          ? new Date(payload.occurredAt)
          : new Date(),
        metadata: payload.metadata || {},
      };
    } catch (error) {
      throw new Error("Failed to normalize webhook body");
    }
  }

  async fetchPaymentLinkStatus(providerLinkId: string) {
    // Mock implementation - would fetch from mock storage in production
    return {
      provider: this.provider,
      providerLinkId,
      status: "pending",
      amountPaid: 0,
      paymentStatus: "pending",
    };
  }

  /**
   * Generate a signed mock webhook event for testing
   * This is for learning purposes - not in production
   */
  generateMockWebhookSignature(rawBody: Buffer): string {
    return createHmac("sha256", this.mockWebhookSecret)
      .update(rawBody)
      .digest("hex");
  }

  /**
   * Create a mock webhook payload for testing
   * This is for learning purposes - shows webhook structure
   */
  createMockWebhookPayload(
    eventType: "payment.captured" | "payment.failed",
    paymentId: string,
    amount: number,
    currency: string = "INR"
  ): Buffer {
    const payload = {
      id: `mock-event-${Date.now()}`,
      eventType,
      providerPaymentId: paymentId,
      amount,
      currency,
      occurredAt: new Date().toISOString(),
      metadata: {},
    };

    return Buffer.from(JSON.stringify(payload), "utf8");
  }
}
