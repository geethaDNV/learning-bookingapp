import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import itemsRouter from './routes/items';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', module: '02-items-basic' }));
  app.use('/api/v1/items', itemsRouter);

  app.use(errorHandler);

  return app;
}