import { refreshTokenSilently } from './auth';

const DEFAULT_BASE_URL = 'http://localhost:3000';

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL;
}

export function getToken(): string | null {
  try {
    const raw = localStorage.getItem('google_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.accessToken ?? null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshTokenSilently()
      .then(() => getToken())
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    formData?: FormData;
    params?: Record<string, string>;
  },
): Promise<T> {
  const token = getToken();
  const url = new URL(`${getBaseUrl()}/api${path}`);

  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let body: BodyInit | undefined;

  if (options?.formData) {
    body = options.formData;
  } else if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let res = await fetch(url.toString(), { method, headers, body });

  if (res.status === 401 && token) {
    const newToken = await getRefreshedToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url.toString(), { method, headers, body });
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      message = errBody.message ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get<T>(path: string, params?: Record<string, string>) {
    return request<T>('GET', path, { params });
  },

  post<T>(path: string, body?: unknown) {
    return request<T>('POST', path, { body });
  },

  postForm<T>(path: string, formData: FormData) {
    return request<T>('POST', path, { formData });
  },
};
