# 03-Signin and Token Response

## Signin Request

After signup or when returning, users send email + password to sign in.

### POST /api/v1/auth/signin

Request:
```json
{
  "email": "user@example.com",
  "password": "myPassword123"
}
```

### Zod Schema (Frontend & Backend)

```typescript
const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

Backend enforces this in `src/schemas/authSchemas.ts`.

Frontend uses React Hook Form + Zod resolver.

## Backend Verification

```typescript
async signin(req: SignInRequest): Promise<AuthResponse> {
  // 1. Find user by email
  const user = await authRepository.findByEmail(req.email);
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // 2. Compare submitted password with stored hash
  const isPasswordValid = await bcryptjs.compare(
    req.password,           // User input
    user.password           // Stored bcrypt hash
  );
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // 3. Create a refresh session
  const sessionId = await sessionRepository.create(user.id);

  // 4. Generate tokens
  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = tokenService.signAccessToken(tokenPayload);
  const refreshToken = tokenService.signRefreshToken(tokenPayload);

  // 5. Return response
  return {
    user: { id: user.id, email: user.email, name: user.name },
    tokens: { accessToken, refreshToken }
  };
}
```

## Token Response

Upon successful signin, server returns:

```json
{
  "user": {
    "id": "clw1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHcxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA4MjMxMDAwLCJleHAiOjE3MDgyMzE5MDB9.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHcxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA4MjMxMDAwLCJleHAiOjE3MDgyMzE2MDB9.signature"
  }
}
```

## JWT Structure

Both tokens are JWTs with three parts: `header.payload.signature`

### Decode accessToken:

**Header** (tells you algorithm):
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** (contains claims):
```json
{
  "userId": "clw1234567890",
  "email": "user@example.com",
  "iat": 1708231000,    // issued at (Unix timestamp)
  "exp": 1708231900     // expires at (15 minutes later)
}
```

**Signature** (proves it wasn't tampered with):
```
HMACSHA256(base64(header) + "." + base64(payload), secret)
```

### Decode refreshToken:

**Payload** (different expiry):
```json
{
  "userId": "clw1234567890",
  "email": "user@example.com",
  "iat": 1708231000,
  "exp": 1708496400     // 7 days later
}
```

## Frontend Token Handling

### Store Tokens

```typescript
// authService.ts
async signin(payload: SignInPayload): Promise<AuthResponse> {
  const result = await apiCall<AuthResponse>('/api/v1/auth/signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result;
}

// In component (SignInPage.tsx)
const result = await authService.signin(formData);

// Save to localStorage
tokenStorage.saveTokens(
  result.tokens.accessToken,
  result.tokens.refreshToken
);

// Update Redux
dispatch(authSetUser({
  user: result.user,
  tokens: result.tokens
}));
```

### Use Access Token in API Calls

```typescript
async apiCall<T>(url: string, options: RequestInit & { token?: string } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  return fetch(url, { ...options, headers });
}

// Usage
const user = await apiCall<AuthUser>('/api/v1/auth/me', {
  method: 'GET',
  token: accessToken  // ← Attached in Authorization header
});
```

## Error Cases

### Email not found
Request:
```json
{ "email": "notregistered@example.com", "password": "any" }
```

Response (401):
```json
{
  "error": "AuthenticationError",
  "message": "Invalid email or password"
}
```

### Wrong password
Request:
```json
{ "email": "user@example.com", "password": "wrongpassword" }
```

Response (401):
```json
{
  "error": "AuthenticationError",
  "message": "Invalid email or password"
}
```

### Invalid request (Zod validation fails)
Request:
```json
{ "email": "not-an-email", "password": "123" }
```

Response (400):
```json
{
  "error": "ZodError",
  "message": "Invalid email address | Password must be at least 6 characters"
}
```

## Security Considerations

### Why not return password?
✅ Response never includes the password (even hashed):
```json
{ "user": { "id": "...", "email": "...", "name": "..." } }
// ← No password field!
```

### Why two tokens?
- **Access Token**: Short-lived, sent with every request (vulnerable if leaked)
- **Refresh Token**: Long-lived, stored safely, used only to get new access tokens

If access token is stolen:
1. Attacker can impersonate user briefly (15 minutes)
2. After 15 minutes, token expires
3. Attacker cannot get new tokens without refresh token

### HTTPS Required
Tokens must NEVER be transmitted over HTTP (unencrypted):
- Attacker can sniff tokens on the network
- Always use HTTPS in production

## Response Types (TypeScript)

```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
```

## Redux Integration

```typescript
export const signinThunk = createAsyncThunk(
  'auth/signin',
  async (payload: SignInPayload, { rejectWithValue }) => {
    try {
      const result = await authService.signin(payload);
      tokenStorage.saveTokens(result.tokens.accessToken, result.tokens.refreshToken);
      return result; // ← Contains user and tokens
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);
```

When successful, dispatch `authSetUser` action to update Redux state.

## Summary

- **Signin** validates email/password against stored hash
- **Tokens** are JWTs with expiry times
- **Access Token** is short-lived, sent with every request
- **Refresh Token** is long-lived, stored safely, used to refresh tokens
- **Frontend** stores both tokens for future requests
- **Security** requires HTTPS and careful token handling
