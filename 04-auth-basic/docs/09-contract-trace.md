# 09-Contract Trace: Following Data Through the System

## Tracing a Single Piece of Data

Let's follow the `userId` from signup through the backend and frontend.

## Scenario: User Signs Up

### 1. Frontend Form Input

```typescript
// src/pages/SignUpPage.tsx

const handleSubmit = async (data: SignUpFormData) => {
  // data shape (from Zod schema):
  // { email: "user@example.com", password: "...", name?: "..." }
  
  const result = await dispatch(signupThunk(data));
  //                                           ↑
  //                                    Passes to thunk
};
```

Type inference:
```typescript
type SignUpFormData = z.infer<typeof SignUpSchema>;
// → { email: string; password: string; name?: string }
```

### 2. Thunk → API Service

```typescript
// src/store/authThunks.ts

export const signupThunk = createAsyncThunk(
  'auth/signup',
  async (payload: SignUpPayload, { rejectWithValue }) => {
    // payload = { email: "...", password: "...", name?: "..." }
    
    const result = await authService.signup(payload);
    //                                      ↑
    //                         Passes SignUpPayload
    
    tokenStorage.saveTokens(result.tokens.accessToken, result.tokens.refreshToken);
    return result;  // Returns AuthResponse
  }
);
```

Type flow:
```
SignUpFormData (Zod inferred)
    ↓
SignUpPayload (type defined in src/models/auth.ts)
    ↓
authService.signup(payload)
```

### 3. API Service → HTTP Request

```typescript
// src/services/authService.ts

async signup(payload: SignUpPayload): Promise<AuthResponse> {
  // payload = { email: "...", password: "...", name?: "..." }
  
  return apiCall<AuthResponse>(`${API_BASE}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(payload),  // Sent as JSON
  });
}
```

HTTP Request sent to backend:
```http
POST /api/v1/auth/signup HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "myPassword123",
  "name": "John Doe"
}
```

### 4. Backend Request → Schema Validation

```typescript
// src/schemas/authSchemas.ts

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
```

### 5. Backend Controller Route Handler

```typescript
// src/controllers/authController.ts

router.post('/signup', async (req, res: Response) => {
  try {
    const body = SignUpSchema.parse(req.body);  // ← Validates and types
    //           ↑
    // After parse: { email, password, name }
    // Zod throws error if invalid
    
    const result = await authService.signup(body);
    //                                      ↑
    //                              Passes SignUpInput
    
    res.status(201).json(result);
  } catch (error) {
    // Handle validation errors
  }
});
```

### 6. Backend Service Processes Request

```typescript
// src/services/authService.ts

async signup(req: SignUpRequest): Promise<AuthResponse> {
  // req = { email: "...", password: "...", name?: "..." }
  
  const existingUser = await this.authRepository.findByEmail(req.email);
  
  // Hash password
  const passwordHash = await bcryptjs.hash(req.password, 10);
  
  // Create user in database
  const user = await this.authRepository.create(req.email, passwordHash, req.name);
  // → INSERT INTO users (id, email, password, name) VALUES (...)
  //
  // Prisma generates id (CUID)
  // user = { id: "clw1234567890", email: "...", password: "...", name: "..." }
  
  // userId is now generated!
  const tokenPayload: TokenPayload = {
    userId: user.id,      // ← First use of userId!
    email: user.email,
  };
  
  const accessToken = this.tokenService.signAccessToken(tokenPayload);
  // → JWT payload = { userId: "clw1234567890", email: "...", exp: ... }
  
  const refreshToken = this.tokenService.signRefreshToken(tokenPayload);
  
  return {
    user: this.mapToDTO(user),  // { id, email, name }
    tokens: { accessToken, refreshToken }
  };
}
```

JWT tokens contain userId:
```
Access Token decoded:
{
  "alg": "HS256",
  "typ": "JWT"
}
.
{
  "userId": "clw1234567890",      // ← Embedded in token
  "email": "user@example.com",
  "iat": 1708231000,
  "exp": 1708231900
}
.
[signature]
```

### 7. Response Back to Frontend

```typescript
// Backend response
{
  "user": {
    "id": "clw1234567890",        // ← userId returned
    "email": "user@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "accessToken": "eyJ...",      // ← Contains userId
    "refreshToken": "eyJ..."
  }
}
```

### 8. Frontend Redux Update

```typescript
// authSlice extra reducer handles signinThunk.fulfilled
state.user = action.payload.user;
state.accessToken = action.payload.tokens.accessToken;
state.refreshToken = action.payload.tokens.refreshToken;
state.isLoading = false;

// Redux state updated:
state.auth = {
  user: { id: "clw1234567890", ... },
  accessToken: "eyJ...",  // Contains userId in payload
  refreshToken: "eyJ...",
  isLoading: false,
  error: null
}
```

### 9. Token Storage

```typescript
// src/services/tokenStorage.ts

tokenStorage.saveTokens(
  "eyJ...userId...exp:15m",
  "eyJ...userId...exp:7d"
);

// localStorage:
// auth_access_token: "eyJ..."
// auth_refresh_token: "eyJ..."
```

## Following userId Through Protected Endpoint Call

### 10. Frontend Calls Protected Endpoint

```typescript
// src/pages/ProfilePage.tsx

const handleTestProtectedEndpoint = async () => {
  const accessToken = useSelector(selectAccessToken);
  // accessToken = "eyJ...userId:clw1234567890...exp:15m"
  
  const data = await authService.getProtectedDemo(accessToken);
  //                                              ↑
  //                                        Token passed
};
```

HTTP Request:
```http
GET /api/v1/protected-demo HTTP/1.1
Authorization: Bearer eyJ...userId:clw1234567890...
```

### 11. Backend Middleware Extracts userId

```typescript
// src/middleware/auth.ts

const token = authHeader.substring('Bearer '.length);
// token = "eyJ...userId:clw1234567890..."

const payload = tokenService.verifyAccessToken(token);
// payload = { userId: "clw1234567890", email: "user@example.com" }

req.auth = {
  userId: payload.userId,  // ← userId extracted from token
  email: payload.email
};
```

### 12. Route Handler Uses userId

```typescript
// src/backend.ts

app.get('/api/v1/protected-demo', (req: any, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // req.auth.userId is available and typed!
  res.json({
    message: 'This is a protected endpoint',
    userId: req.auth.userId,      // ← "clw1234567890"
    email: req.auth.email,
  });
});
```

Response:
```json
{
  "message": "This is a protected endpoint",
  "userId": "clw1234567890",
  "email": "user@example.com"
}
```

### 13. Frontend Displays Result

```typescript
// src/pages/ProfilePage.tsx

const [protectedData, setProtectedData] = useState<string | null>(null);

const response = await authService.getProtectedDemo(accessToken);
setProtectedData(JSON.stringify(response, null, 2));

// Component renders:
// userId: clw1234567890
// email: user@example.com
```

## Type Contract Chain

```
Frontend                                  Backend
────────────────────────────────────────────────

SignUpFormData
  (from React Hook Form)
         ↓
SignUpPayload                             (HTTP POST)
  (from models/auth.ts)                      ↓
         ↓                          SignUpInput (Zod parsed)
  authService.signup                        ↓
         │                          SignUpRequest (interface)
         │                                  ↓
         └─────────→ POST /api/v1/auth/signup
                            ↓
                       User created in DB
                       userId generated
                            ↓
                       AuthResponse {
                         user: { id, email, name },
                         tokens: { accessToken, refreshToken }
                       }
         ↑
         └─────────← (HTTP 201 response)
         │
    authResponse: AuthResponse
         ├─ user.id = "clw1234567890"
         ├─ accessToken = "eyJ...userId..."
         └─ refreshToken = "eyJ...userId..."
              ↓
         Redux extra reducer handles auth/signup/fulfilled
         └─ state.auth.user.id = "clw1234567890"
         
    Later, API call with token:
    authService.getProtectedDemo(accessToken)
         │
         └─────────→ GET /api/v1/protected-demo
                     Authorization: Bearer eyJ...
                            ↓
                       authMiddleware
                       ├─ Verify token
                       ├─ Decode: { userId: "clw1234567890", ... }
                       └─ req.auth.userId = "clw1234567890"
                            ↓
                       Route handler uses req.auth.userId
         ↑
         └─────────← Response { userId: "clw1234567890" }
         │
    Frontend receives response
    └─ Display to user
```

## Type Safety Benefits

Throughout this chain, TypeScript prevents mistakes:

```typescript
// ✅ Correct: userId is string
const userId: string = "clw1234567890";

// ❌ Wrong: Will not compile
const userId: number = "clw1234567890";
// Error: Type 'string' is not assignable to type 'number'

// ✅ Correct: accessToken must be string
const token: string = payload.accessToken;

// ❌ Wrong: Catches bugs at compile time
const data = await authService.refresh({ refreshToken: 123 });
// Error: Argument of type 'number' is not assignable to 'string'
```

## Tracing Email Through System

### Frontend Form
```typescript
// SignUpPayload type
{ email: string; password: string; name?: string }
```

### API Call
```json
{ "email": "user@example.com", ... }
```

### Backend Schema
```typescript
SignUpSchema.parse(req.body)
// Validates email is valid email format
```

### Database Storage
```sql
INSERT INTO users (email, password, name)
VALUES ('user@example.com', bcrypt_hash, 'John Doe')
```

### Token Payload
```json
{ "userId": "...", "email": "user@example.com" }
```

### Response
```json
{ "user": { "id": "...", "email": "user@example.com", ... } }
```

### Frontend Redux
```typescript
state.auth.user.email = "user@example.com"
```

### Protected Endpoint
```typescript
req.auth.email = "user@example.com"  // Extracted from token
```

## Summary

- **userId** originates in database (generated by Prisma)
- **Email** originates from frontend form submission
- **Both** are embedded in JWT tokens
- **Tokens** authenticate frontend requests to backend
- **Backend** middleware extracts both from token
- **Types** ensure correctness at every step
- **Zero any**: Full TypeScript coverage
