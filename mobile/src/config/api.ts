import { Platform } from "react-native";

/**
 * Get the API base URL based on the current platform.
 * Android emulator uses 10.0.2.2 to reach localhost:8000
 * iOS and web use localhost:8000
 */
export function getApiBaseUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }
  // iOS and web
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Available API endpoints
 */
export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  GET_COURSES: "/courses",
  GET_REGISTRANTS: (courseCode: string) =>
    `/courses/${courseCode}/registrants`,
  GET_REGISTRANT: (courseCode: string, registrantId: string) =>
    `/courses/${courseCode}/registrants/${registrantId}`,
  GET_SCAN_CONTEXT: (courseCode: string) =>
    `/courses/${courseCode}/scan-context`,
  REGISTER_COURSE: (courseCode: string) =>
    `/courses/${courseCode}/register`,
  MARK_ATTENDANCE: (courseCode: string, matricNumber: string) =>
    `/courses/${courseCode}/attendance/${matricNumber}`,
};

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};
