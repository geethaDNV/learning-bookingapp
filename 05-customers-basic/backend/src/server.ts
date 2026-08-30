// Express Server Entry Point

import express from 'express';
import cors from 'cors';
import { config } from '@config';
import { getContainer, closeContainer } from '@di';
import { registerCustomerRoutes } from '@routes';

async function startServer(): Promise<void> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Get DI container
  const container = getContainer();

  // Register routes
  registerCustomerRoutes(app, container.customerController);

  // Error handling middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Not found',
      data: null,
    });
  });

  // Start server
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} (${config.nodeEnv})`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
    });
    await closeContainer();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
