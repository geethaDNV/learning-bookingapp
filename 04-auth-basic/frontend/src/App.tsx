/**
 * Main App component with routing
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { tokenStorage } from './services/tokenStorage';
import { authRestoreFromStorage } from './store/authSlice';
import { loadCurrentUserThunk } from './store/authThunks';
import type { AppDispatch } from './store/store';

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const { accessToken: savedAccessToken, refreshToken: savedRefreshToken } = tokenStorage.loadTokens();
    
    if (savedAccessToken) {
      dispatch(authRestoreFromStorage({
        user: null,
        accessToken: savedAccessToken,
        refreshToken: savedRefreshToken,
      }));
      dispatch(loadCurrentUserThunk(savedAccessToken));
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/profile" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
