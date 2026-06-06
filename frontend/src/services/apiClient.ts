import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { logger } from './logger';

const REFRESH_KEY = 'nihub.refresh';
const ACCESS_KEY = 'nihub.access';
const ROLE_KEY = 'nihub.role';

export type Role = 'admin' | 'staff' | 'registrant' | 'anon' | 'loading';

interface AuthStore {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getRole: () => Role;
  onAuthChange: (cb: () => void) => () => void;
  notifyAuthChange: () => void;
  setTokens: (access: string | null, refresh: string | null, role: Role) => void;
  clear: () => void;
}

const listeners = new Set<() => void>();

export const authStore: AuthStore = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getRole: () => {
    const r = localStorage.getItem(ROLE_KEY);
    if (r === 'admin' || r === 'staff' || r === 'registrant' || r === 'anon') {
      return r;
    }
    return 'anon';
  },
  onAuthChange: (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  notifyAuthChange: () => {
    for (const cb of listeners) cb();
  },
  setTokens: (access, refresh, role) => {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    else localStorage.removeItem(ACCESS_KEY);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
    localStorage.setItem(ROLE_KEY, role);
    authStore.notifyAuthChange();
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.setItem(ROLE_KEY, 'anon');
    authStore.notifyAuthChange();
  },
};

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = authStore.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refresh = authStore.getRefreshToken();
  if (!refresh) return null;

  refreshInFlight = (async () => {
    try {
      const { data } = await axios.post(
        '/api/auth/refresh',
        { refresh_token: refresh },
        { headers: { 'Content-Type': 'application/json' } },
      );
      const access: string = data.access_token;
      const newRefresh: string | null = data.refresh_token ?? null;
      const role = decodeRoleFromAccessToken(access) ?? 'anon';
      authStore.setTokens(access, newRefresh, role);
      return access;
    } catch (err) {
      logger.warn('auth.refresh.failed', { error: String(err) });
      authStore.clear();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function decodeRoleFromAccessToken(token: string): Role | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload)) as { type?: string; is_admin?: boolean };
    if (decoded.type === 'staff') return decoded.is_admin ? 'admin' : 'staff';
    if (decoded.type === 'registrant') return 'registrant';
    return null;
  } catch {
    return null;
  }
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

function isRegistrantEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/registrants/');
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined;
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }
    if (original._retried) {
      return Promise.reject(error);
    }
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    const newAccess = await attemptRefresh();
    if (!newAccess) {
      const target = isRegistrantEndpoint(original.url) ? '/portal/login' : '/login';
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith(target)) {
        window.history.replaceState({}, '', target);
        window.dispatchEvent(new CustomEvent('nihub:auth-lost', { detail: { target } }));
      }
      return Promise.reject(error);
    }

    original._retried = true;
    original.headers = original.headers ?? {};
    (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccess}`;
    return apiClient.request(original);
  },
);

export { decodeRoleFromAccessToken };
