import { Request, Response } from "express";
import { Cradle } from "../di/container.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  PostPaymentSchema,
  RefundPaymentSchema,
  MarkReconciledSchema,
  CreatePaymentSchema,
} from "../schemas/index.js";

export class PaymentController {
  constructor(private readonly cradle: Cradle) {}

  postPayment = async (req: Request, res: Response) => {
    const payload = PostPaymentSchema.parse(req.body);
    const result = await this.cradle.paymentPostingService.postPayment(payload);
    res.json(successResponse("Payment posted successfully", result));
  };

  refundPayment = async (req: Request, res: Response) => {
    const payload = RefundPaymentSchema.parse(req.body);
    const result = await this.cradle.paymentRefundService.refundPayment(payload);
    res.json(successResponse("Payment refunded successfully", result));
  };

  markReconciled = async (req: Request, res: Response) => {
    const payload = MarkReconciledSchema.parse(req.body);
    const result =
      await this.cradle.paymentReconciliationService.markReconciled(payload);
    res.json(successResponse("Payment marked as reconciled", result));
  };

  getPaymentAccounting = async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const history =
      await this.cradle.paymentAccountingService.getPaymentAccountingHistory(
        paymentId
      );
    res.json(successResponse("Payment accounting history retrieved", history));
  };

  getUnreconciledPayments = async (req: Request, res: Response) => {
    const payments =
      await this.cradle.paymentReconciliationService.getUnreconciledPayments();
    res.json(
      successResponse("Unreconciled payments retrieved", payments, {
        total: payments.length,
        page: 1,
        pageSize: payments.length,
      })
    );
  };

  getReconciliationStatus = async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const status =
      await this.cradle.paymentReconciliationService.getReconciliationStatus(
        paymentId
      );
    res.json(successResponse("Reconciliation status retrieved", status));
  };

  createPayment = async (req: Request, res: Response) => {
    const payload = CreatePaymentSchema.parse(req.body);
    const payment = await this.cradle.paymentRepository.create({
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      paymentGatewayId: payload.paymentGatewayId,
      status: "captured",
      capturedAt: new Date(),
      isPosted: false,
      idempotencyKey: payload.idempotencyKey,
    });
    res.json(successResponse("Payment created successfully", payment));
  };
}

export class AccountController {
  constructor(private readonly cradle: Cradle) {}

  getAllAccounts = async (req: Request, res: Response) => {
    const accounts = await this.cradle.accountingService.getAllAccounts();
    res.json(
      successResponse("Accounts retrieved", accounts, {
        total: accounts.length,
        page: 1,
        pageSize: accounts.length,
      })
    );
  };

  getAccount = async (req: Request, res: Response) => {
    const { id } = req.params;
    const account = await this.cradle.accountingService.getAccount(id);
    res.json(successResponse("Account retrieved", account));
  };
}
