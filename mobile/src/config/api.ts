import { Platform } from "react-native";
import * as Device from "expo-device";

/**
 * Get the API base URL based on the current platform.
 * Android emulator uses 10.0.2.2 to reach localhost:8000
 * iOS simulator and web use localhost:8000
 * Physical Android / iOS devices on the same LAN use the host machine IP
 */
export function getApiBaseUrl(): string {
  if (Platform.OS === "android") {
    // 10.0.2.2 only works inside the Android emulator
    if (Device.isDevice) {
      // Physical Android phone: reach the host on the LAN
      return "http://10.1.1.240:8000";
    }
    return "http://10.0.2.2:8000";
  }
  if (Platform.OS === "ios") {
    // Physical iOS device → use host LAN IP; simulator → localhost
    return Device.isDevice ? "http://10.1.1.240:8000" : "http://localhost:8000";
  }
  // Web
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Available API endpoints
 */
export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER_STAFF: "/auth/register",
  VERIFY_STAFF_ACCOUNT: "/auth/verify-account",
  GET_COURSES: "/courses",
  CREATE_COURSE: "/courses",
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
  DOWNLOAD_ATTENDANCE_SPREADSHEET: (courseCode: string) =>
    `/courses/${courseCode}/attendance/spreadsheet`,
  DELETE_COURSE: (courseCode: string) => `/courses/${courseCode}`,
};

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};
