# 01-Overview: What is Authentication?

Authentication is the process of verifying who you are. In a web application, it works like this:

## What You're Learning

This module teaches how to build a complete authentication system:
- **Signup**: Create a new user account with a password
- **Signin**: Log in with email and password
- **Sessions**: Keep users logged in across browser refreshes
- **Token-based Auth**: Use JWT (JSON Web Tokens) to verify requests
- **Protected Routes**: Only authenticated users can access certain pages
- **Logout**: Safely end a user session

## Key Concepts

### Password Hashing
Raw passwords are NEVER stored in a database. Instead, we use a hash function that:
- Converts "mypassword" → "bcrypt-hash-string"
- Can verify if a password matches without storing the original
- Is impossible to reverse (one-way function)

### Access Token (Short-lived)
- Sent with every API request in the Authorization header
- Proves you're authenticated
- Expires quickly (e.g., 15 minutes)
- Used to access protected endpoints

### Refresh Token (Long-lived)
- Stored securely and used to get new access tokens
- Expires slowly (e.g., 7 days)
- Never sent in API requests
- Can be revoked to log out

### JWT (JSON Web Token)
- Standard format for tokens containing user info
- Digitally signed so it can't be tampered with
- Contains payload (userId, email) + expiry
- Backend can verify it without asking a database

### Session
- Database record of a user's login
- Can be revoked to force logout
- Tracks when it was created and expires

### Middleware
- Code that runs before your route handler
- In auth: checks if token is valid
- Attaches user info to request

### Route Guard
- Frontend: redirects to login if not authenticated
- Backend: returns 401 if no valid token

## Architecture of This Module

```
Frontend (React)          Backend (Express)
─────────────────        ──────────────────

Sign Up Page ──POST──────────────────> /api/v1/auth/signup
                                      ├─ hash password
                                      ├─ store user
                                      └─ return tokens

Sign In Page ──POST──────────────────> /api/v1/auth/signin
                                      ├─ verify password
                                      ├─ create session
                                      └─ return tokens

Profile Page ──GET──────────────────> /api/v1/auth/me
(with token) (Bearer: accessToken)   └─ return current user

Protected Page ──GET──────────────────> /api/v1/protected-demo
(with token)  (Bearer: accessToken)   └─ return demo data
```

## Files You'll See

### Backend
- `src/backend.ts` - Express server
- `src/di/types.ts` - Contracts/interfaces
- `src/di/container.ts` - Dependency injection
- `src/repositories/` - Database access
- `src/services/` - Business logic
- `src/controllers/authController.ts` - HTTP handlers
- `src/middleware/auth.ts` - Token verification

### Frontend
- `src/models/auth.ts` - TypeScript types
- `src/services/authService.ts` - API calls
- `src/store/` - Redux state management
- `src/pages/` - SignIn, SignUp, Profile pages
- `src/components/ProtectedRoute.tsx` - Route guard

## Next Steps

Read the docs in order:
1. `02-password-hashing.md` - How passwords are securely stored
2. `03-signin-and-token-response.md` - What tokens look like
3. `04-access-token-middleware.md` - How token verification works
4. `05-refresh-token-sessions.md` - How to keep sessions fresh
5. `06-frontend-auth-state.md` - How React/Redux manage auth
6. `07-protected-routes.md` - Frontend and backend protection
7. `08-backend-contracts-and-di.md` - Why loose coupling matters
8. `09-contract-trace.md` - Following data through the system
9. `10-how-this-maps-to-production.md` - Real-world patterns
10. `11-exercises.md` - Ways to extend your learning
