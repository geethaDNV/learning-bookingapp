# 08-Backend Contracts and Dependency Injection

## Why Contracts (Interfaces)?

In production code, you want to avoid **tight coupling**:

### ❌ Bad: Direct Dependencies

```typescript
class AuthService {
  private userRepository = new UserRepository();  // ← Hard-coded dependency
  private authRepo = new AuthRepository();

  async signin(email: string, password: string) {
    const user = this.userRepository.findByEmail(email);
    // ...
  }
}
```

Problems:
- Hard to test (must use real database)
- Hard to swap implementations (change database, rewrite whole service)
- Circular dependencies possible
- Service creates its own dependencies

### ✅ Good: Injected Dependencies

```typescript
interface IAuthRepository {
  findByEmail(email: string): Promise<any | null>;
  findById(id: string): Promise<any | null>;
  create(email: string, hash: string, name?: string): Promise<any>;
}

class AuthService {
  constructor(
    private authRepository: IAuthRepository,  // ← Injected
    private tokenService: IAuthTokenService
  ) {}

  async signin(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);
    // ...
  }
}
```

Benefits:
- Easy to test (pass mock repository)
- Easy to swap implementations
- Clear dependencies (constructor shows them)
- Service doesn't create its own dependencies

## Contracts in This Module

### IAuthRepository

```typescript
// src/di/types.ts

export interface IAuthRepository {
  findByEmail(email: string): Promise<any | null>;
  findById(id: string): Promise<any | null>;
  create(email: string, passwordHash: string, name?: string): Promise<any>;
}
```

Implementation:

```typescript
// src/repositories/authRepository.ts

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(email: string, passwordHash: string, name?: string) {
    return prisma.user.create({
      data: { email, password: passwordHash, name },
    });
  }
}
```

### IAuthTokenService

```typescript
export interface IAuthTokenService {
  signAccessToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload | null;
  signRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(token: string): TokenPayload | null;
}
```

Implementation:

```typescript
// src/services/authTokenService.ts

export class AuthTokenService implements IAuthTokenService {
  signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256',
    });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  // ... refresh methods
}
```

### IAuthService

```typescript
export interface IAuthService {
  signup(req: SignUpRequest): Promise<AuthResponse>;
  signin(req: SignInRequest): Promise<AuthResponse>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(sessionId: string): Promise<void>;
  getCurrentUser(userId: string): Promise<AuthUserDTO>;
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
}
```

Implementation:

```typescript
// src/services/authService.ts

export class AuthService implements IAuthService {
  constructor(
    private authRepository: IAuthRepository,           // Injected
    private tokenService: IAuthTokenService,          // Injected
    private sessionRepository: AuthSessionRepository  // Injected
  ) {}

  async signup(req: SignUpRequest): Promise<AuthResponse> {
    // Service depends on interfaces, not concrete classes
    const user = await this.authRepository.findByEmail(req.email);
    // ...
  }
}
```

## Dependency Injection Container

The **Cradle** wires everything together:

```typescript
// src/di/container.ts

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
  authMiddleware: Function;

  constructor() {
    // 1. Create repositories
    this.authRepository = new AuthRepository();
    this.sessionRepository = new AuthSessionRepository();

    // 2. Create services (pass dependencies)
    this.tokenService = new AuthTokenService();
    this.authService = new AuthService(
      this.authRepository,        // ← Inject
      this.tokenService,          // ← Inject
      this.sessionRepository      // ← Inject
    );

    // 3. Create controllers (pass services)
    this.authController = createAuthController(this.authService);  // ← Inject

    // 4. Create middleware (pass services)
    this.authMiddleware = createAuthMiddleware(this.tokenService); // ← Inject
  }
}

// Create singleton
export const cradle = new Cradle();
```

## Using the Container

```typescript
// src/backend.ts

import { cradle } from './di/container';

const app = express();

// Use the wired middleware
app.use(cradle.authMiddleware);

// Use the wired controller
app.use('/api/v1/auth', cradle.authController);
```

### Dependency Graph

```
                    Cradle (Singleton)
                        ├─────────────────────────┐
                        │                         │
                    Repositories              Services          Controllers
                        ├──────────┐            │                   │
                        │          │            │                   │
                   AuthRepository   SessionRepository             AuthService
                                                ▲                     ▲
                                                │                     │
                                          IAuthRepository        Depends on:
                                          IAuthTokenService      • IAuthRepository
                                                                 • IAuthTokenService
                                                                 • SessionRepository


                         ┌─────────────────────────┐
                         │  AuthService            │
                         ├─────────────────────────┤
                         │ constructor(            │
                         │   authRepo:             │
                         │     IAuthRepository,    │
                         │   tokenService:         │
                         │     IAuthTokenService,  │
                         │   sessionRepo:          │
                         │     SessionRepository   │
                         │ )                       │
                         └─────────────────────────┘
```

## Testing with Dependency Injection

Because AuthService depends on interfaces, you can pass mocks:

```typescript
// auth.service.test.ts

describe('AuthService', () => {
  it('should signin successfully', async () => {
    // Create mock repository
    const mockAuthRepo: IAuthRepository = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
      }),
      findById: jest.fn(),
      create: jest.fn(),
    };

    // Create mock token service
    const mockTokenService: IAuthTokenService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      verifyAccessToken: jest.fn(),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      verifyRefreshToken: jest.fn(),
    };

    // Create service with mocks
    const authService = new AuthService(
      mockAuthRepo,
      mockTokenService,
      mockSessionRepo
    );

    // Test
    const result = await authService.signin({
      email: 'test@example.com',
      password: 'password',
    });

    // Assertions
    expect(result.user.email).toBe('test@example.com');
    expect(mockAuthRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
  });
});
```

Benefits:
- No database (fast)
- No I/O (predictable)
- Isolated unit test
- Easy to test error cases

## Extension Pattern

To add new features, extend the container:

```typescript
// Adding a new NotificationService

export class Cradle {
  // ... existing services ...

  notificationService: INotificationService;

  constructor() {
    // ... existing setup ...

    // Add new service
    this.notificationService = new NotificationService();
  }
}
```

Update AuthService to use it:

```typescript
export class AuthService implements IAuthService {
  constructor(
    private authRepository: IAuthRepository,
    private tokenService: IAuthTokenService,
    private sessionRepository: AuthSessionRepository,
    private notificationService: INotificationService  // ← New dependency
  ) {}

  async signup(req: SignUpRequest): Promise<AuthResponse> {
    const user = await this.authRepository.create(...);
    
    // Send welcome email
    await this.notificationService.sendWelcomeEmail(user.email);

    return { ... };
  }
}
```

Update container:

```typescript
this.authService = new AuthService(
  this.authRepository,
  this.tokenService,
  this.sessionRepository,
  this.notificationService  // ← Pass new dependency
);
```

## Comparison: With vs Without DI

### Without DI (Tightly Coupled)

```typescript
class AuthService {
  private db = new PrismaClient();  // Hard-coded
  private jwt = require('jsonwebtoken');  // Hard-coded

  async signin(email: string, password: string) {
    const user = this.db.user.findUnique({ where: { email } });
    const token = jwt.sign(...);  // Direct usage
  }
}
```

To test: Must handle database, can't isolate JWT logic.

### With DI (Loosely Coupled)

```typescript
class AuthService {
  constructor(
    private db: IAuthRepository,
    private jwt: IAuthTokenService
  ) {}

  async signin(email: string, password: string) {
    const user = await this.db.findByEmail(email);
    const token = this.jwt.signAccessToken(...);
  }
}
```

To test: Pass mocks, service doesn't know about real implementations.

## Naming Convention

Interfaces typically start with `I`:
- `IAuthRepository` (interface)
- `AuthRepository` (implementation)
- `IAuthService` (interface)
- `AuthService` (implementation)

This makes it clear in code:

```typescript
class AuthService {
  constructor(
    private repo: IAuthRepository,  // ← Clearly an interface
    private service: AuthTokenService  // ← Clearly concrete (no I prefix)
  ) {}
}
```

## Architecture Layers

```
                    Controllers (API handlers)
                            ▲
                            │ Depends on
                            │
                        Services (business logic)
                            ▲
                            │ Depends on
                            │
            Repositories    Middleware    (utilities)
            (data access)   (middleware)
                    │
                    └──────→ Database, External APIs
```

Each layer depends on interfaces, not implementations:
- Controllers depend on `IAuthService`
- Services depend on `IAuthRepository`, `IAuthTokenService`
- Repositories depend on Prisma (can be abstracted further)

## Summary

- **Contracts** (interfaces) define what services must implement
- **Dependency Injection** passes dependencies via constructor
- **Container** (Cradle) wires everything together
- **Benefits**: Easy to test, extend, swap implementations
- **Real-world**: Production code uses sophisticated DI frameworks (NestJS, Spring, etc.)
