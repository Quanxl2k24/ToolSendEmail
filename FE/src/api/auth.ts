import type { User } from '../types';
import { AUTH } from '../constants';

type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: { hint?: string; prompt?: string }) => void;
};

let tokenClient: GoogleTokenClient | null = null;
let tokenResolve: ((token: string) => void) | null = null;
let tokenReject: ((error: Error) => void) | null = null;

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => GoogleTokenClient;
          revoke: (accessToken: string, done: () => void) => void;
        };
        id: {
          initialize: (config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function getClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
}

export function isGoogleAuthReady(): boolean {
  return !!window.google?.accounts?.oauth2;
}

function handleTokenResponse(response: { access_token?: string; error?: string }): void {
  if (response.access_token) {
    updateStoredToken(response.access_token);
    if (tokenResolve) {
      tokenResolve(response.access_token);
      tokenResolve = null;
      tokenReject = null;
    }
  } else {
    if (tokenReject) {
      tokenReject(new Error(response.error ?? 'Không thể lấy access token.'));
      tokenResolve = null;
      tokenReject = null;
    }
  }
}

function updateStoredToken(newToken: string): void {
  const raw = localStorage.getItem(AUTH.STORAGE_KEY);
  if (!raw) return;
  try {
    const user = JSON.parse(raw);
    user.accessToken = newToken;
    localStorage.setItem(AUTH.STORAGE_KEY, JSON.stringify(user));
  } catch { /* ignore */ }
}

export function initGoogleAuth(): boolean {
  if (tokenClient) return true;
  const clientId = getClientId();
  if (!clientId || !window.google?.accounts?.oauth2) return false;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: AUTH.SCOPE,
    callback: handleTokenResponse,
  });

  return true;
}

export function requestGoogleToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!initGoogleAuth()) {
      reject(new Error('Google OAuth chưa sẵn sàng. Vui lòng kiểm tra Client ID hoặc tải lại trang.'));
      return;
    }

    tokenResolve = resolve;
    tokenReject = reject;
    tokenClient!.requestAccessToken();
  });
}

export function refreshTokenSilently(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!initGoogleAuth()) {
      reject(new Error('Google OAuth chưa sẵn sàng.'));
      return;
    }

    tokenResolve = resolve;
    tokenReject = reject;
    tokenClient!.requestAccessToken({ prompt: '' });
  });
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('Không thể lấy thông tin người dùng từ Google.');
  }

  return res.json();
}

export function revokeGoogleToken(accessToken: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(accessToken, () => resolve());
    } else {
      resolve();
    }
  });
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
