import express, { Express } from 'express';
import cors from 'cors';
import config from '@config/index';
import { ServiceContainer } from '@di/container';
import { InvoiceEmailController } from '@controllers/invoiceEmailController';
import { createInvoiceEmailRoutes } from '@routes/invoiceEmailRoutes';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { INVOICE_EMAIL_ROUTE_SEGMENTS } from '@constants/index';

/**
 * Express server setup for invoice email module.
 * 
 * Architecture:
 * 1. DI Container: Creates and wires all dependencies
 * 2. Controller: Handles HTTP requests/responses
 * 3. Service: Business logic and orchestration
 * 4. Repository: Data access layer
 * 5. Email Service: Provider abstraction (Mock or Resend)
 */
const createApp = (): Express => {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────────────────

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());

  // ── Health Check ──────────────────────────────────────────────────────────

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        emailProvider: config.email.provider,
      },
    });
  });

  // ── DI Container & Controllers ────────────────────────────────────────────

  const container = ServiceContainer.getInstance();
  const invoiceEmailController = new InvoiceEmailController(
    container.getInvoiceEmailService()
  );

  // ── Routes ────────────────────────────────────────────────────────────────

  const invoiceEmailRoutes = createInvoiceEmailRoutes(invoiceEmailController);
  app.use(`${INVOICE_EMAIL_ROUTE_SEGMENTS.BASE}`, invoiceEmailRoutes);

  // ── API Info ──────────────────────────────────────────────────────────────

  app.get('/api/v1', (req, res) => {
    res.json({
      name: '09-invoice-email-pdf API',
      version: '1.0.0',
      endpoints: {
        health: 'GET /health',
        sendEmail: `POST /api/v1/invoices/{invoiceId}/${INVOICE_EMAIL_ROUTE_SEGMENTS.SEND_EMAIL}`,
        previewEmail: `GET /api/v1/invoices/{invoiceId}/${INVOICE_EMAIL_ROUTE_SEGMENTS.PREVIEW}`,
      },
      config: {
        emailProvider: config.email.provider,
      },
    });
  });

  // ── Error Handling ────────────────────────────────────────────────────────

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

// ── Server Start ──────────────────────────────────────────────────────────────

const startServer = (): void => {
  const app = createApp();
  const port = config.server.port;

  app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║  09-Invoice-Email-PDF Server Running                              ║
╠════════════════════════════════════════════════════════════════════╣
║  Port:           ${port}                                                    ║
║  Environment:    ${config.server.nodeEnv}                                   ║
║  Email Provider: ${config.email.provider}                                     ║
╠════════════════════════════════════════════════════════════════════╣
║  API:     http://localhost:${port}/api/v1                              ║
║  Health:  http://localhost:${port}/health                              ║
╚════════════════════════════════════════════════════════════════════╝
    `);
  });
};

// Start if running directly
if (require.main === module) {
  startServer();
}

export { createApp };
