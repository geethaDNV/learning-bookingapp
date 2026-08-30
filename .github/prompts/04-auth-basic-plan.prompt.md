# Plan: Learning Bookingapp - Module 04 Auth Basic

## Goal
Build `learning-bookingapp/04-auth-basic/{backend,frontend}` as a fully isolated, runnable authentication learning module based on the production `BookKeepingApp` auth architecture. The module should teach signup, signin, refresh tokens, logout, current-user/profile loading, protected API routes, frontend auth state, and route guards.

This module must keep the production mental model while removing production noise that is not needed for first understanding.

## Decisions
- Module folder name: `04-auth-basic`.
- Use email + password authentication.
- Include access token and refresh token concepts.
- Include password hashing.
- Include protected backend routes.
- Include frontend route protection.
- Keep org/tenant scoping mocked or explained, not fully implemented.
- Backend must use DI and contract-based services/repositories.
- Frontend must be strongly typed end to end.
- Docs must be detailed enough for a junior developer and include request/response examples.

## Teaching Intent
Authentication is not just a login form. It is a coordinated flow between browser state, backend validation, password hashing, token generation, token verification, refresh sessions, logout, and route protection.

After finishing this module, a junior developer should understand:
- why passwords are hashed and never stored as plain text.
- access token vs refresh token.
- why refresh tokens need persistence/revocation.
- how backend middleware identifies the current user.
- how frontend stores auth state and protects pages.
- how typed contracts prevent auth payload mistakes.

## Cross-Cutting Production Practices
- Controllers depend on `IAuthService` through constructor injection.
- Services depend on `IAuthRepository`, `IAuthTokenService`, and `IAuthSessionService` contracts.
- Implement a typed DI container and `Cradle`.
- Use Zod for request schemas and infer TypeScript types where practical.
- Define DTOs for public user data and token responses.
- Frontend API services, Redux state, thunks, selectors, route guard props, and form values must be typed.
- Avoid `any`.

## Reference Patterns
- Production auth docs: [`BookKeepingApp/backend/docs/AUTH_API.md`](../../../BookKeepingApp/backend/docs/AUTH_API.md).
- Production auth controller: [`BookKeepingApp/backend/controllers/auth/authController.ts`](../../../BookKeepingApp/backend/controllers/auth/authController.ts).
- Production auth services: [`BookKeepingApp/backend/services/auth`](../../../BookKeepingApp/backend/services/auth).
- Production auth middleware: [`BookKeepingApp/backend/middleware/auth.ts`](../../../BookKeepingApp/backend/middleware/auth.ts).
- Production auth frontend: [`BookKeepingApp/frontend/src/features/auth`](../../../BookKeepingApp/frontend/src/features/auth).
- Production DI: [`BookKeepingApp/backend/di/types.ts`](../../../BookKeepingApp/backend/di/types.ts).

## Backend Scope
1. Scaffold Express + Prisma + Zod + TypeScript backend.
2. Add models for `User` and `RefreshSession` or similarly named learning equivalents.
3. Add contracts:
   - `IAuthRepository`
   - `IAuthService`
   - `IAuthTokenService`
   - `IAuthSessionService`
4. Implement repository methods for creating users, finding by email/id, and storing/revoking refresh sessions.
5. Implement token service for signing/verifying access and refresh tokens.
6. Implement session service for creating, rotating, and revoking refresh sessions.
7. Implement auth service for signup, signin, refresh, logout, and current-user lookup.
8. Add `authenticate` middleware that reads the bearer token and attaches typed auth context to the request.
9. Add routes:
   - `POST /api/v1/auth/signup`
   - `POST /api/v1/auth/signin`
   - `POST /api/v1/auth/refresh`
   - `POST /api/v1/auth/logout`
   - `GET /api/v1/auth/me`
   - `GET /api/v1/protected-demo`
10. Add typed DI registrations.
11. Add central error handling and response helpers.

## Frontend Scope
1. Scaffold Vite + React + TypeScript + Tailwind.
2. Add React Hook Form + Zod for signin/signup forms.
3. Add typed models:
   - `AuthUser`
   - `SignInPayload`
   - `SignUpPayload`
   - `AuthTokens`
   - `AuthResponse`
   - `RefreshTokenPayload`
4. Add typed `authService` methods.
5. Add `authSlice`, `authThunks`, and `authSelectors`.
6. Add typed token persistence helper.
7. Add `ProtectedRoute` component.
8. Add pages:
   - `SignInPage`
   - `SignUpPage`
   - `ProfilePage`
   - `ProtectedDemoPage`
9. Add logout flow.
10. Add API client behavior for attaching bearer tokens.
11. Keep refresh behavior simple and documented.

## Docs
Create detailed numbered docs in `04-auth-basic/docs/`:

1. `01-overview.md` - what authentication means and what this module builds.
2. `02-password-hashing.md` - plain password vs hash, signup flow, security basics.
3. `03-signin-and-token-response.md` - signin request, credential check, token response examples.
4. `04-access-token-middleware.md` - bearer token, middleware, typed current user.
5. `05-refresh-token-sessions.md` - refresh tokens, storage, rotation, logout/revocation.
6. `06-frontend-auth-state.md` - auth slice, thunks, token persistence, selectors.
7. `07-protected-routes.md` - frontend route guard and backend protected endpoint.
8. `08-backend-contracts-and-di.md` - auth contracts and container registration.
9. `09-contract-trace.md` - trace `email`, `userId`, and `accessToken` across frontend/backend contracts.
10. `10-how-this-maps-to-production.md` - map learning files to production auth files.
11. `11-exercises.md` - password change, forgot password stub, role guard, token expiry experiment.

Docs must include sample JSON requests/responses and explain terms like hash, JWT, bearer token, refresh token, session, revoke, middleware, and route guard.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify signup -> signin -> protected endpoint -> refresh -> logout.
- Verify protected frontend route redirects when not signed in.
- Verify backend protected route rejects missing/invalid token.
- Verify DI container is typed and controllers do not instantiate services directly.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
