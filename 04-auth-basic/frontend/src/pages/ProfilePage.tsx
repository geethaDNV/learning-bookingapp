/**
 * ProfilePage - Display current user and allow logout
 */

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectAuthUser,
  selectAccessToken,
  authClear,
} from '../store/authSlice';
import { tokenStorage } from '../services/tokenStorage';
import { authService } from '../services/authService';
import type { AppDispatch } from '../store/store';
import { useState } from 'react';

export function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const accessToken = useSelector(selectAccessToken);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [protectedData, setProtectedData] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (accessToken) {
        await authService.logout(accessToken);
      }
      tokenStorage.clearTokens();
      dispatch(authClear());
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleTestProtectedEndpoint = async () => {
    if (!accessToken) return;
    try {
      const data = await authService.getProtectedDemo(accessToken);
      setProtectedData(JSON.stringify(data, null, 2));
    } catch (error) {
      setProtectedData(`Error: ${(error as Error).message}`);
    }
  };

  if (!user) {
    return (
      <div className="text-center mt-8">
        <p className="text-gray-500">Not authenticated</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-gray-600 text-sm">Email</label>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>

            {user.name && (
              <div>
                <label className="block text-gray-600 text-sm">Name</label>
                <p className="text-lg font-semibold">{user.name}</p>
              </div>
            )}

            <div>
              <label className="block text-gray-600 text-sm">User ID</label>
              <p className="text-sm font-mono text-gray-500">{user.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleTestProtectedEndpoint}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-lg"
            >
              Test Protected Endpoint
            </button>

            {protectedData && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Response:</p>
                <pre className="text-xs overflow-auto text-gray-800">{protectedData}</pre>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg disabled:bg-gray-400"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
