# 11-Exercises: Extend Your Learning

## Exercise 1: Password Change

**Objective**: Add a password change endpoint

### Backend

1. Add Zod schema for password change:
```typescript
// src/schemas/authSchemas.ts

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});
```

2. Add repository method:
```typescript
// src/repositories/authRepository.ts

async updatePassword(userId: string, newPasswordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password: newPasswordHash },
  });
}
```

3. Add service method:
```typescript
// src/services/authService.ts

async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await this.authRepository.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const isValid = await bcryptjs.compare(currentPassword, user.password);
  if (!isValid) throw new AuthenticationError('Current password is incorrect');

  const newHash = await bcryptjs.hash(newPassword, 10);
  await this.authRepository.updatePassword(userId, newHash);
}
```

4. Add controller route:
```typescript
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = ChangePasswordSchema.parse(req.body);
    await authService.changePassword(
      req.auth.userId,
      body.currentPassword,
      body.newPassword
    );
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    // ... error handling
  }
});
```

### Frontend

1. Create change password form:
```typescript
// src/pages/ChangePasswordPage.tsx

function ChangePasswordPage() {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector(selectAccessToken);

  const handleSubmit = async (data: ChangePasswordInput) => {
    try {
      await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });
      // Show success message
    } catch (error) {
      // Show error message
    }
  };

  return (
    // Form with current password, new password, confirm password
  );
}
```

2. Add to router:
```typescript
<Route
  path="/change-password"
  element={
    <ProtectedRoute>
      <ChangePasswordPage />
    </ProtectedRoute>
  }
/>
```

**Testing**: 
- Try changing password with wrong current password (should fail)
- Change password successfully
- Sign out and sign in with new password
- Verify old password doesn't work

---

## Exercise 2: Forgot Password Flow

**Objective**: Implement forgot password with email verification

### Backend

1. Create password reset token:
```typescript
// src/models/passwordReset.prisma

model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  token     String   @unique  // Random token
  expiresAt DateTime          // 1 hour expiry
  usedAt    DateTime?          // When reset was used
  
  createdAt DateTime @default(now())
}
```

2. Add forgot password service:
```typescript
async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
  const user = await this.authRepository.findByEmail(email);
  if (!user) {
    // For security, don't reveal if email exists
    return { resetToken: 'token-sent' };
  }

  const resetToken = generateSecureToken();
  
  // Store in database with expiry (1 hour)
  await this.passwordResetRepository.create(
    user.id,
    resetToken,
    new Date(Date.now() + 60 * 60 * 1000)
  );

  // Send email with reset link
  await this.emailService.sendPasswordResetEmail(
    user.email,
    `http://localhost:3000/reset-password?token=${resetToken}`
  );

  return { resetToken: 'token-sent' };
}

async resetPassword(resetToken: string, newPassword: string): Promise<void> {
  const reset = await this.passwordResetRepository.findByToken(resetToken);
  
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  const newHash = await bcryptjs.hash(newPassword, 10);
  await this.authRepository.updatePassword(reset.userId, newHash);
  
  // Mark token as used
  await this.passwordResetRepository.markUsed(reset.id);
}
```

3. Add routes:
```typescript
router.post('/forgot-password', async (req, res) => {
  const { email } = ForgotPasswordSchema.parse(req.body);
  const result = await authService.requestPasswordReset(email);
  res.json(result);
});

router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword } = ResetPasswordSchema.parse(req.body);
  await authService.resetPassword(resetToken, newPassword);
  res.json({ message: 'Password reset successfully' });
});
```

### Frontend

1. Forgot password page:
```typescript
// src/pages/ForgotPasswordPage.tsx

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    await authService.requestPasswordReset({ email });
    setSubmitted(true);
  };

  if (submitted) {
    return <div>Check your email for reset instructions</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button>Send Reset Link</button>
    </form>
  );
}
```

2. Reset password page:
```typescript
// src/pages/ResetPasswordPage.tsx

function ResetPasswordPage() {
  const [token] = useSearchParams(); // From ?token=xyz
  const [password, setPassword] = useState('');

  const handleReset = async () => {
    await authService.resetPassword(token, password);
    navigate('/signin');
  };

  return (
    <form onSubmit={handleReset}>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button>Reset Password</button>
    </form>
  );
}
```

**Testing**:
- Request password reset for non-existent email (should succeed silently)
- Check email for reset link
- Click reset link, change password
- Sign in with new password

---

## Exercise 3: Role-Based Access Control

**Objective**: Add roles (admin/user) and admin-only endpoints

### Backend

1. Update User model:
```typescript
// prisma/schema.prisma

model User {
  // ... existing fields ...
  role  String @default("user")  // "admin" or "user"
}
```

2. Add authorization middleware:
```typescript
// src/middleware/auth.ts

export function authorize(requiredRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });

    // Query user role (you'd cache this)
    const userRole = req.auth.role || 'user';

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}
```

3. Add admin endpoint:
```typescript
// src/controllers/authController.ts

router.get('/admin/users', authorize(['admin']), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true }
  });
  res.json(users);
});

router.patch('/admin/users/:id/role', authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  res.json({ message: 'Role updated', user });
});
```

### Frontend

1. Add role to auth state:
```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role?: 'admin' | 'user';
}
```

2. Add admin route protection:
```typescript
// src/components/AdminRoute.tsx

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useSelector(selectAuthUser);

  if (user?.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
```

3. Admin dashboard:
```typescript
// src/pages/AdminDashboard.tsx

function AdminDashboard() {
  const accessToken = useSelector(selectAccessToken);
  const [users, setUsers] = useState<AuthUser[]>([]);

  useEffect(() => {
    fetch('/api/v1/admin/users', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(r => r.json())
    .then(setUsers);
  }, [accessToken]);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <table>
        <tr><th>Email</th><th>Role</th><th>Actions</th></tr>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
              <button onClick={() => changeRole(user.id, 'admin')}>
                Make Admin
              </button>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

**Testing**:
- Sign up user and note ID
- Manually update role to admin in database
- Sign in as admin
- Verify admin dashboard visible
- Change other users' roles
- Sign in as non-admin, verify access denied

---

## Exercise 4: Token Expiry Experiment

**Objective**: Observe token expiry and refresh behavior

### Backend

Modify `.env`:
```
JWT_EXPIRY=10s        # Very short expiry (10 seconds)
REFRESH_TOKEN_EXPIRY=1m  # 1 minute
```

### Frontend

1. Add token expiry indicator:
```typescript
// src/utils/tokenUtils.ts

export function parseJWT(token: string): { exp?: number } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch {
    return {};
  }
}

export function getTokenExpiryTime(token: string): Date | null {
  const payload = parseJWT(token);
  if (payload.exp) {
    return new Date(payload.exp * 1000);
  }
  return null;
}
```

2. Display remaining time:
```typescript
// src/pages/ProfilePage.tsx

function ProfilePage() {
  const accessToken = useSelector(selectAccessToken);
  const [expiresIn, setExpiresIn] = useState<number>(0);

  useEffect(() => {
    if (!accessToken) return;

    const expiryTime = getTokenExpiryTime(accessToken);
    if (!expiryTime) return;

    const interval = setInterval(() => {
      const remaining = Math.floor((expiryTime.getTime() - Date.now()) / 1000);
      setExpiresIn(remaining);

      if (remaining <= 0) {
        setExpiresIn(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken]);

  return (
    <div>
      <p>Token expires in: {expiresIn} seconds</p>
      {expiresIn < 5 && expiresIn > 0 && (
        <p>⚠️ Token expiring soon. Will auto-refresh.</p>
      )}
      {expiresIn <= 0 && (
        <button onClick={handleRefresh}>Refresh Token</button>
      )}
    </div>
  );
}
```

**Observation**:
- Watch access token countdown to 0
- Note when it expires
- Click "Refresh Token" to get new one
- Observe both access and refresh tokens reset

---

## Exercise 5: Email Verification

**Objective**: Add email verification step after signup

### Backend

1. Add email verification model:
```typescript
model EmailVerification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  code      String   @unique  // 6-digit or random
  verified  Boolean  @default(false)
  expiresAt DateTime
  
  createdAt DateTime @default(now())
}
```

2. Modify signup:
```typescript
async signup(req: SignUpRequest): Promise<AuthResponse> {
  // ... create user ...
  
  // Generate verification code
  const code = generateVerificationCode();
  await this.emailVerificationRepository.create(user.id, code);
  
  // Send email with code
  await this.emailService.sendVerificationEmail(user.email, code);
  
  // Return response with verificationRequired flag
  return {
    user: { ...user, emailVerified: false },
    tokens: { ... },
    verificationRequired: true
  };
}

async verifyEmail(userId: string, code: string): Promise<void> {
  const verification = await this.emailVerificationRepository.findByCode(code);
  
  if (!verification || verification.userId !== userId) {
    throw new AuthenticationError('Invalid verification code');
  }
  
  if (verification.expiresAt < new Date()) {
    throw new AuthenticationError('Verification code expired');
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true }
  });
  
  await this.emailVerificationRepository.markVerified(verification.id);
}
```

### Frontend

1. Verification page:
```typescript
// src/pages/VerifyEmailPage.tsx

function VerifyEmailPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    try {
      await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      navigate('/signin');
    } catch (error) {
      // Show error
    }
  };

  return (
    <div>
      <h1>Verify Email</h1>
      <p>Check your email for verification code</p>
      <input value={code} onChange={e => setCode(e.target.value)} placeholder="000000" />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
}
```

2. Redirect from signup:
```typescript
const result = await dispatch(signupThunk(data));
if (result.meta.requestStatus === 'fulfilled' && result.payload.verificationRequired) {
  navigate('/verify-email');
}
```

---

## Challenge Exercises

### Advanced Challenge 1: Implement Session Revocation on All Devices

After password change, revoke all other refresh sessions (force logout from other devices).

### Advanced Challenge 2: Add Rate Limiting

Prevent brute-force attacks by limiting signin attempts (e.g., 5 attempts per 15 minutes).

### Advanced Challenge 3: Implement Remember Me

Add "Remember Me" checkbox that extends token lifetime.

### Advanced Challenge 4: Add Social Signup

Implement Google or GitHub OAuth integration.

### Advanced Challenge 5: Add Email Notifications

Send email on:
- New signup
- Password change
- Suspicious login
- Account locked (too many failed attempts)

---

## Testing Checklist

After completing exercises, test:

```
Change Password:
☐ Wrong current password rejected
☐ New password too short rejected
☐ Password changed successfully
☐ Can signin with new password
☐ Old password doesn't work

Forgot Password:
☐ Email sent for registered accounts
☐ No error for unregistered emails
☐ Reset token expires after 1 hour
☐ Reset token works once
☐ Can signin with reset password

RBAC:
☐ User cannot access admin routes
☐ Admin can access admin routes
☐ Admin can change other users' roles
☐ Permissions checked on backend

Token Expiry:
☐ Token countdown accurate
☐ Refresh endpoint works
☐ Expired token rejected
☐ Refresh token rotates

Email Verification:
☐ Code sent after signup
☐ Wrong code rejected
☐ Correct code verifies
☐ Cannot signin before verification
☐ User marked as verified
```

## Summary

These exercises teach:
1. **Password management**: Change, forgot, reset flows
2. **Authorization**: Roles and permissions
3. **Token lifecycle**: Expiry, refresh, observation
4. **Email workflows**: Verification, notifications
5. **Security**: Rate limiting, session management, suspicious activity

Start with exercise 1-3, then tackle the advanced challenges!
