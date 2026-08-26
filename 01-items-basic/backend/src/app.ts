import cors from 'cors';
import express from 'express';
import itemsRouter from './routes/items';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/items', itemsRouter);

  app.use(errorHandler);

  return app;
}
