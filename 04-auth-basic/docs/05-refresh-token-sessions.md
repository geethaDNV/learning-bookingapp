# 05-Refresh Token Sessions: Keeping Sessions Fresh

## Why Two Tokens?

Access tokens expire quickly (15 minutes) for security. But users shouldn't log in every 15 minutes.

Solution: Use a **refresh token** to get new access tokens without re-entering password.

```
Timeline:
├─ t=0m: Signin → get accessToken (exp: 15m) + refreshToken (exp: 7d)
├─ t=10m: Use accessToken for requests ✓
├─ t=15m: accessToken expires
│         Use refreshToken to get new accessToken
├─ t=15m: Call POST /api/v1/auth/refresh → new tokens
├─ t=25m: Use new accessToken ✓
├─ t=30m: accessToken expires again
│         Use refreshToken to get new accessToken
└─ t=7d: refreshToken expires → must signin again
```

## Refresh Token Database Record

```typescript
model RefreshSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(...)
  
  // When created
  createdAt DateTime @default(now())
  
  // When expires
  expiresAt DateTime?
  
  // When revoked (logout)
  revokedAt DateTime?
}
```

Example database:
```
refresh_sessions table:
┌─────────────┬─────────┬──────────────────┬──────────────────┬────────────────────┐
│ id          │ userId  │ createdAt        │ expiresAt        │ revokedAt          │
├─────────────┼─────────┼──────────────────┼──────────────────┼────────────────────┤
│ session-1   │ user-1  │ 2024-02-15 12:00 │ 2024-02-22 12:00 │ null               │
│ session-2   │ user-1  │ 2024-02-15 13:00 │ 2024-02-22 13:00 │ 2024-02-15 13:05   │ ← revoked
│ session-3   │ user-2  │ 2024-02-15 14:00 │ 2024-02-22 14:00 │ null               │
└─────────────┴─────────┴──────────────────┴──────────────────┴────────────────────┘
```

## Signin Creates Session

```typescript
async signin(req: SignInRequest): Promise<AuthResponse> {
  // ... verify password ...

  // Create a refresh session
  const sessionId = await sessionRepository.create(user.id);
  // → INSERT into refresh_sessions VALUES (id, userId, now, now+7d, null)

  // Generate tokens
  const tokenPayload = { userId: user.id, email: user.email, sessionId };
  const accessToken = tokenService.signAccessToken(tokenPayload);   // exp: 15m
  const refreshToken = tokenService.signRefreshToken(tokenPayload); // exp: 7d

  return {
    user: { ... },
    tokens: { accessToken, refreshToken }
  };
}
```

## Refresh Token Response

### POST /api/v1/auth/refresh

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Backend:
```typescript
async refresh(refreshToken: string): Promise<AuthTokens> {
  // 1. Verify refresh token signature and expiry
  const payload = tokenService.verifyRefreshToken(refreshToken);
  if (!payload) throw new AuthenticationError('Invalid or expired refresh token');

  // 2. Check the matching server-side session is active
  const isSessionValid = await sessionRepository.isValid(payload.sessionId, payload.userId);
  if (!isSessionValid) throw new AuthenticationError('Invalid or revoked refresh token');

  // 3. Get user (check still exists)
  const user = await authRepository.findById(payload.userId);
  if (!user) throw new NotFoundError('User not found');

  // 4. Rotate the session so the supplied refresh token cannot be replayed.
  await sessionRepository.revoke(payload.sessionId);
  const sessionId = await sessionRepository.create(user.id);

  // 5. Generate NEW tokens bound to the replacement session
  const tokenPayload = { userId: user.id, email: user.email, sessionId };
  const newAccessToken = tokenService.signAccessToken(tokenPayload);    // new exp: 15m
  const newRefreshToken = tokenService.signRefreshToken(tokenPayload);  // new exp: 7d

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
```

Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)"
}
```

## Logout Revokes Session

### POST /api/v1/auth/logout

Request:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Backend:
```typescript
async logout(refreshToken: string): Promise<void> {
  const payload = tokenService.verifyRefreshToken(refreshToken);
  if (!payload) return;

  if (await sessionRepository.isValid(payload.sessionId, payload.userId)) {
    await sessionRepository.revoke(payload.sessionId);
  }
  // → UPDATE refresh_sessions SET revokedAt = NOW() WHERE id = sessionId
}
```

After logout:
- Refresh tokens stored on frontend are useless (backend won't accept them)
- If token is stolen, attacker cannot use it (session is revoked)

## Frontend Refresh Flow

### Option 1: Manual Refresh (Simple)

```typescript
// Component or thunk
const accessToken = useSelector(selectAccessToken);
const refreshToken = useSelector(selectRefreshToken);

// Check if access token is about to expire (optional)
if (isTokenExpiringSoon(accessToken)) {
  const newTokens = await authService.refresh({ refreshToken });
  
  tokenStorage.saveTokens(
    newTokens.accessToken,
    newTokens.refreshToken
  );
  
  dispatch(authSetTokens(newTokens));
}
```

### Option 2: Automatic on 401 (Advanced)

```typescript
async function apiCall<T>(url: string, options: RequestInit & { token?: string } = {}) {
  let response = await fetch(url, { ...options, headers: { ...headers, token } });

  // If 401 (token expired)
  if (response.status === 401 && refreshToken) {
    // Try to refresh
    const newTokens = await authService.refresh({ refreshToken });
    tokenStorage.saveTokens(newTokens.accessToken, newTokens.refreshToken);
    
    // Retry original request with new token
    response = await fetch(url, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${newTokens.accessToken}` }
    });
  }

  return response.json();
}
```

## Session Validation

Before issuing new tokens, backend validates:

```typescript
async isValid(sessionId: string): Promise<boolean> {
  const session = await findById(sessionId);
  
  // Check if exists
  if (!session) return false;
  
  // Check if revoked
  if (session.revokedAt) return false;
  
  // Check if expired
  if (session.expiresAt && new Date() > session.expiresAt) return false;
  
  return true;
}
```

## Logout Sequence

```
User clicks "Logout" button
    ↓
    └─→ Frontend: authService.logout(refreshToken)
        └─→ Backend: POST /api/v1/auth/logout
        ├─ Verify refresh token and find its session
        ├─ Check the session is valid for that user
            ├─ Set revokedAt = NOW()
            └─ Return 200
        ↓
        Frontend: Clear tokens and Redux state
        ├─ tokenStorage.clearTokens()
        ├─ dispatch(authClear())
        └─ Redirect to /signin
```

After logout:
- Stored refresh token is invalid
- Cannot call protected endpoints
- Must sign in again

## Request/Response Examples

### Successful Refresh

Request:
```http
POST /api/v1/auth/refresh HTTP/1.1
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)"
}
```

### Expired Refresh Token

Request:
```http
POST /api/v1/auth/refresh HTTP/1.1

{
  "refreshToken": "eyJ...exp:1708231000..." (old, expired)
}
```

Response (401):
```json
{
  "error": "AuthenticationError",
  "message": "Invalid or expired refresh token"
}
```

Frontend must then redirect to signin.

### Revoked Session

Request:
```http
POST /api/v1/auth/refresh HTTP/1.1

{
  "refreshToken": "eyJ...sessionId-was-revoked..."
}
```

Response (401):
```json
{
  "error": "AuthenticationError",
  "message": "Session has been revoked"
}
```

## Security Principles

### Refresh Token Rotation
Each time you refresh, get a NEW refresh token:
```typescript
// ❌ Bad: Reuse same refresh token
const newAccessToken = signAccessToken(payload);
return { accessToken: newAccessToken, refreshToken: oldRefreshToken };

// ✅ Good: Rotate refresh token
const newAccessToken = signAccessToken(payload);
const newRefreshToken = signRefreshToken(payload);
return { accessToken: newAccessToken, refreshToken: newRefreshToken };
```

### Storage Location
- **Access Token**: In memory (cleared on page reload) or httpOnly cookie
- **Refresh Token**: localStorage (survives page reload) or httpOnly cookie

```typescript
// Frontend storage
export const tokenStorage = {
  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('auth_access_token', accessToken);
    localStorage.setItem('auth_refresh_token', refreshToken);
  },
  
  loadTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem('auth_access_token'),
      refreshToken: localStorage.getItem('auth_refresh_token'),
    };
  },
  
  clearTokens(): void {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
  },
};
```

### Revocation on Logout
Invalidate all refresh tokens for security:
```typescript
async logout(refreshToken: string): Promise<void> {
  const payload = tokenService.verifyRefreshToken(refreshToken);
  if (payload && await sessionRepository.isValid(payload.sessionId, payload.userId)) {
    await sessionRepository.revoke(payload.sessionId);
  }
  
  // Optional: Revoke all sessions for user
  // await sessionRepository.revokeAllForUser(userId);
}
```

## Summary

- **Access token** is short-lived (15 minutes)
- **Refresh token** is long-lived (7 days)
- **Session** database record tracks validity and revocation; refresh tokens include its ID
- **Refresh endpoint** validates refresh token and returns new pair
- **Logout** revokes sessions to prevent token reuse
- **Frontend** handles token refresh transparently to user
