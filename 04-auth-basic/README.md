# 04-Auth-Basic: Complete Authentication Learning Module

A comprehensive, production-inspired authentication learning module demonstrating email/password signup, signin, token-based auth, refresh sessions, protected routes, and role-based access control.

## Overview

This module teaches authentication not as isolated endpoints but as an integrated flow:

```
Frontend (React + Redux)          Backend (Express + Prisma)
───────────────────────          ────────────────────────

Sign Up Form ──────────────────→ POST /auth/signup
                                 ├─ Hash password
                                 ├─ Create user
                                 └─ Return tokens

Sign In Form ──────────────────→ POST /auth/signin
                                 ├─ Verify password
                                 ├─ Create session
                                 └─ Return tokens

Protected Page ──────────────────→ GET /auth/me
(with token)  (Bearer: token)    └─ Verify token, return user

Protected Endpoint ────────────→ GET /protected-demo
(Bearer token)                  └─ Verify token, return data
```

## What You'll Learn

### Core Concepts
- **Password Hashing**: Why we hash, how bcrypt works
- **Access Tokens**: Short-lived JWTs for request authentication
- **Refresh Tokens**: Long-lived tokens for session continuity
- **Sessions**: Database records for revocation and tracking
- **Middleware**: How backends verify authentication
- **Route Guards**: Frontend and backend protection
- **Contracts**: Interface-based design for testability
- **Dependency Injection**: Loose coupling and composability

### Hands-On Skills
- Build typed Express APIs with Zod validation
- Implement repositories and services with contracts
- Use dependency injection for testable code
- Build React forms with React Hook Form
- Manage auth state with Redux
- Protect routes on frontend and backend
- Handle token refresh transparently
- Debug auth flows end-to-end

## Project Structure

```
04-auth-basic/
├── backend/
│   ├── src/
│   │   ├── backend.ts              # Express server
│   │   ├── db.ts                   # Prisma client
│   │   ├── di/
│   │   │   ├── types.ts            # Contracts
│   │   │   └── container.ts        # DI container (Cradle)
│   │   ├── repositories/
│   │   │   ├── authRepository.ts   # User CRUD
│   │   │   └── authSessionRepository.ts  # Session management
│   │   ├── services/
│   │   │   ├── authService.ts      # Signup, signin, logout
│   │   │   └── authTokenService.ts # Token signing/verification
│   │   ├── controllers/
│   │   │   └── authController.ts   # Routes and handlers
│   │   ├── middleware/
│   │   │   └── auth.ts             # Token verification
│   │   ├── schemas/
│   │   │   └── authSchemas.ts      # Zod validation
│   │   ├── errors/
│   │   │   └── appError.ts         # Error classes
│   │   └── prisma/
│   │       └── schema.prisma       # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── main.tsx                # Entry point
│   │   ├── App.tsx                 # Router
│   │   ├── index.css               # Tailwind
│   │   ├── models/
│   │   │   └── auth.ts             # Types
│   │   ├── services/
│   │   │   ├── authService.ts      # API calls
│   │   │   └── tokenStorage.ts     # localStorage wrapper
│   │   ├── store/
│   │   │   ├── store.ts            # Redux config
│   │   │   ├── authSlice.ts        # State + reducers
│   │   │   └── authThunks.ts       # Async actions
│   │   ├── pages/
│   │   │   ├── SignInPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   └── components/
│   │       └── ProtectedRoute.tsx  # Route guard
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
├── docs/
│   ├── 01-overview.md              # What is auth?
│   ├── 02-password-hashing.md      # Secure passwords
│   ├── 03-signin-and-token-response.md
│   ├── 04-access-token-middleware.md
│   ├── 05-refresh-token-sessions.md
│   ├── 06-frontend-auth-state.md
│   ├── 07-protected-routes.md
│   ├── 08-backend-contracts-and-di.md
│   ├── 09-contract-trace.md        # Follow data through system
│   ├── 10-how-this-maps-to-production.md
│   └── 11-exercises.md
└── README.md (this file)
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite (included in Prisma)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup database
npm run prisma:push

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App runs on `http://localhost:3000`

### Test the Flow

1. **Signup**: http://localhost:3000/signup
   - Create new account
   - Redirects to profile

2. **Profile**: http://localhost:3000/profile
   - Click "Test Protected Endpoint"
   - Calls backend protected route
   - Shows userId and email from token

3. **Logout**: Click logout button
   - Clears tokens
   - Redirects to signin

## Key Concepts Explained

### Password Hashing
Passwords are never stored plain text. Instead:
- User submits "myPassword123"
- Backend hashes with bcryptjs → "$2b$10$N9qo8uLOickgx2ZMRZoXyeI..."
- Hash is stored in database
- On signin, compare submitted password against stored hash

### Tokens
Access tokens are signed JWTs with expiry:
```json
{
  "userId": "clw1234567890",
  "email": "user@example.com",
  "exp": 1708231900
}
```

Signed with `JWT_SECRET` so backend can verify without database query.

### Refresh Sessions
Database table tracks active sessions:
```
id          userId         expiresAt           revokedAt
session-1   user-1         2024-02-22 12:00   null
session-2   user-1         2024-02-22 13:00   2024-02-15 13:05  (revoked)
```

When user clicks logout, session is revoked and refresh tokens are invalidated.

### Protected Routes
**Frontend**: `<ProtectedRoute>` checks Redux for user, redirects to signin if missing
**Backend**: `requireAuth` middleware checks Bearer token, returns 401 if invalid

### Contracts & DI
Services depend on interfaces, not concrete classes:
```typescript
class AuthService {
  constructor(
    private authRepository: IAuthRepository,  // Interface
    private tokenService: IAuthTokenService   // Interface
  ) {}
}
```

Container wires implementations:
```typescript
const cradle = new Cradle();
cradle.authRepository = new AuthRepository();
cradle.authService = new AuthService(
  cradle.authRepository,
  cradle.tokenService
);
```

Benefits:
- Easy to test (pass mocks)
- Easy to swap implementations
- Clear dependencies (visible in constructor)

## Documentation

Read in order:

1. [01-Overview](docs/01-overview.md): What is authentication?
2. [02-Password Hashing](docs/02-password-hashing.md): How passwords are securely stored
3. [03-Signin & Tokens](docs/03-signin-and-token-response.md): Token response format
4. [04-Access Token Middleware](docs/04-access-token-middleware.md): How verification works
5. [05-Refresh Sessions](docs/05-refresh-token-sessions.md): Keeping sessions fresh
6. [06-Frontend Auth State](docs/06-frontend-auth-state.md): Redux auth management
7. [07-Protected Routes](docs/07-protected-routes.md): Frontend and backend guards
8. [08-Backend Contracts](docs/08-backend-contracts-and-di.md): DI and interfaces
9. [09-Contract Trace](docs/09-contract-trace.md): Follow data through system
10. [10-Production Mapping](docs/10-how-this-maps-to-production.md): Real-world patterns
11. [11-Exercises](docs/11-exercises.md): Practice projects

## API Endpoints

### Public Endpoints

**POST /api/v1/auth/signup**
```json
{"email":"user@example.com","password":"password","name":"John"}
```
Response: `{user: {...}, tokens: {accessToken, refreshToken}}`

**POST /api/v1/auth/signin**
```json
{"email":"user@example.com","password":"password"}
```
Response: `{user: {...}, tokens: {accessToken, refreshToken}}`

**POST /api/v1/auth/refresh**
```json
{"refreshToken":"eyJ..."}
```
Response: `{accessToken: "...", refreshToken: "..."}`

### Protected Endpoints (Require Authorization header)

**GET /api/v1/auth/me**
Headers: `Authorization: Bearer <accessToken>`
Response: `{id, email, name}`

**POST /api/v1/auth/logout**
Headers: `Authorization: Bearer <accessToken>`
Response: `{message: "Logged out successfully"}`

**GET /api/v1/protected-demo**
Headers: `Authorization: Bearer <accessToken>`
Response: `{message: "...", userId: "...", email: "..."}`

## Type Safety

End-to-end TypeScript throughout:

```typescript
// Forms validated with Zod
type SignInInput = z.infer<typeof SignInSchema>

// API responses typed
const response: AuthResponse = await authService.signin(data)

// Redux state typed
const user: AuthUser | null = useSelector(selectAuthUser)

// Middleware context typed
interface AuthenticatedRequest extends Request {
  auth?: { userId: string; email: string }
}
```

Zero `any` types in feature code.

## Common Tasks

### Debug Token
```typescript
// src/utils/tokenUtils.ts
function parseJWT(token: string) {
  const base64Url = token.split('.')[1]
  return JSON.parse(atob(base64Url))
}

// In browser console:
parseJWT(localStorage.getItem('auth_access_token'))
```

### Check Database
```bash
npm run prisma:studio
# Opens GUI at http://localhost:5555
```

### Reset Database
```bash
npm run prisma:reset
```

### Run Type Checking
```bash
npm run type-check  # Backend
npm run type-check  # Frontend
```

## Error Handling

### Backend
Errors return appropriate status codes:
- **400**: Validation error (invalid email, password too short)
- **401**: Authentication error (invalid credentials, missing token)
- **404**: Not found (user doesn't exist)
- **409**: Conflict (email already registered)

### Frontend
Thunks catch errors and dispatch to Redux:
```typescript
const result = await dispatch(signinThunk(data))
if (result.meta.requestStatus === 'rejected') {
  // error in result.payload
}
```

## Testing Flow

```
Test Signup:
1. http://localhost:3000/signup
2. Enter email, password, name
3. Click "Sign Up"
4. Verify redirected to /profile
5. Check localStorage has tokens

Test Protected Endpoint:
1. From profile, click "Test Protected Endpoint"
2. Should display userId and email
3. Verify Authorization header contains token

Test Logout:
1. Click "Logout"
2. Verify tokens cleared from localStorage
3. Verify redirected to /signin
4. Try accessing /profile (should redirect)

Test Invalid Token:
1. Open DevTools
2. localStorage.removeItem('auth_access_token')
3. Refresh page
4. Should redirect to /signin

Test Token Verification:
1. Sign in
2. Use browser DevTools to see Network tab
3. Verify requests include "Authorization: Bearer" header
4. Verify response from /auth/me contains user data
```

## Production Considerations

This module focuses on core patterns. Production adds:
- **OAuth**: Google, GitHub signup
- **2FA**: Two-factor authentication
- **RBAC**: Role-based access control
- **Email**: Send verification emails
- **Rate Limiting**: Prevent brute-force
- **Audit Logging**: Track auth events
- **Session Store**: Redis for performance
- **Monitoring**: Error tracking, metrics

See [10-how-this-maps-to-production.md](docs/10-how-this-maps-to-production.md) for details.

## Exercises

[11-exercises.md](docs/11-exercises.md) includes:
1. Password change endpoint
2. Forgot password flow
3. Role-based access control
4. Token expiry experimentation
5. Email verification

## Troubleshooting

**Backend won't start**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Reset database
npm run prisma:reset
```

**Frontend can't connect to backend**
```bash
# Verify backend is running on localhost:5000
curl http://localhost:5000/health

# Check vite.config.ts proxy is configured
# Verify CORS is enabled in backend
```

**Types not working**
```bash
npm run type-check  # Check for errors
npm run build       # Build to catch issues
```

## Resources

- JWT: https://jwt.io
- Bcrypt: https://www.npmjs.com/package/bcryptjs
- Prisma: https://www.prisma.io/docs
- Zod: https://zod.dev
- Redux: https://redux.js.org
- React Hook Form: https://react-hook-form.com

## Contributing

Ideas for extensions:
- Add social auth (Google, GitHub)
- Add 2FA support
- Add audit logging
- Add session management UI
- Add password strength meter
- Add email verification
- Add rate limiting

See exercises for more ideas.

## Summary

This module teaches authentication as an integrated system, not isolated features. You'll learn production-grade patterns (DI, contracts, typed APIs) while building real, functional features.

After completing this module, you should understand:
- Why passwords are hashed and how
- How tokens prove authentication
- Why refresh tokens exist
- How frontend and backend coordinate
- Why contracts and DI matter
- How production systems scale these patterns

Start with the documentation, build the flows, then extend with exercises.

Happy learning! 🚀
