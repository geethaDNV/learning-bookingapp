# 04-Auth-Basic Frontend

A learning module for authentication with React, Redux, Zod, and TypeScript.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure the backend is running on `http://localhost:5000`

3. Start development:
   ```bash
   npm run dev
   ```

4. Open browser to `http://localhost:3000`

## Architecture

### Typed Models (`src/models/auth.ts`)
All auth data structures are strongly typed:
- `AuthUser`: Current user
- `SignInPayload`, `SignUpPayload`: Form inputs
- `AuthTokens`: Access and refresh tokens
- `AuthState`: Redux state shape

### API Service (`src/services/authService.ts`)
Typed API calls with automatic token attachment.

### Token Storage (`src/services/tokenStorage.ts`)
localStorage wrapper for managing tokens persistently.

### Redux Store (`src/store/`)
- `authSlice.ts`: State and reducers
- `authThunks.ts`: Async actions
- `store.ts`: Store configuration

### Components
- `ProtectedRoute.tsx`: Route guard component
- Pages: `SignInPage`, `SignUpPage`, `ProfilePage`

## Flow

1. **Sign Up**: User registers with email/password
   - Password hashed on backend
   - Tokens returned and stored
   - Redux state updated

2. **Sign In**: User logs in
   - Credentials verified against hashed password
   - Tokens returned and stored
   - Redirects to profile

3. **Protected Routes**: Access token required
   - `ProtectedRoute` guards pages
   - Missing token redirects to signin

4. **Protected Endpoints**: Bearer token in Authorization header
   - Frontend attaches token to API calls
   - Backend middleware verifies token
   - Request proceeds with auth context

5. **Logout**: Clear tokens and state
   - localStorage cleared
   - Redux state cleared
   - Redirect to signin

6. **Token Refresh** (Optional): Generate new access token
   - Use refresh token to get new pair
   - Update storage and Redux state

## Type Safety

End-to-end types prevent auth payload mistakes:
- Form inputs typed with Zod
- API responses typed
- Redux state and selectors typed
- Components receive typed props

## Testing Flow

1. Visit http://localhost:3000
2. Sign up with new email
3. Verify user data appears on profile
4. Click "Test Protected Endpoint" to verify backend protection
5. Logout and verify redirect to signin
6. Try accessing /profile directly (should redirect)
