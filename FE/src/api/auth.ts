import type { User } from '../types';
import { AUTH } from '../constants';

export function getJwt(): string | null {
  return localStorage.getItem(AUTH.JWT_STORAGE_KEY);
}

export function saveJwt(token: string): void {
  localStorage.setItem(AUTH.JWT_STORAGE_KEY, token);
}

export function clearJwt(): void {
  localStorage.removeItem(AUTH.JWT_STORAGE_KEY);
}

/**
 * Decode JWT payload without verifying signature (client-side only).
 * Handles base64url encoding (RFC 4648) used by JWT.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1]!
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  } catch {
    return null;
  }
}

/**
 * Check if a JWT has expired (client-side estimate).
 */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  const exp = payload.exp as number | undefined;
  if (!exp) return false;
  return Date.now() >= exp * 1000;
}

/**
 * Redirect the browser to the backend's Google OAuth URL.
 * The backend will redirect back to this app with a JWT token in query params.
 */
export function redirectToGoogleLogin(): void {
  window.location.href = `${AUTH.API_URL}/api/auth/google/url`;
}

/**
 * Check if the current URL has a JWT token from the OAuth callback.
 * If found, save it, clean the URL, and return the decoded user info.
 */
export function handleOAuthCallback(): { token: string; user: User } | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.email !== 'string') {
    clearJwt();
    return null;
  }

  saveJwt(token);

  // Clean URL — remove token param without page reload
  window.history.replaceState({}, '', window.location.pathname);

  const user: User = {
    email: payload.email,
    name: typeof payload.name === 'string' ? payload.name : payload.email,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    accessToken: token,
  };

  return { token, user };
}

/**
 * Check if the URL has an OAuth error (user denied consent, state mismatch, etc.)
 */
export function getOAuthError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  if (!error) return null;

  window.history.replaceState({}, '', window.location.pathname);

  const messages: Record<string, string> = {
    access_denied: 'Bạn đã từ chối quyền truy cập. Vui lòng thử lại.',
    state_mismatch: 'Lỗi bảo mật. Vui lòng thử lại.',
  };

  return messages[error] ?? `Lỗi xác thực: ${error}`;
}

/**
 * Refresh the JWT by calling the backend endpoint.
 * Returns the new token or null if refresh failed.
 */
export async function refreshJwt(): Promise<string | null> {
  const current = getJwt();
  if (!current) return null;

  try {
    const res = await fetch(`${AUTH.API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${current}` },
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.warn('Rate limited on JWT refresh');
      }
      clearJwt();
      return null;
    }
    const data = await res.json() as { token?: string };
    if (data.token) {
      saveJwt(data.token);
      return data.token;
    }
    return null;
  } catch {
    clearJwt();
    return null;
  }
}

export function revokeGoogleToken(_accessToken: string): Promise<void> {
  return Promise.resolve();
}

export function saveUser(user: User): void {
  localStorage.setItem(AUTH.STORAGE_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(AUTH.STORAGE_KEY);
}

export function getSavedUser(): User | null {
  const saved = localStorage.getItem(AUTH.STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    clearUser();
    return null;
  }
}
