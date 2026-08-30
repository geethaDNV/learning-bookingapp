# 07-Protected Routes: Frontend and Backend Guards

## What is Route Protection?

Route protection ensures only authenticated users access certain pages/endpoints:

```
Public routes:           Protected routes:
├─ /signin            ├─ /profile
├─ /signup            ├─ /dashboard
└─ /                  └─ /api/v1/auth/me

Anyone can access      Only logged-in users
without token          can access (need token)
```

## Frontend Route Protection

### ProtectedRoute Component

```typescript
// src/components/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    // User not logged in → redirect to signin
    return <Navigate to="/signin" replace />;
  }

  // User is authenticated → render component
  return <>{children}</>;
}
```

### Usage in Router

```typescript
// src/App.tsx

<Routes>
  {/* Public routes */}
  <Route path="/signin" element={<SignInPage />} />
  <Route path="/signup" element={<SignUpPage />} />
  
  {/* Protected routes */}
  <Route
    path="/profile"
    element={
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    }
  />
  
  {/* Default */}
  <Route path="/" element={<Navigate to="/profile" replace />} />
</Routes>
```

### Flow

```
User visits http://localhost:3000/profile
    ↓
    Route /profile renders <ProtectedRoute>
    ├─ Check Redux: selectIsAuthenticated
    │  ├─ If true (user.id exists): Render <ProfilePage />
    │  └─ If false (user.id is null): Redirect to /signin
    │
    └─ Redirect (replace=true means history entry is replaced)
       └─ User sees /signin, back button goes to previous page
```

## When Route Rendering Happens

```
App loads
    ↓
authRestoreFromStorage thunk
├─ Load tokens from localStorage
├─ Dispatch authRestoreFromStorage({ accessToken, ... })
├─ Redux state updated with tokens
└─ Component re-renders
    ↓
    ProtectedRoute checks selectIsAuthenticated
    ├─ If tokens exist: render protected component
    └─ If tokens missing: redirect to signin
```

**Gotcha**: If you dispatch auth actions AFTER rendering routes, protected routes may flash signin before redirecting.

Solution: Restore from storage at app startup:

```typescript
// src/App.tsx
useEffect(() => {
  const { accessToken, refreshToken } = tokenStorage.loadTokens();
  if (accessToken) {
    // Restore state before routes render
    dispatch(authRestoreFromStorage({ ... }));
  }
}, []);
```

## Backend Route Protection

### Protected Route Handlers

```typescript
// src/controllers/authController.ts

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  // requireAuth middleware ensures req.auth exists
  const user = await authService.getCurrentUser(req.auth.userId);
  res.json(user);
});

router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  // Protected: requires valid access token
  res.json({ message: 'Logged out successfully' });
});
```

### Public Route Handlers

```typescript
// src/controllers/authController.ts

router.post('/signup', async (req, res) => {
  // No requireAuth needed
  // Anyone can call this
  const result = await authService.signup(req.body);
  res.json(result);
});

router.post('/signin', async (req, res) => {
  // No requireAuth needed
  // Anyone can call this
  const result = await authService.signin(req.body);
  res.json(result);
});
```

### requireAuth Middleware

```typescript
// src/middleware/auth.ts

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check if middleware extracted valid token
  if (!req.auth) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authentication token',
    });
  }
  
  // Token is valid, proceed to route handler
  next();
}
```

### Middleware Chain

```
Request arrives
    ↓
authMiddleware (runs on all routes)
├─ Extract Authorization header
├─ Verify token signature and expiry
├─ Set req.auth = { userId, email } or undefined
└─ Call next()
    ↓
    Router checks route path
    ├─ If POST /auth/signin:
    │  └─ No requireAuth → proceed to handler
    │
    └─ If GET /auth/me:
       ├─ requireAuth middleware
       │  ├─ Check req.auth exists
       │  ├─ If missing: return 401, stop
       │  └─ If present: call next()
       │      ↓
       │      Route handler (can access req.auth.userId)
```

## Frontend + Backend Integration

### User Visits Protected Page

```
Browser: GET /profile
    ↓
    Frontend Router
    ├─ <ProtectedRoute> checks Redux
    │  ├─ user.id in Redux? Yes → render component
    │  └─ user.id in Redux? No → redirect to /signin
    │
    └─ Render <ProfilePage />
        ├─ Component calls useSelector(selectAccessToken)
        └─ API call: GET /api/v1/auth/me with Bearer token
            ↓
            Backend Middleware
            ├─ Parse Authorization header
            ├─ Verify token
            ├─ Set req.auth = { userId, email }
            └─ Call next()
                ↓
                Backend Route Handler (requireAuth)
                ├─ Check req.auth exists
                ├─ It does, so proceed
                └─ Return user data
                    ↓
                    Frontend: Update component
```

### User Without Token Visits Protected Page

```
Browser: GET /profile
    ↓
    localStorage has no tokens
    ↓
    App startup: authRestoreFromStorage
    ├─ Load tokens: null (empty)
    ├─ Dispatch authRestoreFromStorage({ user: null, ... })
    └─ Redux state.auth.user = null
        ↓
        <ProtectedRoute> checks selectIsAuthenticated
        ├─ selectIsAuthenticated = !!state.auth.user = !!null = false
        ├─ Redirect to /signin
        └─ User sees signin form
```

### User Clicks Logout

```
ProfilePage: handleLogout()
    ↓
    authService.logout(accessToken)
    └─ POST /api/v1/auth/logout
        ├─ Backend requireAuth checks token
        ├─ Token valid, proceed
        └─ Revoke session
        
    ↓
    tokenStorage.clearTokens()
    └─ localStorage.removeItem(...) × 2
    
    ↓
    dispatch(authClear())
    └─ Redux state.auth = initial (user: null, tokens: null)
    
    ↓
    navigate('/signin')
    ├─ ProtectedRoute on any protected page would redirect
    └─ User sees signin form
```

## Common Scenarios

### Scenario 1: Signin → Redirect to Profile

```
/signin page
    ↓
User fills form, clicks "Sign In"
    ↓
dispatch(signinThunk({ email, password }))
    ├─ POST /api/v1/auth/signin
    ├─ Response: { user, tokens }
    ├─ tokenStorage.saveTokens(...)
    └─ dispatch(authSetUser(...))
        └─ state.auth.user = { id, email, name }
        └─ state.auth.accessToken = token
    ↓
    Component checks result.meta.requestStatus === 'fulfilled'
    ├─ True → navigate('/profile')
    └─ <ProtectedRoute> checks selectIsAuthenticated = true
        └─ Render <ProfilePage />
```

### Scenario 2: Refresh Page on Protected Route

```
User on /profile
    ↓
Browser refresh (F5)
    ↓
App initializes
    ├─ authRestoreFromStorage
    │  ├─ Load from localStorage: { accessToken, refreshToken }
    │  └─ Dispatch authRestoreFromStorage({ ... })
    │      └─ state.auth.accessToken = token
    │
    └─ Routes render
        ├─ /profile route: <ProtectedRoute>
        │  └─ selectIsAuthenticated = true (accessToken exists)
        │      └─ Render <ProfilePage />
        │
        └─ <ProfilePage> useEffect
           └─ Call authService.getCurrentUser(accessToken)
               └─ Display user info
```

### Scenario 3: Token Expires During Session

```
User on /profile, accessToken expires
    ↓
User clicks button that calls API
    └─ GET /api/v1/auth/me
        ├─ Backend authMiddleware
        │  └─ verifyAccessToken → null (expired)
        │      └─ req.auth = undefined
        │
        └─ Route handler requireAuth
           ├─ Check req.auth: undefined
           └─ Return 401 Unauthorized
            ↓
            Frontend error handler
            ├─ Try refresh token endpoint
            ├─ If success: new tokens, retry request
            └─ If failure: redirect to /signin
```

## Request/Response Examples

### Protected Endpoint Success

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

### Protected Endpoint Without Token

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

### Protected Endpoint with Expired Token

Request:
```http
GET /api/v1/auth/me HTTP/1.1
Authorization: Bearer eyJ...exp:1708231000... (expired)
```

Response (401):
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

## Advanced: Role-Based Access

For admin-only pages:

```typescript
// Extension of ProtectedRoute
interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'user';
}

export function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
  const user = useSelector(selectAuthUser);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
```

Backend middleware:

```typescript
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check user's role (would come from database)
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}
```

## Summary

- **Frontend**: ProtectedRoute checks Redux for user, redirects to signin if missing
- **Backend**: requireAuth middleware checks for valid access token, returns 401 if missing
- **Integration**: User must have both stored tokens (frontend) and valid access token (backend)
- **Logout**: Clears tokens and state, redirects to signin
- **Refresh**: Handles token expiry transparently or redirects when refresh fails
