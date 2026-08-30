import { Request, Response, NextFunction } from 'express';
import type { IAuthTokenService, TokenPayload } from '../di/types';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
  };
}

export function createAuthMiddleware(tokenService: IAuthTokenService) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = undefined;
      return next();
    }

    const token = authHeader.substring('Bearer '.length);
    const payload = tokenService.verifyAccessToken(token);

    if (payload) {
      req.auth = {
        userId: payload.userId,
        email: payload.email,
      };
    }

    next();
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authentication token',
    });
  }
  next();
}
