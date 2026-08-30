import { Request, Response, NextFunction } from 'express';
import { IInvoiceEmailService } from '@types/index';
import { sendInvoiceEmailRequestSchema, invoiceIdParamSchema } from '@utils/validationSchemas';
import { ValidationError, NotFoundError, AppError } from '@errors/index';
import { EMAIL_SUCCESS_MESSAGES } from '@constants/index';

/**
 * Invoice Email Controller - HTTP request handling.
 * 
 * Responsibilities:
 * 1. Parse and validate HTTP request
 * 2. Call business logic service
 * 3. Format and return response
 * 4. Handle errors
 */
export class InvoiceEmailController {
  constructor(private invoiceEmailService: IInvoiceEmailService) {}

  /**
   * POST /api/v1/invoices/:invoiceId/send-email
   * 
   * Send invoice email with provided recipients and optional customization.
   * 
   * Request body:
   * {
   *   to: "customer@example.com",
   *   cc?: ["cc@example.com"],
   *   bcc?: ["bcc@example.com"],
   *   subject?: "Custom subject",
   *   body?: "Custom body (HTML)",
   *   attachPdf?: true,
   *   paymentLink?: "https://pay.example.com/..."
   * }
   * 
   * Response:
   * {
   *   success: true,
   *   message: "Email sent successfully",
   *   messageId?: "msg_123...",
   *   provider?: "mock",
   *   timestamp: "2024-08-30T..."
   * }
   */
  async sendInvoiceEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate route params
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);

      // Validate request body
      const payload = sendInvoiceEmailRequestSchema.parse(req.body);

      // Call service to send email
      const result = await this.invoiceEmailService.sendInvoiceEmail({
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        subject: payload.subject || `Invoice for processing`,
        body: payload.body || `<p>Invoice ready for processing</p>`,
        invoiceNumber: invoiceId,
        paymentLink: payload.paymentLink,
      });

      // Return success response
      res.status(200).json({
        success: result.success,
        message: result.success
          ? EMAIL_SUCCESS_MESSAGES.SEND_SUCCESS
          : result.error,
        messageId: result.messageId,
        provider: result.provider,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/invoices/:invoiceId/preview-email
   * 
   * Preview email that would be sent without actually sending.
   * 
   * Query params:
   * - body?: Custom email body to preview
   * 
   * Response:
   * {
   *   subject: "Invoice ...",
   *   body: "<html>...",
   *   bodyHtml: "<html>...",
   *   recipientEmail: "...",
   *   timestamp: "..."
   * }
   */
  async previewInvoiceEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate route params
      const { invoiceId } = invoiceIdParamSchema.parse(req.params);

      // Get optional custom body from query
      const customBody = req.query.body as string | undefined;

      // Call service to generate preview
      const preview = await this.invoiceEmailService.previewInvoiceEmail(
        invoiceId,
        customBody
      );

      // Return preview response
      res.status(200).json({
        subject: preview.subject,
        body: preview.body,
        bodyHtml: preview.body,
        recipientEmail: req.query.to || 'preview@example.com',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
