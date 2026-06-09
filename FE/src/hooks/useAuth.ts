import { useState, useCallback } from 'react';
import type { User } from '../types';
import {
  getSavedUser,
  saveUser,
  clearUser,
  redirectToGoogleLogin,
  handleOAuthCallback,
  getOAuthError,
  isJwtExpired,
  getJwt,
  clearJwt,
} from '../api/auth';

// Check for OAuth callback JWT or error in URL on first load
let initialUser: User | null = getSavedUser();

// If there's a saved JWT but it's expired, force re-login
const currentJwt = getJwt();
if (currentJwt && isJwtExpired(currentJwt)) {
  clearJwt();
  clearUser();
  initialUser = null;
}

// Check for OAuth callback
const callbackResult = handleOAuthCallback();
if (callbackResult) {
  saveUser(callbackResult.user);
  initialUser = callbackResult.user;
}

// Check for OAuth error
let initialError: string | null = null;
const oauthError = getOAuthError();
if (oauthError) {
  initialError = oauthError;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const signInWithGoogle = useCallback(() => {
    setLoading(true);
    setError(null);
    redirectToGoogleLogin();
  }, []);

  const signOut = useCallback(() => {
    clearJwt();
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
