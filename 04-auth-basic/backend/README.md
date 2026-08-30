# 04-Auth-Basic Backend

A learning module for authentication with Express, Prisma, TypeScript, and dependency injection.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Set up the database:
   ```bash
   npm run prisma:push
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

## Running

Development (with auto-reload and Prisma Studio):
```bash
npm run dev
```

Build:
```bash
npm run build
```

Production:
```bash
npm run build
npm start
```

## Architecture

### Dependency Injection (DI)
The `src/di/container.ts` file defines the `Cradle` class which wires together all services, repositories, and controllers.

- **Repositories** (`IAuthRepository`, `AuthSessionRepository`): Data access layer
- **Services** (`IAuthTokenService`, `IAuthService`): Business logic
- **Controllers** (`authController`): HTTP route handlers
- **Middleware** (`authMiddleware`): Express middleware for token verification

### Type Safety
All contracts are defined in `src/di/types.ts`. Services depend on interfaces, not concrete implementations.

### Error Handling
Custom error classes in `src/errors/appError.ts` provide consistent error responses.

### Schema Validation
Zod schemas in `src/schemas/authSchemas.ts` validate and type incoming requests.

## API Endpoints

### POST /api/v1/auth/signup
Sign up a new user.

Request:
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

Response:
```json
{
  "user": {
    "id": "cuid-string",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST /api/v1/auth/signin
Sign in with email and password.

Request:
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

Response: Same as signup.

### POST /api/v1/auth/refresh
Refresh the access token using a refresh token.

Request:
```json
{
  "refreshToken": "eyJ..."
}
```

Response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### POST /api/v1/auth/logout
Log out the current user.

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/v1/auth/me
Get the current user profile.

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "id": "cuid-string",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### GET /api/v1/protected-demo
A demo protected endpoint.

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "message": "This is a protected endpoint",
  "userId": "cuid-string",
  "email": "user@example.com"
}
```
