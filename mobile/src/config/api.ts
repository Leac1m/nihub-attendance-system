import { Platform } from "react-native";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEV_OVERRIDE_STORAGE_KEY = "DEV_API_BASE_URL_OVERRIDE";

/**
 * Module-level mutable variable holding the current override URL.
 * Initialized to null; populated by initApiOverride() on app start.
 */
let _overrideUrl: string | null = null;

/**
 * Call this once at app startup (e.g. in _layout.tsx) to load a persisted
 * URL override from AsyncStorage into the in-memory variable.
 */
export async function initApiOverride(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(DEV_OVERRIDE_STORAGE_KEY);
    _overrideUrl = stored ?? null;
  } catch {
    _overrideUrl = null;
  }
}

/**
 * Returns the currently active URL override, or null if none is set.
 */
export function getOverrideUrl(): string | null {
  return _overrideUrl;
}

/**
 * Persist and apply a new URL override. Pass null to clear the override.
 */
export async function setOverrideUrl(url: string | null): Promise<void> {
  try {
    if (url) {
      await AsyncStorage.setItem(DEV_OVERRIDE_STORAGE_KEY, url);
    } else {
      await AsyncStorage.removeItem(DEV_OVERRIDE_STORAGE_KEY);
    }
    _overrideUrl = url;
  } catch (e) {
    console.error("Failed to persist API URL override:", e);
  }
}

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
      return "http://192.168.254.164:8000";
    }
    return "http://10.0.2.2:8000";
  }
  if (Platform.OS === "ios") {
    // Physical iOS device → use host LAN IP; simulator → localhost
    return Device.isDevice ? "http://192.168.254.164:8000" : "http://localhost:8000";
  }
  // Web
  return "http://localhost:8000";
}

/**
 * Resolves the active base URL at call time.
 * Priority: runtime override → EXPO_PUBLIC_API_URL env var → platform default.
 * Call this on every request (not at import time) to always pick up overrides.
 */
export function resolveBaseUrl(): string {
  return _overrideUrl ?? process.env.EXPO_PUBLIC_API_URL ?? getApiBaseUrl();
}

// Keep the static export for backwards compatibility (used in places that don't
// need per-request resolution, e.g. image URIs at render time).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getApiBaseUrl();

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
