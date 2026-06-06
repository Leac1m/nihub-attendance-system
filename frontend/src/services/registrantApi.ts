import { apiClient } from './apiClient';

export interface RegistrantRegisterPayload {
  email: string;
  matriculationNumber: string;
  name?: string;
  phone?: string;
  password: string;
  departmentCode: string;
}

export interface RegistrantRegisterResponse {
  message: string;
  email: string;
  matriculation_number: string;
  department_code: string;
  verification_expires_at: string;
}

export interface RegistrantLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_at: string;
}

export function registerRegistrant(payload: RegistrantRegisterPayload) {
  return apiClient.post<RegistrantRegisterResponse>('/auth/registrants/register', {
    email: payload.email,
    matriculation_number: payload.matriculationNumber,
    name: payload.name,
    phone: payload.phone,
    password: payload.password,
    department_code: payload.departmentCode,
  });
}

export function verifyRegistrant(token: string) {
  return apiClient.post<RegistrantLoginResponse>('/auth/registrants/verify', { token });
}

export function loginRegistrant(payload: {
  matriculationNumber: string;
  departmentCode: string;
  password: string;
}) {
  return apiClient.post<RegistrantLoginResponse>('/auth/registrants/login', {
    matriculation_number: payload.matriculationNumber,
    department_code: payload.departmentCode,
    password: payload.password,
  });
}
