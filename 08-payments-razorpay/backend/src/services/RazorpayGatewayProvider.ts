import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";
import config from "../config.js";
import {
  IPaymentGatewayProvider,
  CreateHostedLinkInput,
  HostedLinkResult,
} from "../di/contracts.js";
import {
  NormalizedGatewayEvent,
  PaymentProvider,
} from "../types/payment.types.js";
import { ValidationError } from "../errors/CustomErrors.js";

/**
 * RazorpayGatewayProvider - integrates with real Razorpay payment gateway
 * Implements the same interface as MockPaymentGatewayProvider for learning
 */
export class RazorpayGatewayProvider implements IPaymentGatewayProvider {
  readonly provider: PaymentProvider = "razorpay";
  private client: Razorpay | null = null;

  constructor() {
    if (config.razorpay.keyId && config.razorpay.keySecret) {
      this.client = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
    }
  }

  async createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult> {
    const client = this.getClient();

    try {
      // Create a Payment Link in Razorpay
      const link = await client.paymentLink.create({
        amount: Math.round(input.amount * 100), // Razorpay uses paise (1/100th of currency unit)
        currency: input.currency,
        reference_id: input.idempotencyKey,
        description: `Invoice ${input.invoiceNumber}`,
        customer: {
          name: input.customerName || input.invoiceNumber,
          email: input.customerEmail || "",
          contact: input.customerContact || "",
        },
        notify: {
          email: Boolean(input.customerEmail),
          sms: false,
        },
        notes: {
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          invoiceNumber: input.invoiceNumber,
          idempotencyKey: input.idempotencyKey,
        },
      });

      // Type safely extract link data
      const linkRecord = this.asRecord(link);
      const linkId = this.asString(linkRecord.id) || "";
      const shortUrl = this.asString(linkRecord.short_url) || "";
      const orderId = this.asString(linkRecord.order_id);

      return {
        provider: this.provider,
        providerLinkId: linkId,
        hostedUrl: shortUrl,
        metadata: {
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          invoiceNumber: input.invoiceNumber,
          idempotencyKey: input.idempotencyKey,
          ...(orderId ? { orderId } : {}),
        },
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to create Razorpay payment link: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  verifyWebhook(rawBody: Buffer, signature: string): boolean {
    // Verify Razorpay webhook signature using SHA256
    const secret = config.razorpay.webhookSecret;
    if (!secret || !signature) return false;

    try {
      const expectedSignature = createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      // Use timing-safe comparison
      return (
        expectedBuffer.length === signatureBuffer.length &&
        timingSafeEqual(expectedBuffer, signatureBuffer)
      );
    } catch (error) {
      return false;
    }
  }

  normalizeWebhook(rawBody: Buffer): NormalizedGatewayEvent {
    // Parse and normalize Razorpay webhook event to our internal format
    try {
      const root = this.asRecord(
        JSON.parse(rawBody.toString("utf8"))
      );
      const payload = this.asRecord(root.payload);
      const payment = this.asRecord(
        this.asRecord(payload.payment).entity
      );
      const link = this.asRecord(
        this.asRecord(payload.payment_link).entity
      );

      const eventType = this.asString(root.event) || "payment.failed";
      const amountPaise = this.asNumber(payment.amount);
      const notes = this.asRecord(link.notes);

      return {
        provider: this.provider,
        providerEventId: this.asString(root.id) || "",
        eventType: this.normalizeEventType(eventType),
        providerPaymentId: this.asString(payment.id),
        providerLinkId: this.asString(link.id),
        amount: amountPaise ? amountPaise / 100 : undefined, // Convert from paise
        currency: this.asString(payment.currency) || "INR",
        occurredAt: this.asNumber(root.created_at)
          ? new Date(this.asNumber(root.created_at)! * 1000)
          : new Date(),
        metadata: Object.fromEntries(
          Object.entries(notes).filter(
            (entry): entry is [string, string] =>
              typeof entry[1] === "string"
          )
        ),
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to normalize Razorpay webhook: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async fetchPaymentLinkStatus(providerLinkId: string) {
    const client = this.getClient();

    try {
      const link = await client.paymentLink.fetch(providerLinkId);
      const linkRecord = this.asRecord(link);
      const payments = this.asArray(linkRecord.payments).map((p) =>
        this.asRecord(p)
      );

      // Find captured payment or latest payment
      const capturedPayment = payments.find(
        (p) => this.asString(p.status)?.toLowerCase() === "captured"
      );
      const latestPayment = capturedPayment || payments[0];
      const amountPaidPaise = this.asNumber(linkRecord.amount_paid) ||
        this.asNumber(capturedPayment?.amount) || 0;

      return {
        provider: this.provider,
        providerLinkId,
        status: this.asString(linkRecord.status) || "pending",
        amountPaid: amountPaidPaise / 100, // Convert from paise
        paymentStatus: this.asString(latestPayment?.status),
        providerPaymentId: this.asString(latestPayment?.payment_id),
        failureReason: this.asString(latestPayment?.error_description),
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to fetch Razorpay link status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Type-safe helpers for Razorpay API response parsing
   */
  private asRecord(value: unknown): Record<string, unknown> {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private asNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private normalizeEventType(
    razorpayEvent: string
  ): "payment.captured" | "payment.failed" | "payment.pending" {
    if (razorpayEvent.includes("captured")) return "payment.captured";
    if (razorpayEvent.includes("failed")) return "payment.failed";
    return "payment.pending";
  }

  private getClient(): Razorpay {
    if (!this.client) {
      throw new ValidationError(
        "Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
      );
    }
    return this.client;
  }
}
