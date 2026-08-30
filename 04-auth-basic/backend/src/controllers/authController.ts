import { Router, Response } from 'express';
import type { IAuthService } from '../di/types';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { SignUpSchema, SignInSchema, RefreshTokenSchema, SignUpInput, SignInInput, RefreshTokenInput } from '../schemas/authSchemas';
import { ValidationError } from '../errors/appError';

export function createAuthController(authService: IAuthService) {
  const router = Router();

  router.post('/signup', async (req, res: Response) => {
    try {
      const body = SignUpSchema.parse(req.body);
      const result = await authService.signup(body);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  router.post('/signin', async (req, res: Response) => {
    try {
      const body = SignInSchema.parse(req.body);
      const result = await authService.signin(body);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = (error as any).statusCode || 400;
        res.status(statusCode).json({
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  router.post('/refresh', async (req, res: Response) => {
    try {
      const body = RefreshTokenSchema.parse(req.body);
      const result = await authService.refresh(body.refreshToken);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = (error as any).statusCode || 400;
        res.status(statusCode).json({
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In a real app, you'd extract sessionId from somewhere
      // For now, we just acknowledge logout
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await authService.getCurrentUser(req.auth.userId);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = (error as any).statusCode || 400;
        res.status(statusCode).json({
          error: error.name,
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return router;
}
