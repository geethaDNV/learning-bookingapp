# 02-Password Hashing: Secure Password Storage

## The Problem with Plain Text

If you stored passwords as plain text:
```
users table:
┌─────────┬──────────────────┐
│ id      │ password         │
├─────────┼──────────────────┤
│ user-1  │ myPassword123    │
│ user-2  │ secret456        │
└─────────┴──────────────────┘
```

A database breach exposes ALL passwords immediately.

## Password Hashing Solution

Instead, store a **hash** (one-way conversion):

```
users table:
┌─────────┬──────────────────────────────────────────────────────┐
│ id      │ password (bcrypt hash)                               │
├─────────┼──────────────────────────────────────────────────────┤
│ user-1  │ $2b$10$N9qo8uLOickgx2ZMRZoXyeIAzR3tI/rjzEKLR... │
│ user-2  │ $2b$10$NKGJl9uHdWVNHkxYJx3ZwePaU4L4pBBCr9TiI... │
└─────────┴──────────────────────────────────────────────────────┘
```

Even if the database is stolen:
- Hackers cannot read the original passwords
- Each hash looks completely different
- Cannot be reversed to get the original password

## How Hashing Works

### Bcrypt Example

```
Input:  "myPassword123"
        ↓
        [hash function with salt]
        ↓
Output: "$2b$10$N9qo8uLOickgx2ZMRZoXyeIAzR3tI/rjzEKLR..."
```

### Key Properties

1. **Deterministic (sort of)**: Same input always produces same output... with salt
2. **One-way**: Cannot reverse to get original password
3. **Collision-resistant**: Two different passwords won't produce the same hash
4. **Slow**: Intentionally takes milliseconds to prevent brute-force attacks

## Bcrypt Rounds

```typescript
const passwordHash = await bcryptjs.hash(password, 10);
                                               ↑
                                      rounds: 10 = ~10ms per hash
                                      rounds: 12 = ~75ms per hash
                                      rounds: 14 = ~600ms per hash
```

More rounds = slower = better security but more CPU time.

## Signup Flow

```
User enters:
"myPassword123"
        ↓
        └─→ Frontend: Validate with Zod
            ├─ Length >= 6
            ├─ Not empty
            └─ Send to backend
                    ↓
                    └─→ Backend: Route POST /api/v1/auth/signup
                        ├─ Validate email format
                        ├─ Check email not already used
                        ├─ bcrypt.hash(password, 10)
                        │  └─→ "$2b$10$N9qo8uLO..." (hash)
                        ├─ Store { email, hash } in database
                        ├─ Generate tokens
                        └─ Return { user, tokens }
                                ↓
                        Frontend: Store tokens, update Redux
```

## Signin Flow

```
User enters:
email: "user@example.com"
password: "myPassword123"
        ↓
        └─→ Backend: Route POST /api/v1/auth/signin
            ├─ Find user by email in database
            ├─ bcrypt.compare(inputPassword, storedHash)
            │  ├─ Input:  "myPassword123"
            │  ├─ Hash:   "$2b$10$N9qo8uLO..."
            │  └─ Result: true or false
            ├─ If true:
            │  ├─ Create refresh session
            │  ├─ Generate access token
            │  ├─ Generate refresh token
            │  └─ Return { user, tokens }
            └─ If false:
               └─ Return 401 error "Invalid credentials"
```

## Code Example

### Signup

```typescript
async signup(req: SignUpRequest): Promise<AuthResponse> {
  // Check if email exists
  const existing = await authRepository.findByEmail(req.email);
  if (existing) throw new ConflictError('Email already used');

  // Hash the password
  const passwordHash = await bcryptjs.hash(req.password, 10);
  //                                                    ↑
  //                                          10 rounds (cost)

  // Store user with hash (not plain password!)
  const user = await authRepository.create(
    req.email,
    passwordHash,  // ← Store this, not req.password
    req.name
  );

  // Return tokens...
}
```

### Signin

```typescript
async signin(req: SignInRequest): Promise<AuthResponse> {
  // Find user
  const user = await authRepository.findByEmail(req.email);
  if (!user) throw new AuthenticationError('Invalid credentials');

  // Compare password
  const isValid = await bcryptjs.compare(
    req.password,  // User input
    user.password  // Stored hash
  );

  if (!isValid) throw new AuthenticationError('Invalid credentials');

  // Generate and return tokens...
}
```

## Security Principles

### Never:
- Store passwords in plain text
- Send passwords over unencrypted connections (always use HTTPS)
- Log or debug passwords
- Use simple hash functions like MD5 or SHA1
- Reuse salt values

### Always:
- Use bcrypt, scrypt, or Argon2
- Hash on the backend (never frontend)
- Use HTTPS for password transmission
- Add random salt (bcrypt does this)
- Use sufficient rounds (10-14 is good for bcrypt)

## Common Mistakes

### ❌ Bad: Hashing on frontend
```typescript
// DON'T DO THIS
const hash = await sha256(password); // frontend
fetch('/signup', { password: hash }); // sending hash instead of password
```

Why? Attackers can intercept the hash and use it as a password.

### ❌ Bad: Not checking existence
```typescript
// DON'T DO THIS
async signup(email: string, password: string) {
  // What if email already exists? We'd create a duplicate!
  const hash = await bcrypt.hash(password, 10);
  return db.users.create({ email, password: hash });
}
```

### ✅ Good: Proper validation
```typescript
async signup(email: string, password: string) {
  const existing = await db.users.findByEmail(email);
  if (existing) throw new Error('Email already exists');

  const hash = await bcrypt.hash(password, 10);
  return db.users.create({ email, password: hash });
}
```

## Summary

- **Hash** passwords with bcrypt instead of storing plain text
- **Never** reverse a hash—that's why signup/signin use `bcrypt.compare()`
- **Always** hash on the backend
- **Use** 10-14 rounds for bcrypt (balance speed vs security)
- **Validate** email uniqueness before hashing
