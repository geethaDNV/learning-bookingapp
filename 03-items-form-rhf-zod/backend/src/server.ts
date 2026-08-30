/**
 * Express Server Setup
 * 
 * Initializes the Express application with:
 * - CORS configuration
 * - JSON parsing middleware
 * - DI container initialization
 * - Route registration
 * - Error handling
 */

import express, { Express } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Container } from './di/container';
import { createItemRoutes } from './routes/items';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();
const prisma = new PrismaClient();

// Initialize DI container
const cradle = Container.initialize(prisma);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/items', createItemRoutes(cradle));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
    statusCode: 404,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
