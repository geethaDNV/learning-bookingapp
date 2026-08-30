# 10-How This Maps to Production

## Production vs Learning Module

The learning module teaches core concepts, while production adds enterprise features.

## Comparison Matrix

| Feature | Learning | Production |
|---------|----------|------------|
| **Authentication** | Email + password | OAuth, SAML, 2FA |
| **Hashing** | bcryptjs | bcryptjs (same) |
| **Tokens** | JWT | JWT + signed cookies |
| **Refresh** | Simple rotation | Session store + revocation |
| **Database** | SQLite | PostgreSQL/MySQL |
| **ORM** | Prisma | Prisma (same) |
| **Framework** | Express | Express/Koa/Fastify |
| **DI** | Manual container | NestJS/tsyringe |
| **Validation** | Zod | Zod (same) |
| **Frontend** | Redux | Redux/Zustand/Jotai |
| **Deployment** | Local | AWS/GCP/Azure |
| **Monitoring** | Logs | Datadog/New Relic/Sentry |

## Backend Architecture Comparison

### Learning Module

```
Controllers
    ↓
Services (authService)
    ↓
Repositories (authRepository)
    ↓
Prisma ORM
    ↓
SQLite Database
```

File structure:
```
backend/src/
├─ backend.ts (main)
├─ controllers/authController.ts
├─ services/authService.ts, authTokenService.ts
├─ repositories/authRepository.ts
├─ middleware/auth.ts
├─ schemas/authSchemas.ts
└─ di/container.ts
```

### Production (BookKeepingApp)

```
Express App
    ↓
Routes (defined per domain)
    ↓
Controllers (per domain)
    ├─ accountingController.ts
    ├─ authController.ts
    ├─ itemsController.ts
    └─ etc.
    ↓
Services (per domain)
    ├─ auth/
    │  ├─ authService.ts
    │  ├─ authTokenService.ts
    │  ├─ authSessionService.ts
    │  └─ ...
    ├─ items/
    ├─ accounting/
    └─ etc.
    ↓
Repositories (per domain)
    ├─ auth/authRepository.ts
    ├─ items/itemsRepository.ts
    └─ etc.
    ↓
Prisma Client
    ↓
PostgreSQL
```

File structure:
```
backend/
├─ src/
│  ├─ backend.ts (main server setup)
│  ├─ config/ (configuration)
│  ├─ constants/ (per-domain constants)
│  │  ├─ auth/
│  │  ├─ items/
│  │  └─ etc.
│  ├─ controllers/ (HTTP handlers)
│  │  ├─ auth/authController.ts
│  │  ├─ items/itemsController.ts
│  │  └─ etc.
│  ├─ di/ (dependency injection)
│  │  ├─ container.ts
│  │  ├─ types.ts
│  │  └─ per-domain files
│  ├─ errors/ (error classes)
│  ├─ middleware/ (auth, validation, etc.)
│  ├─ repositories/ (data access)
│  ├─ routes/ (route definitions)
│  ├─ schemas/ (Zod schemas)
│  ├─ services/ (business logic)
│  ├─ types/ (shared types)
│  └─ utils/ (utilities)
├─ prisma/
│  └─ schema.prisma (Prisma schema)
├─ docs/ (API documentation)
└─ package.json
```

## From Learning to Production

### Step 1: Add More Domains

Learning: Auth only

```
services/
├─ authService.ts
└─ authTokenService.ts
```

Production: Multiple domains

```
services/
├─ auth/
│  ├─ authService.ts
│  ├─ authTokenService.ts
│  └─ authSessionService.ts
├─ items/
│  ├─ itemService.ts
│  ├─ itemCategoryService.ts
│  └─ ...
├─ accounting/
│  ├─ accountingService.ts
│  └─ ...
└─ common/
   └─ fileUploadService.ts
```

### Step 2: Enhance DI Container

Learning:
```typescript
class Cradle {
  authRepository: IAuthRepository;
  tokenService: IAuthTokenService;
  authService: IAuthService;
}
```

Production:
```typescript
class Cradle {
  // Auth domain
  authRepository: IAuthRepository;
  tokenService: IAuthTokenService;
  authService: IAuthService;

  // Items domain
  itemsRepository: IItemsRepository;
  itemsService: IItemsService;

  // Accounting domain
  accountingRepository: IAccountingRepository;
  accountingService: IAccountingService;

  // Common
  fileUploadService: IFileUploadService;

  constructor() {
    // Wire everything up
    this.setupAuthDomain();
    this.setupItemsDomain();
    this.setupAccountingDomain();
  }

  private setupAuthDomain() { ... }
  private setupItemsDomain() { ... }
  private setupAccountingDomain() { ... }
}
```

Or use a DI framework:

```typescript
// NestJS approach
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthService, AuthRepository, AuthController],
})
export class AuthModule {}

@Module({
  imports: [AuthModule, ItemsModule, AccountingModule],
})
export class AppModule {}
```

### Step 3: Add Advanced Features

#### Session Management
Learning: Simple create/revoke

```typescript
async create(userId: string): Promise<string> {
  const session = await prisma.refreshSession.create({
    data: { userId, expiresAt: ... }
  });
  return session.id;
}
```

Production: Redis for performance

```typescript
async create(userId: string): Promise<string> {
  const sessionId = generateId();
  await redis.setex(
    `session:${sessionId}`,
    REFRESH_TOKEN_TTL,
    JSON.stringify({ userId, createdAt: now })
  );
  return sessionId;
}
```

#### 2FA (Two-Factor Authentication)
Learning: Not implemented

Production:
```typescript
interface ITwoFactorService {
  generateSecret(userId: string): Promise<{ secret: string; qrCode: string }>;
  verify(userId: string, code: string): Promise<boolean>;
}

async signin(req: SignInRequest): Promise<AuthResponse> {
  // ... password verify ...
  
  if (user.twoFactorEnabled) {
    // Send OTP via email/SMS
    await this.twoFactorService.sendOTP(user.id);
    
    // Return partial response, require OTP verification
    return {
      status: 'OTP_REQUIRED',
      userId: user.id,
      sessionToken: generateTemporaryToken()
    };
  }

  return this.generateFullAuthResponse(user);
}
```

#### OAuth Integration
Learning: Not implemented

Production:
```typescript
interface IOAuthService {
  getAuthorizationUrl(provider: 'google' | 'github'): string;
  exchangeCode(provider: string, code: string): Promise<OAuthUser>;
}

async signupWithGoogle(code: string): Promise<AuthResponse> {
  const oauthUser = await this.oauthService.exchangeCode('google', code);
  
  // Find or create user
  let user = await this.authRepository.findByEmail(oauthUser.email);
  
  if (!user) {
    user = await this.authRepository.create(
      oauthUser.email,
      null, // No password for OAuth
      oauthUser.name,
      { linkedAccounts: ['google'] }
    );
  }

  return this.generateAuthResponse(user);
}
```

#### Role-Based Access Control (RBAC)
Learning: Not implemented

Production:
```typescript
interface AuthContext {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
}

// Middleware
export function authorize(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });

    const hasPermission = requiredPermissions.every(perm =>
      req.auth.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Usage
router.delete('/items/:id', authorize('items:delete'), itemController.delete);
```

### Step 4: Frontend Enhancement

Learning: Basic Redux

Production: Complex state management

```typescript
// Learning: Single auth slice
// store/
//   └─ authSlice.ts

// Production: Multiple feature slices
// store/
//   ├─ auth/
//   │  ├─ authSlice.ts
//   │  ├─ authThunks.ts
//   │  └─ authSelectors.ts
//   ├─ items/
//   │  ├─ itemsSlice.ts
//   │  ├─ itemsThunks.ts
//   │  └─ itemsSelectors.ts
//   ├─ common/
//   │  ├─ notificationsSlice.ts
//   │  └─ loadingSlice.ts
//   └─ store.ts
```

Advanced patterns:
```typescript
// RTK Query (for data fetching)
const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  endpoints: (builder) => ({
    me: builder.query<AuthUser, void>({
      query: () => 'auth/me'
    }),
    signin: builder.mutation<AuthResponse, SignInPayload>({
      query: (body) => ({
        url: 'auth/signin',
        method: 'POST',
        body,
      }),
    }),
  }),
});

// Component
const { data: user } = authApi.useGetMeQuery();
const [signin, { isLoading }] = authApi.useSigninMutation();
```

### Step 5: DevOps & Deployment

Learning: `npm run dev` locally

Production: Docker + CI/CD

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
```

CI/CD:
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t app .
      - run: docker push $REGISTRY/app:latest
      - run: kubectl apply -f k8s/
```

## Mapping Learning Files to Production

| Learning | Production |
|----------|------------|
| `src/di/types.ts` | `src/di/types.ts` + per-domain files |
| `src/services/authService.ts` | `src/services/auth/authService.ts` |
| `src/repositories/authRepository.ts` | `src/repositories/auth/authRepository.ts` |
| `src/controllers/authController.ts` | `src/controllers/auth/authController.ts` |
| `src/middleware/auth.ts` | `src/middleware/auth.ts` (same pattern) |
| `src/schemas/authSchemas.ts` | `src/schemas/authSchemas.ts` (same pattern) |

## Production Patterns Not in Learning

1. **Middleware Stack**: Global + domain-specific
2. **Error Handling**: Centralized error handler with logging
3. **Request Logging**: Morgan/Winston for audit trails
4. **Rate Limiting**: Prevent brute-force attacks
5. **CORS**: Fine-grained origin control
6. **API Versioning**: `/api/v1/`, `/api/v2/`
7. **Documentation**: Swagger/OpenAPI
8. **Testing**: Unit, integration, e2e
9. **Monitoring**: Sentry/DataDog for errors
10. **Caching**: Redis for sessions and data

## Learning to Production Checklist

```
Backend:
☐ Split auth into per-domain modules
☐ Add role-based access control
☐ Add 2FA support
☐ Add OAuth integration
☐ Use Redis for sessions
☐ Add rate limiting
☐ Add request logging
☐ Add Swagger documentation
☐ Add comprehensive tests
☐ Add error tracking (Sentry)

Frontend:
☐ Use RTK Query for data fetching
☐ Add state persistence
☐ Add error boundaries
☐ Add analytics
☐ Add feature flags
☐ Add PWA support
☐ Add comprehensive tests
☐ Add E2E tests (Cypress/Playwright)

DevOps:
☐ Add Dockerfile
☐ Add docker-compose
☐ Add GitHub Actions
☐ Add environment configs
☐ Add secrets management
☐ Add monitoring/observability
```

## Summary

- Learning module teaches core patterns (DI, services, repositories)
- Production adds enterprise features (OAuth, 2FA, RBAC, caching)
- Architecture remains the same, complexity increases
- Most learning patterns directly translate to production
- Use this as foundation, build features incrementally
