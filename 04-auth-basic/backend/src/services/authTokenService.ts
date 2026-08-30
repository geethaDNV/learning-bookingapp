import jwt from 'jsonwebtoken';
import type { IAuthTokenService, TokenPayload } from '../di/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export class AuthTokenService implements IAuthTokenService {
  signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256',
    });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      });
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
  }

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      });
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }
}
