import { Request, Response } from "express";
import { sendResponse, sendError } from "../utils/apiResponse.js";
import {
  CreatePaymentSchema,
  MockPaymentCallbackSchema,
  PaymentListQuerySchema,
} from "../schemas/payment.schemas.js";
import { IPaymentService } from "../di/contracts.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { PrismaClient } from "@prisma/client";

/**
 * Payment controller - handles HTTP requests and delegates to service
 */
export class PaymentController {
  constructor(
    private readonly paymentService: IPaymentService,
    private readonly prisma: PrismaClient
  ) {}

  createPayment = asyncHandler(async (req: Request, res: Response) => {
    const validated = CreatePaymentSchema.parse(req.body);

    const payment = await this.paymentService.createPayment(validated.invoiceId);

    sendResponse(res, 201, "Payment created successfully", {
      id: payment.id,
      publicId: payment.publicId,
      status: payment.status,
      amount: payment.amount,
      providerPaymentId: payment.providerPaymentId,
      invoiceId: payment.invoiceId,
      message: "Payment ready for processing",
    });
  });

  getPayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = await this.paymentService.getPayment(id);

    sendResponse(res, 200, "Payment retrieved successfully", payment);
  });

  getPaymentByPublicId = asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;

    const payment = await this.paymentService.getPaymentByPublicId(publicId);

    // Also fetch invoice payment info for status page
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        paidAmount: true,
        balanceDue: true,
      },
    });

    sendResponse(res, 200, "Payment status retrieved successfully", {
      id: payment.id,
      publicId: payment.publicId,
      status: payment.status,
      amount: payment.amount,
      invoiceId: payment.invoiceId,
      paidAmount: invoice?.paidAmount || 0,
      balanceDue: invoice?.balanceDue || 0,
      invoiceStatus: invoice?.status || "unknown",
    });
  });

  listPayments = asyncHandler(async (req: Request, res: Response) => {
    const validated = PaymentListQuerySchema.parse(req.query);

    const { items, total } = await this.paymentService.listPayments({
      page: validated.page,
      pageSize: validated.pageSize,
      status: validated.status,
      invoiceId: validated.invoiceId,
    });

    sendResponse(res, 200, "Payments retrieved successfully", items, {
      total,
      page: validated.page,
      pageSize: validated.pageSize,
    });
  });

  simulatePaymentSuccess = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    const payment = await this.paymentService.simulatePaymentSuccess(paymentId);

    sendResponse(res, 200, "Payment marked as captured (simulated)", {
      id: payment.id,
      status: payment.status,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
    });
  });

  simulatePaymentFailure = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    const payment = await this.paymentService.simulatePaymentFailure(paymentId);

    sendResponse(res, 200, "Payment marked as failed (simulated)", {
      id: payment.id,
      status: payment.status,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
    });
  });
}
