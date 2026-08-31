/**
 * Auth contracts/interfaces defining the service layer contracts.
 * These define what each service must implement.
 */

export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  user: AuthUserDTO;
  tokens: AuthTokens;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<any | null>;
  findById(id: string): Promise<any | null>;
  create(email: string, passwordHash: string, name?: string): Promise<any>;
}

export interface IAuthTokenService {
  signAccessToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload | null;
  signRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(token: string): TokenPayload | null;
}

export interface IAuthSessionService {
  create(userId: string): Promise<string>;
  revoke(sessionId: string): Promise<void>;
  isValid(sessionId: string, userId: string): Promise<boolean>;
}

export interface IAuthService {
  signup(req: SignUpRequest): Promise<AuthResponse>;
  signin(req: SignInRequest): Promise<AuthResponse>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  getCurrentUser(userId: string): Promise<AuthUserDTO>;
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
}
