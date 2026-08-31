import bcryptjs from 'bcryptjs';
import type {
  IAuthService,
  IAuthRepository,
  IAuthTokenService,
  SignUpRequest,
  SignInRequest,
  AuthTokens,
  TokenPayload,
  AuthResponse,
  AuthUserDTO,
} from '../di/types';
import { AuthSessionRepository } from '../repositories/authSessionRepository';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../errors/appError';

export class AuthService implements IAuthService {
  constructor(
    private authRepository: IAuthRepository,
    private tokenService: IAuthTokenService,
    private sessionRepository: AuthSessionRepository
  ) {}

  async signup(req: SignUpRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.authRepository.findByEmail(req.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash the password
    const passwordHash = await bcryptjs.hash(req.password, 10);

    // Create the user
    const user = await this.authRepository.create(req.email, passwordHash, req.name);

    // Create a refresh session
    const sessionId = await this.sessionRepository.create(user.id);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      sessionId,
    };

    const accessToken = this.tokenService.signAccessToken(tokenPayload);
    const refreshToken = this.tokenService.signRefreshToken(tokenPayload);

    const userDTO = this.mapToDTO(user);

    return {
      user: userDTO,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async signin(req: SignInRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.authRepository.findByEmail(req.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await bcryptjs.compare(req.password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Create a refresh session
    const sessionId = await this.sessionRepository.create(user.id);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      sessionId,
    };

    const accessToken = this.tokenService.signAccessToken(tokenPayload);
    const refreshToken = this.tokenService.signRefreshToken(tokenPayload);

    const userDTO = this.mapToDTO(user);

    return {
      user: userDTO,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const isSessionValid = await this.sessionRepository.isValid(payload.sessionId, payload.userId);
    if (!isSessionValid) {
      throw new AuthenticationError('Invalid or revoked refresh token');
    }

    // Verify user still exists
    const user = await this.authRepository.findById(payload.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.sessionRepository.revoke(payload.sessionId);
    const sessionId = await this.sessionRepository.create(user.id);

    // Generate rotated tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      sessionId,
    };

    const accessToken = this.tokenService.signAccessToken(tokenPayload);
    const newRefreshToken = this.tokenService.signRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload) return;

    const isSessionValid = await this.sessionRepository.isValid(payload.sessionId, payload.userId);
    if (isSessionValid) {
      await this.sessionRepository.revoke(payload.sessionId);
    }
  }

  async getCurrentUser(userId: string): Promise<AuthUserDTO> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.mapToDTO(user);
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    return this.tokenService.verifyAccessToken(token);
  }

  private mapToDTO(user: any): AuthUserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
