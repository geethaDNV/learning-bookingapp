import { Router, Request, Response } from "express";
import { PaymentController } from "../controllers/PaymentController.js";

export function createPaymentRoutes(controller: PaymentController): Router {
  const router = Router();

  /**
   * Create a payment for an invoice
   * POST /api/v1/invoices/:invoiceId/payments
   */
  router.post("/invoices/:invoiceId/payments", (req: Request, res: Response) => {
    return controller.createPayment(req, res);
  });

  /**
   * Get all payments with optional filters
   * GET /api/v1/payments
   */
  router.get("/", (req: Request, res: Response) => {
    return controller.listPayments(req, res);
  });

  /**
   * Get payment by ID
   * GET /api/v1/payments/:id
   */
  router.get("/:id", (req: Request, res: Response) => {
    return controller.getPayment(req, res);
  });

  /**
   * Get payment status by public ID (for public status page)
   * GET /api/v1/payments/public/status/:publicId
   */
  router.get("/public/status/:publicId", (req: Request, res: Response) => {
    return controller.getPaymentByPublicId(req, res);
  });

  /**
   * Simulate payment success (for learning)
   * POST /api/v1/payments/mock/:paymentId/succeed
   */
  router.post("/mock/:paymentId/succeed", (req: Request, res: Response) => {
    return controller.simulatePaymentSuccess(req, res);
  });

  /**
   * Simulate payment failure (for learning)
   * POST /api/v1/payments/mock/:paymentId/fail
   */
  router.post("/mock/:paymentId/fail", (req: Request, res: Response) => {
    return controller.simulatePaymentFailure(req, res);
  });

  return router;
}
