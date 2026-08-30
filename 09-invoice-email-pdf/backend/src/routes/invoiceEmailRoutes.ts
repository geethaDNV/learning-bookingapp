import { Router } from 'express';
import { InvoiceEmailController } from '@controllers/invoiceEmailController';
import { INVOICE_EMAIL_ROUTE_SEGMENTS } from '@constants/index';

/**
 * Create invoice email routes.
 * 
 * Routes:
 * - POST   /api/v1/invoices/:invoiceId/send-email      (send email)
 * - GET    /api/v1/invoices/:invoiceId/preview-email   (preview)
 */
export const createInvoiceEmailRoutes = (controller: InvoiceEmailController): Router => {
  const router = Router();

  // Send invoice email
  router.post(
    `/:invoiceId/${INVOICE_EMAIL_ROUTE_SEGMENTS.SEND_EMAIL}`,
    (req, res, next) => controller.sendInvoiceEmail(req, res, next)
  );

  // Preview invoice email
  router.get(
    `/:invoiceId/${INVOICE_EMAIL_ROUTE_SEGMENTS.PREVIEW}`,
    (req, res, next) => controller.previewInvoiceEmail(req, res, next)
  );

  return router;
};
