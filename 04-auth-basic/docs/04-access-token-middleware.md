# 04-Access Token Middleware: Verifying Requests

## Bearer Token Concept

The access token is sent with every request using the Authorization header:

```
GET /api/v1/auth/me HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Format: `Authorization: Bearer <token>`

## Middleware Flow

```
Request arrives
    ↓
    └─→ authMiddleware
        ├─ Extract Authorization header
        ├─ Check if starts with "Bearer "
        ├─ Extract token
        ├─ Verify signature with JWT_SECRET
        ├─ Check if expired
        └─ If valid:
           ├─ Decode payload
           ├─ Attach to req.auth = { userId, email }
           └─ Call next() → route handler
        
        If invalid or missing:
           └─ Call next() → route handler receives req.auth = undefined
```

## Middleware Implementation

```typescript
// src/middleware/auth.ts

interface AuthenticatedRequest extends Request {
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
```

Key points:
1. Middleware runs on EVERY request
2. It doesn't block requests—missing token just means `req.auth = undefined`
3. Actual protection happens in route-specific middleware

## Route-Specific Protection

For routes that REQUIRE authentication, use `requireAuth` middleware:

```typescript
// src/middleware/auth.ts

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authentication token',
    });
  }
  next();
}
```

Usage in controller:

```typescript
// Protected endpoint requires valid token
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getCurrentUser(req.auth.userId);
  res.json(user);
});
```

## Token Verification

### Successful Token

Frontend sends:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHcxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA4MjMxMDAwLCJleHAiOjE3MDgyMzE5MDB9.Oo_O3D7Z2zcA-9qJhZ_Z8Xt_9XvA-3bC_0dE_5fG
```

Backend:
```typescript
const payload = tokenService.verifyAccessToken(token);
// ✓ Signature is valid (matched with JWT_SECRET)
// ✓ Not expired (exp > now)
// → Returns: { userId: "clw1234567890", email: "user@example.com" }
```

### Expired Token

Token was created at 12:00, expires at 12:15, now it's 12:20:

```typescript
const payload = tokenService.verifyAccessToken(expiredToken);
// ✗ exp (12:15) < now (12:20)
// → Returns: null
```

### Tampered Token

If someone modifies the token:
```
Original:  eyJ...ZeA.eyJ1c2VySWQiOiJjbHcxMjM0NTY3ODkwIi...
Tampered:  eyJ...ZeA.eyJ1c2VySWQiOiJjaGFuZ2VkLWlkIi...
```

```typescript
const payload = tokenService.verifyAccessToken(tamperedToken);
// ✗ Signature doesn't match (token was modified)
// → Returns: null
```

### Missing Token

```
GET /api/v1/auth/me HTTP/1.1
(no Authorization header)
```

```typescript
const authHeader = req.headers.authorization; // undefined
if (!authHeader) {
  req.auth = undefined;
  // Route handler gets undefined—must check with requireAuth
}
```

## TypeScript Typed Auth Context

```typescript
interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;  // ✓ User's ID
    email: string;   // ✓ User's email
  };
}
```

In route handlers:
```typescript
router.get('/protected-demo', requireAuth, (req: AuthenticatedRequest, res) => {
  // ✓ TypeScript knows req.auth exists and has userId/email
  res.json({
    message: 'This is a protected endpoint',
    userId: req.auth.userId,    // ✓ No type errors
    email: req.auth.email,      // ✓ Type-safe
  });
});
```

## Middleware Chain Example

```
GET /api/v1/auth/me
    ↓
authMiddleware (runs on all requests)
    ├─ Parse token from header
    ├─ Verify with JWT_SECRET
    ├─ Set req.auth = { userId, email }
    └─ Call next()
        ↓
        requireAuth (specific to protected routes)
        ├─ Check if req.auth exists
        ├─ If missing: return 401
        └─ If present: call next()
            ↓
            Route handler
            ├─ Access req.auth.userId
            ├─ Fetch user from database
            └─ Return user data
```

## Request/Response Examples

### Valid Request

Request:
```http
GET /api/v1/auth/me HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response (200):
```json
{
  "id": "clw1234567890",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Missing Authorization Header

Request:
```http
GET /api/v1/auth/me HTTP/1.1
(no Authorization header)
```

Response (401):
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### Malformed Header

Request:
```http
GET /api/v1/auth/me HTTP/1.1
Authorization: NotBearer eyJhbGciOi...
```

Response (401):
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### Expired Token

Request:
```http
GET /api/v1/auth/me HTTP/1.1
Authorization: Bearer eyJ...exp:1708231000...  (now is 2024-02-20)
```

Response (401):
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### Invalid Signature

Request:
```http
GET /api/v1/auth/me HTTP/1.1
Authorization: Bearer eyJ...modifiedPayload...wrongSignature...
```

Response (401):
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

## Protected Endpoint Example

```typescript
// Backend Route Handler

router.get('/protected-demo', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  // At this point, we know req.auth exists and token was valid
  res.json({
    message: 'This is a protected endpoint',
    userId: req.auth.userId,
    email: req.auth.email,
  });
});
```

Frontend calling it:

```typescript
// Frontend API call

const authService = {
  async getProtectedDemo(token: string): Promise<any> {
    const response = await fetch('/api/v1/protected-demo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`  // ← Attach token
      }
    });
    return response.json();
  }
};
```

## Common Middleware Patterns

### Optional Authentication (token provided if available)
```typescript
app.use(createAuthMiddleware(tokenService));
// req.auth might be undefined
```

### Required Authentication (endpoint must have token)
```typescript
app.get('/protected', requireAuth, handler);
// Ends request with 401 if token missing/invalid
```

### Admin-only Endpoint
```typescript
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth || !req.auth.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.delete('/admin/users', requireAdmin, handler);
```

## Summary

- **Middleware** runs on every request to extract and verify tokens
- **Bearer token** format: `Authorization: Bearer <token>`
- **Verification** checks signature and expiry
- **Typed auth context** on req.auth prevents type errors
- **requireAuth** guards specific endpoints
- **Missing/invalid token** returns 401 Unauthorized
