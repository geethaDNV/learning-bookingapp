import { Router } from "express";
import { Cradle } from "../di/container.js";
import { PaymentController, AccountController } from "../controllers/index.js";
import { asyncHandler } from "../middleware/index.js";

export function createRoutes(cradle: Cradle): Router {
  const router = Router();
  const paymentController = new PaymentController(cradle);
  const accountController = new AccountController(cradle);

  // Payment posting routes
  router.post(
    "/api/v1/payments/:paymentId/post",
    asyncHandler(paymentController.postPayment)
  );

  // Payment refund routes
  router.post(
    "/api/v1/payments/:paymentId/refunds",
    asyncHandler(paymentController.refundPayment)
  );

  // Payment accounting routes
  router.get(
    "/api/v1/payments/:paymentId/accounting",
    asyncHandler(paymentController.getPaymentAccounting)
  );

  // Reconciliation routes
  router.get(
    "/api/v1/reconciliation/payments",
    asyncHandler(paymentController.getUnreconciledPayments)
  );

  router.post(
    "/api/v1/reconciliation/payments/:paymentId/mark-reconciled",
    asyncHandler(paymentController.markReconciled)
  );

  router.get(
    "/api/v1/reconciliation/payments/:paymentId/status",
    asyncHandler(paymentController.getReconciliationStatus)
  );

  // Payment creation (for testing)
  router.post(
    "/api/v1/payments",
    asyncHandler(paymentController.createPayment)
  );

  // Account routes
  router.get(
    "/api/v1/accounts",
    asyncHandler(accountController.getAllAccounts)
  );

  router.get(
    "/api/v1/accounts/:id",
    asyncHandler(accountController.getAccount)
  );

  // Health check
  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  return router;
}
