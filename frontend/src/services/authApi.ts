import { apiClient } from './apiClient';

export interface StaffLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_at: string;
}

export function loginStaff(username: string, password: string) {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  return apiClient.post<StaffLoginResponse>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export function refresh(refreshToken: string) {
  return apiClient.post<StaffLoginResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refresh_token: refreshToken });
}

export interface WhoamiResponse {
  username: string;
  name: string;
  email: string;
  is_admin?: boolean;
}

export function getWhoami() {
  return apiClient.get<WhoamiResponse>('/admin/whoami');
}
