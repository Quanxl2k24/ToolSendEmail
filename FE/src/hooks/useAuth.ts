import { useState, useCallback } from 'react';
import type { User } from '../types';
import {
  getSavedUser,
  saveUser,
  clearUser,
  requestGoogleToken,
  fetchGoogleUserInfo,
  revokeGoogleToken,
  isGoogleAuthReady,
} from '../api/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(getSavedUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isGoogleAuthReady()) {
        throw new Error('Google Identity Services chưa được tải. Vui lòng đợi hoặc dùng Bypass.');
      }

      const accessToken = await requestGoogleToken();
      const info = await fetchGoogleUserInfo(accessToken);

      const newUser: User = {
        email: info.email,
        name: info.name ?? info.email,
        picture: info.picture,
        accessToken,
      };

      saveUser(newUser);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const current = getSavedUser();
    if (current?.accessToken && current.accessToken.startsWith('ya29.')) {
      try {
        await revokeGoogleToken(current.accessToken);
      } catch { /* silent */ }
    }
    clearUser();
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    signIn: signInWithGoogle,
    signOut,
    clearError: useCallback(() => setError(null), []),
  } as const;
}
