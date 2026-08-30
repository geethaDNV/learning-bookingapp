import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { IPaymentService, IPaymentGatewayProvider } from "../di/contracts.js";
import {
  createPaymentLinkSchema,
  paymentListQuerySchema,
  paymentPublicStatusSchema,
} from "../schemas/payment.schemas.js";
import { ValidationError } from "../errors/CustomErrors.js";

/**
 * Payment controller - handles payment API endpoints
 */
export class PaymentController {
  constructor(
    private paymentService: IPaymentService,
    private gatewayProvider: IPaymentGatewayProvider,
    private prisma: PrismaClient
  ) {}

  /**
   * POST /api/v1/payments
   * Create a payment link for an invoice
   */
  async createPaymentLink(req: Request, res: Response): Promise<void> {
    try {
      const body = createPaymentLinkSchema.parse(req.body);
      const payment = await this.paymentService.createPaymentLink(
        body.invoiceId
      );

      res.status(201).json({
        success: true,
        message: "Payment link created successfully",
        data: payment,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * GET /api/v1/payments/:publicId
   * Get payment by public ID (for status page)
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const payment = await this.paymentService.getPaymentByPublicId(publicId);

      res.status(200).json({
        success: true,
        message: "Payment retrieved successfully",
        data: payment,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /api/v1/payments
   * List payments with filters
   */
  async listPayments(req: Request, res: Response): Promise<void> {
    try {
      const query = paymentListQuerySchema.parse(req.query);
      const result = await this.paymentService.listPayments(query);

      res.status(200).json({
        success: true,
        message: "Payments retrieved successfully",
        data: result.items,
        pagination: {
          total: result.total,
          page: query.page,
          pageSize: query.pageSize,
          pages: Math.ceil(result.total / query.pageSize),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/v1/payments/webhooks/razorpay
   * Handle Razorpay webhook events
   */
  async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      if (!rawBody) {
        throw new ValidationError("Missing raw body");
      }

      const signature = req.headers["x-razorpay-signature"] as string;
      if (!signature) {
        throw new ValidationError("Missing signature header");
      }

      // Verify webhook signature
      if (!this.gatewayProvider.verifyWebhook(rawBody, signature)) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid signature" },
        });
        return;
      }

      // Normalize webhook event
      const event = this.gatewayProvider.normalizeWebhook(rawBody);

      // Extract payment and organization from metadata
      const invoiceId = String(event.metadata.invoiceId || "");
      if (!invoiceId) {
        throw new ValidationError("Missing invoiceId in webhook metadata");
      }

      // Find payment by provider payment ID or create logic here
      // For now, we'll assume the payment exists from a previous create call
      // In production, you'd need to look up by providerPaymentId or providerLinkId

      res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "WEBHOOK_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  /**
   * POST /api/v1/payments/:paymentId/simulate/success
   * Simulate payment success (for learning with mock provider)
   */
  async simulatePaymentSuccess(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const payment = await this.paymentService.simulatePaymentSuccess(
        paymentId
      );

      res.status(200).json({
        success: true,
        message: "Payment success simulated",
        data: payment,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/v1/payments/:paymentId/simulate/failure
   * Simulate payment failure (for learning with mock provider)
   */
  async simulatePaymentFailure(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const payment = await this.paymentService.simulatePaymentFailure(
        paymentId
      );

      res.status(200).json({
        success: true,
        message: "Payment failure simulated",
        data: payment,
      });
    } catch (error) {
      throw error;
    }
  }
}
