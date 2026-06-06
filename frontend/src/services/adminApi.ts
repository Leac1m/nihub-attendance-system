import { apiClient } from './apiClient';

export interface Department {
  code: string;
  name: string;
  duration: string;
}

export interface Registrant {
  id: string;
  name: string;
  email: string;
  phone: string;
  matriculation_number: string;
  image_url?: string | null;
  attendance_days?: { date: string; present: boolean }[];
}

export interface StaffMember {
  username: string;
  name: string;
  email: string;
  is_admin: boolean;
  is_verified: boolean;
}

export function listDepartments() {
  return apiClient.get<{ departments: Department[] }>('/departments');
}

export function createDepartment(payload: {
  code: string;
  name: string;
  duration: string;
}) {
  return apiClient.post<{ message: string; department: Department }>('/departments', {
    code: payload.code,
    name: payload.name,
    duration: payload.duration,
  });
}

export function deleteDepartment(code: string) {
  return apiClient.delete<{ message: string }>(`/departments/${encodeURIComponent(code)}`);
}

export function listRegistrants(code: string) {
  return apiClient.get<{ code: string; registrants: Registrant[] }>(
    `/departments/${encodeURIComponent(code)}/registrants`,
  );
}

export function getRegistrant(code: string, id: string) {
  return apiClient.get<{ code: string; registrant: Registrant }>(
    `/departments/${encodeURIComponent(code)}/registrants/${encodeURIComponent(id)}`,
  );
}

export function downloadSpreadsheet(code: string) {
  return apiClient.get<Blob>(
    `/departments/${encodeURIComponent(code)}/attendance/spreadsheet`,
    { responseType: 'blob' },
  );
}

export function listStaff() {
  return apiClient.get<{ staff: StaffMember[] }>('/admin/staff');
}
