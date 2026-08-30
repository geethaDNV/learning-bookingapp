import type { IAuthService, IAuthRepository, IAuthTokenService } from './types';
import { AuthRepository } from '../repositories/authRepository';
import { AuthSessionRepository } from '../repositories/authSessionRepository';
import { AuthTokenService } from '../services/authTokenService';
import { AuthService } from '../services/authService';
import { createAuthController } from '../controllers/authController';
import { createAuthMiddleware } from '../middleware/auth';
import type { Router } from 'express';

/**
 * Cradle: the dependency injection container.
 * This holds all instances and wires them together.
 */
export class Cradle {
  // Repositories
  authRepository: IAuthRepository;
  sessionRepository: AuthSessionRepository;

  // Services
  tokenService: IAuthTokenService;
  authService: IAuthService;

  // Controllers
  authController: Router;

  // Middleware
  authMiddleware: (req: any, res: any, next: any) => void;

  constructor() {
    // Instantiate repositories
    this.authRepository = new AuthRepository();
    this.sessionRepository = new AuthSessionRepository();

    // Instantiate services
    this.tokenService = new AuthTokenService();
    this.authService = new AuthService(
      this.authRepository,
      this.tokenService,
      this.sessionRepository
    );

    // Instantiate controllers
    this.authController = createAuthController(this.authService);

    // Instantiate middleware
    this.authMiddleware = createAuthMiddleware(this.tokenService);
  }
}

// Create a singleton instance
export const cradle = new Cradle();
