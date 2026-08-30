import { Router, Request, Response, NextFunction } from "express";
import { PaymentController } from "../controllers/PaymentController.js";
import { rawBodyMiddleware } from "../middleware/errorHandler.js";

export function createPaymentRoutes(paymentController: PaymentController): Router {
  const router = Router();

  /**
   * POST /api/v1/payments
   * Create a payment link for an invoice
   */
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      await paymentController.createPaymentLink(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/v1/payments
   * List all payments
   */
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      await paymentController.listPayments(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/v1/payments/:publicId
   * Get payment by public ID
   */
  router.get(
    "/:publicId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await paymentController.getPaymentStatus(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/payments/webhooks/razorpay
   * Razorpay webhook endpoint
   */
  router.post(
    "/webhooks/razorpay",
    rawBodyMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await paymentController.handleRazorpayWebhook(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/payments/:paymentId/simulate/success
   * Simulate payment success (mock provider only)
   */
  router.post(
    "/:paymentId/simulate/success",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await paymentController.simulatePaymentSuccess(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/payments/:paymentId/simulate/failure
   * Simulate payment failure (mock provider only)
   */
  router.post(
    "/:paymentId/simulate/failure",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await paymentController.simulatePaymentFailure(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
