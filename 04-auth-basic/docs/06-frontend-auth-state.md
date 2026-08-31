# 06-Frontend Auth State: Redux Auth Management

## Why Redux for Auth?

Multiple components need auth state:
- Navigation (show logout button only if logged in)
- Profile page (display user name)
- Protected routes (guard pages)
- API client (attach access token)

Instead of passing props down and up, Redux centralizes auth state.

## Auth State Shape

```typescript
interface AuthState {
  user: AuthUser | null;          // Current logged-in user
  accessToken: string | null;     // Current access token
  refreshToken: string | null;    // Current refresh token
  isLoading: boolean;             // Request in progress
  error: string | null;           // Last error message
}
```

## Auth Slice (Actions + Reducers)

```typescript
// src/store/authSlice.ts

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authClear: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isLoading = false;
      state.error = null;
    },
    authRestoreFromStorage: (state, action: PayloadAction<{ ... }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signinThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signinThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
      })
      .addCase(signinThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message || 'Failed to sign in';
      });
  },
});
```

`signupThunk`, `refreshThunk`, `logoutThunk`, and `loadCurrentUserThunk` follow the same pending, fulfilled, and rejected builder pattern.

## Thunks (Async Actions)

```typescript
// src/store/authThunks.ts

export const signinThunk = createAsyncThunk(
  'auth/signin',
  async (payload: SignInPayload, { rejectWithValue }) => {
    try {
      const result = await authService.signin(payload);
      
      // Side effect: Save to localStorage
      tokenStorage.saveTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken
      );
      
      // Return data for reducer
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);
```

When dispatched, thunk goes through three states:

```
dispatch(signinThunk({ email, password }))
    ↓
    [PENDING] isLoading = true
    ├─ Make API call
    ├─ If success:
    │   ↓
    │   [FULFILLED] payload = { user, tokens }
    │   ├─ extraReducers handles signinThunk.fulfilled
    │   └─ state = { user, tokens, isLoading: false, error: null }
    │
    └─ If error:
        ↓
        [REJECTED] error = message
      ├─ extraReducers handles signinThunk.rejected
        └─ state = { ..., isLoading: false, error: message }
```

## Selectors

```typescript
// src/store/authSlice.ts

export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
```

Selectors:
- Extract specific parts of state
- Memoized (only recomputed if input changes)
- Help with testing (no need to know state shape)

## Redux Store Setup

```typescript
// src/store/store.ts

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here: profile, notifications, etc.
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```typescript
// src/main.tsx

<Provider store={store}>
  <App />
</Provider>
```

## Component Integration

### Reading State

```typescript
// SignInPage.tsx
function SignInPage() {
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  return (
    <form>
      <button disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Dispatching Actions

```typescript
// SignInPage.tsx
function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (data: SignInPayload) => {
    await dispatch(signinThunk(data));
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Deriving State

```typescript
// Navigation.tsx
function Navigation() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);

  if (!isAuthenticated) {
    return <a href="/signin">Sign In</a>;
  }

  return (
    <div>
      <span>Welcome, {user?.email}</span>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

## Restoring Auth from Storage

On app startup, check localStorage and restore tokens:

```typescript
// src/App.tsx
function AppContent() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const { accessToken, refreshToken } = tokenStorage.loadTokens();
    
    if (accessToken) {
      dispatch(authRestoreFromStorage({
        user: null,
        accessToken,
        refreshToken,
      }));
      dispatch(loadCurrentUserThunk(accessToken));
    }
  }, [dispatch]);

  return <Routes>...</Routes>;
}
```

## Token Refresh in Redux

```typescript
// src/store/authThunks.ts
export const refreshThunk = createAsyncThunk(
  'auth/refresh',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const result = await authService.refresh({ refreshToken });
      
      tokenStorage.saveTokens(
        result.accessToken,
        result.refreshToken
      );
      
      return result;
    } catch (error) {
      // If refresh fails, user must login again
      return rejectWithValue((error as Error).message);
    }
  }
);
```

Component dispatches it:

```typescript
// ProfilePage.tsx
if (tokenExpiringSoon(accessToken)) {
  await dispatch(refreshThunk(refreshToken || ''));
  // The extra reducers update either tokens or error state.
}
```

## Logout Flow

```typescript
// Dispatch logout thunk
try {
  await dispatch(logoutThunk(accessToken || '')).unwrap();
  navigate('/signin');
} catch {
  // The rejected reducer has cleared auth state and recorded the error.
}
```

## Data Flow Diagram

```
User fills signup form
    ↓
Submit with React Hook Form
    ↓
dispatch(signupThunk(formData))
    ├─ Thunk pending
  │  └─ extraReducers → isLoading = true
    │
    ├─ API call: POST /api/v1/auth/signup
    │  └─ Backend returns { user, tokens }
    │
    ├─ Thunk fulfilled
    │  ├─ Side effect: tokenStorage.saveTokens(...)
    │  └─ extraReducers stores user and tokens
    │      └─ Redux state updated
    │
    └─ Component re-renders
       ├─ selectIsAuthenticated returns true
       ├─ selectAuthUser returns user
       └─ navigate('/profile') triggered
```

## Type Safety

Everything is strongly typed:

```typescript
// Thunk parameter
signupThunk(payload: SignUpPayload)  // ✓ Typed input

// Dispatch
const result = dispatch(signupThunk(formData));
// ✓ result type is known

// Selectors
const user = useSelector(selectAuthUser);
// ✓ user type is AuthUser | null

// Reducers receive a typed fulfilled action payload.
// ✓ action.payload is { user: AuthUser; tokens: AuthTokens }
```

## Testing Redux

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

describe('authSlice', () => {
  it('should set user on signin', () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    
    const testUser = { id: '1', email: 'test@example.com', name: null };
    const testTokens = { accessToken: 'token1', refreshToken: 'token2' };
    
    store.dispatch(signinThunk.fulfilled(
      { user: testUser, tokens: testTokens },
      'request-id',
      { email: 'test@example.com', password: 'password' }
    ));
    
    const state = store.getState();
    expect(state.auth.user).toEqual(testUser);
    expect(state.auth.isLoading).toBe(false);
  });
});
```

## Summary

- **authSlice** defines state shape, reducers, and selectors
- **authThunks** handle async signup/signin/logout
- **Selectors** extract typed state safely
- **Components** use useSelector to read and useDispatch to write
- **tokenStorage** persists tokens to localStorage
- **Type-safe** end-to-end with TypeScript
