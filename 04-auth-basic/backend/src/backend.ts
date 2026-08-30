import express, { Request, Response } from 'express';
import cors from 'cors';
import { cradle } from './di/container';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware (optional for all routes; required on specific routes)
app.use(cradle.authMiddleware);

// Routes
app.use('/api/v1/auth', cradle.authController);

// Protected demo endpoint
app.get('/api/v1/protected-demo', (req: any, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    message: 'This is a protected endpoint',
    userId: req.auth.userId,
    email: req.auth.email,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware (basic)
app.use((err: any, req: Request, res: Response) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
