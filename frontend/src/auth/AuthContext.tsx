import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { authStore, decodeRoleFromAccessToken } from '../services/apiClient';
import { logger } from '../services/logger';

export interface StaffUser {
  username: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface RegistrantUser {
  matriculationNumber: string;
  departmentCode: string;
  registrantId: string;
}

export type AuthState =
  | { kind: 'unknown' }
  | { kind: 'anon' }
  | {
      kind: 'staff';
      user: StaffUser;
      accessToken: string;
      refreshToken: string | null;
    }
  | {
      kind: 'registrant';
      user: RegistrantUser;
      accessToken: string;
      refreshToken: string | null;
    };

export interface AuthContextValue {
  state: AuthState;
  currentRole: 'admin' | 'staff' | 'registrant' | 'anon' | 'loading';
  signInStaff: (username: string, password: string) => Promise<void>;
  signInRegistrant: (
    matriculationNumber: string,
    departmentCode: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  ingestLoginResponse: (payload: LoginResponse) => void;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  expires_in?: number;
  refresh_expires_at?: string | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

interface DecodedAccessToken {
  sub?: string;
  type?: string;
  rid?: string;
  dept?: string;
  is_admin?: boolean;
  name?: string;
  email?: string;
  exp?: number;
}

function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as DecodedAccessToken;
  } catch {
    return null;
  }
}

async function fetchStaffProfile(username: string): Promise<StaffUser | null> {
  try {
    const { data } = await axios.get<{ username: string; name: string; email: string }>(
      '/api/admin/whoami',
      {
        headers: { Authorization: `Bearer ${authStore.getAccessToken() ?? ''}` },
      },
    );
    return {
      username: data.username ?? username,
      name: data.name ?? username,
      email: data.email ?? '',
      isAdmin: true,
    };
  } catch {
    return {
      username,
      name: username,
      email: '',
      isAdmin: false,
    };
  }
}

function buildStateFromTokens(
  access: string,
  refresh: string | null,
): AuthState {
  const payload = decodeAccessToken(access);
  if (!payload) return { kind: 'anon' };
  if (payload.type === 'staff') {
    return {
      kind: 'staff',
      user: {
        username: payload.sub ?? '',
        name: payload.name ?? payload.sub ?? '',
        email: payload.email ?? '',
        isAdmin: Boolean(payload.is_admin),
      },
      accessToken: access,
      refreshToken: refresh,
    };
  }
  if (payload.type === 'registrant') {
    return {
      kind: 'registrant',
      user: {
        matriculationNumber: payload.sub ?? '',
        departmentCode: payload.dept ?? '',
        registrantId: payload.rid ?? '',
      },
      accessToken: access,
      refreshToken: refresh,
    };
  }
  return { kind: 'anon' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ kind: 'unknown' });
  const bootStarted = useRef(false);

  const ingestLoginResponse = useCallback((payload: LoginResponse) => {
    const access = payload.access_token;
    const refresh = payload.refresh_token ?? null;
    if (!access) {
      setState({ kind: 'anon' });
      authStore.clear();
      return;
    }
    const role = decodeRoleFromAccessToken(access) ?? 'anon';
    authStore.setTokens(access, refresh, role);
    setState(buildStateFromTokens(access, refresh));
  }, []);

  const signInStaff = useCallback(
    async (username: string, password: string) => {
      const form = new URLSearchParams();
      form.append('username', username);
      form.append('password', password);
      const { data } = await axios.post<LoginResponse>('/api/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      ingestLoginResponse(data);
      // If server didn't put is_admin in the token, try the whoami endpoint
      // to enrich the staff profile (best-effort).
      const next = decodeAccessToken(data.access_token);
      if (next?.type === 'staff' && !next.is_admin) {
        const profile = await fetchStaffProfile(next.sub ?? username);
        setState((s) =>
          s.kind === 'staff'
            ? { ...s, user: { ...s.user, ...(profile ?? {}), isAdmin: profile?.isAdmin ?? false } }
            : s,
        );
      }
    },
    [ingestLoginResponse],
  );

  const signInRegistrant = useCallback(
    async (matriculationNumber: string, departmentCode: string, password: string) => {
      const { data } = await axios.post<LoginResponse>('/api/auth/registrants/login', {
        matriculation_number: matriculationNumber,
        department_code: departmentCode,
        password,
      });
      ingestLoginResponse(data);
    },
    [ingestLoginResponse],
  );

  const signOut = useCallback(async () => {
    const refresh = authStore.getRefreshToken();
    if (refresh) {
      try {
        await axios.post('/api/auth/logout', { refresh_token: refresh });
      } catch (err) {
        logger.warn('auth.logout.failed', { error: String(err) });
      }
    }
    authStore.clear();
    setState({ kind: 'anon' });
  }, []);

  // Boot: try to refresh on mount.
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    (async () => {
      const refresh = authStore.getRefreshToken();
      if (!refresh) {
        setState({ kind: 'anon' });
        return;
      }
      try {
        const { data } = await axios.post<LoginResponse>('/api/auth/refresh', {
          refresh_token: refresh,
        });
        ingestLoginResponse(data);
      } catch {
        authStore.clear();
        setState({ kind: 'anon' });
      }
    })();
  }, [ingestLoginResponse]);

  // Listen for cross-component sign-out (e.g. refresh failure).
  useEffect(() => {
    const handler = () => setState({ kind: 'anon' });
    window.addEventListener('nihub:auth-lost', handler);
    return () => window.removeEventListener('nihub:auth-lost', handler);
  }, []);

  const currentRole = useMemo<AuthContextValue['currentRole']>(() => {
    if (state.kind === 'unknown') return 'loading';
    if (state.kind === 'anon') return 'anon';
    if (state.kind === 'staff') return state.user.isAdmin ? 'admin' : 'staff';
    return 'registrant';
  }, [state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      currentRole,
      signInStaff,
      signInRegistrant,
      signOut,
      ingestLoginResponse,
    }),
    [state, currentRole, signInStaff, signInRegistrant, signOut, ingestLoginResponse],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
