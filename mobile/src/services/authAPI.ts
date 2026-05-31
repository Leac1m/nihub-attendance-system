import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS, resolveBaseUrl } from "@/config/api";

import {
  apiRequest,
  setStoredToken,
  clearStoredToken,
  getStoredToken,
  ApiResponse,
} from "./apiClient";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterStaffResponse {
  message: string;
  username: string;
  email: string;
  verification_expires_at: string;
}

export interface RegisterStaffPayload {
  email: string;
  username: string;
  password: string;
}

export interface VerifyStaffPayload {
  username: string;
  pin: string;
}

export interface CourseResponse {
  courses: Course[];
}

export interface Course {
  code: string;
  name: string;
  description: string;
  duration: string;
  [key: string]: any;
}

export interface RegistrantsResponse {
  code: string;
  registrants: Registrant[];
}

export interface Registrant {
  id: string;
  name: string;
  email: string;
  phone: string;
  matriculation_number: string;
  [key: string]: any;
}

export interface RegistrantResponse {
  code: string;
  registrant: Registrant;
}

export interface ScanCourseContext {
  course: Course;
  attendee: Registrant;
}

export interface ScanContextResponse {
  course: Course;
  attendee: Registrant;
}

/**
 * Authenticate user with credentials.
 * Note: Server expects OAuth2PasswordRequestForm with username and password.
 * We send x-www-form-urlencoded because FastAPI's OAuth2PasswordRequestForm
 * expects form-encoded data, not JSON.
 */
export async function login(
  username: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  const formBody = new URLSearchParams();
  formBody.append("username", username);
  formBody.append("password", password);

  const result = await apiRequest<LoginResponse>(API_ENDPOINTS.LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  // On successful login, store the token
  if (result.success && result.data?.access_token) {
    await setStoredToken(result.data.access_token);
  } else if (!result.success) {
    // Clear any existing token on login failure
    await clearStoredToken();
  }

  return result;
}

/**
 * Register a new staff account.
 */
export async function registerStaff(
  payload: RegisterStaffPayload
): Promise<ApiResponse<RegisterStaffResponse>> {
  return apiRequest<RegisterStaffResponse>(API_ENDPOINTS.REGISTER_STAFF, {
    method: "POST",
    requiresAuth: false,
    body: payload,
  });
}

/**
 * Verify a staff account using username + PIN and store the returned token.
 */
export async function verifyStaffAccount(
  payload: VerifyStaffPayload
): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse>(
    API_ENDPOINTS.VERIFY_STAFF_ACCOUNT,
    {
      method: "POST",
      requiresAuth: false,
      body: payload,
    }
  );

  if (result.success && result.data?.access_token) {
    await setStoredToken(result.data.access_token);
  }

  return result;
}

/**
 * Logout by clearing the stored token
 */
export async function logout(): Promise<void> {
  await clearStoredToken();
}

/**
 * Check if user has a valid token
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getStoredToken();
  return !!token;
}

/**
 * Get list of all courses
 */
export async function getCourses(): Promise<ApiResponse<CourseResponse>> {
  return apiRequest<CourseResponse>(API_ENDPOINTS.GET_COURSES, {
    method: "GET",
    requiresAuth: false,
  });
}

/**
 * Create a new course / event. Requires staff authentication.
 */
export interface CreateCoursePayload {
  code: string;
  name: string;
  description: string;
  duration: string;
}

export async function createCourse(
  payload: CreateCoursePayload
): Promise<ApiResponse<{ message: string; course: Course }>> {
  return apiRequest<{ message: string; course: Course }>(
    API_ENDPOINTS.CREATE_COURSE,
    {
      method: "POST",
      requiresAuth: true,
      body: payload,
    }
  );
}

/**
 * Get registrants for a specific course
 */
export async function getRegistrants(
  courseCode: string
): Promise<ApiResponse<RegistrantsResponse>> {
  return apiRequest<RegistrantsResponse>(
    API_ENDPOINTS.GET_REGISTRANTS(courseCode),
    {
      method: "GET",
      requiresAuth: true,
    }
  );
}

/**
 * Get a specific registrant for a course by attendee ID or matriculation number
 */
export async function getRegistrant(
  courseCode: string,
  registrantId: string
): Promise<ApiResponse<RegistrantResponse>> {
  return apiRequest<RegistrantResponse>(
    API_ENDPOINTS.GET_REGISTRANT(courseCode, registrantId),
    {
      method: "GET",
      requiresAuth: true,
    }
  );
}

/**
 * Get the course and the attendee to use for scanner demo flow.
 */
export async function getScanContext(
  courseCode: string
): Promise<ApiResponse<ScanContextResponse>> {
  return apiRequest<ScanContextResponse>(API_ENDPOINTS.GET_SCAN_CONTEXT(courseCode), {
    method: "GET",
    requiresAuth: false,
  });
}

/**
 * Register a new registrant for a course
 */
export async function registerForCourse(
  courseCode: string,
  registrant: {
    name: string;
    email: string;
    phone: string;
    matriculation_number: string;
  }
): Promise<
  ApiResponse<{
    message: string;
    registrant: Registrant;
  }>
> {
  return apiRequest(
    API_ENDPOINTS.REGISTER_COURSE(courseCode),
    {
      method: "POST",
      requiresAuth: false,
      body: registrant,
    }
  );
}

/**
 * Mark attendance for a student in a course
 */
export async function markAttendance(
  courseCode: string,
  matricNumber: string,
  date: string,
  present: boolean = true
): Promise<
  ApiResponse<{
    message: string;
    attendance: any;
  }>
> {
  return apiRequest(
    API_ENDPOINTS.MARK_ATTENDANCE(courseCode, matricNumber),
    {
      method: "POST",
      requiresAuth: true,
      body: {
        date,
        present,
      },
    }
  );
}

/**
 * Download the attendance spreadsheet for a given course as an XLSX file.
 *
 * Web:    triggers a browser <a download> save.
 * Native: uses expo-file-system/legacy `FileSystem.downloadAsync` (which
 *         supports auth headers) then hands the file to `expo-sharing` so
 *         the OS shows its "Open with / Share" sheet — the user can open
 *         it in any installed spreadsheet app.
 */
export async function downloadCourseAttendanceSpreadsheet(
  courseCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { success: false, error: "No authentication token found" };
    }

    const url = `${resolveBaseUrl()}${API_ENDPOINTS.DOWNLOAD_ATTENDANCE_SPREADSHEET(courseCode)}`;
    const filename = `${courseCode}_attendance.xlsx`;
    const XLSX_MIME =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const isWeb =
      typeof globalThis !== "undefined" &&
      (globalThis as any)?.URL?.createObjectURL &&
      typeof (globalThis as any).document !== "undefined";

    // ── Web: fetch normally and trigger a browser download ───────────────────
    if (isWeb) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: XLSX_MIME },
      });

      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          if (body?.detail) message = body.detail;
        } catch { /* keep status message */ }
        return { success: false, error: message };
      }

      const blob = await response.blob();
      const href = (globalThis as any).URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      (globalThis as any).URL.revokeObjectURL(href);
      return { success: true };
    }

    // ── Native (Android / iOS) ────────────────────────────────────────────────
    // expo-file-system/legacy provides cacheDirectory as a plain string and
    // downloadAsync supports custom request headers.
    const FileSystem = await import("expo-file-system/legacy");

    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      return { success: false, error: "Cache directory is unavailable on this device." };
    }

    const fileUri = cacheDir + filename;

    // Remove stale copy so a fresh download always wins.
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }

    const result = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: XLSX_MIME,
      },
    });

    // downloadAsync returns the local URI on success.
    if (!result?.uri) {
      return { success: false, error: "Download failed — no file URI returned." };
    }

    if (result.status !== 200) {
      // The API returned an error (e.g., 401, 404), so the downloaded file is actually an error message (JSON/Text).
      const errorText = await FileSystem.readAsStringAsync(result.uri);
      let errorMessage = `HTTP ${result.status}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.detail) errorMessage = parsed.detail;
      } catch (e) {
        // If not JSON, use the raw text or fallback to status
      }
      return { success: false, error: `Download failed: ${errorMessage}` };
    }

    // ── Native (Android Only) ────────────────────────────────────────────────
    const SAF = FileSystem.StorageAccessFramework;
    let directoryUri = await AsyncStorage.getItem("download_directory_uri");

    if (!directoryUri) {
      // Request permission starting from the Downloads folder
      const downloadDir = SAF.getUriForDirectoryInRoot("Download");
      const permissions = await SAF.requestDirectoryPermissionsAsync(downloadDir);

      if (permissions.granted) {
        directoryUri = permissions.directoryUri;
        await AsyncStorage.setItem("download_directory_uri", directoryUri);
      } else {
        return { success: false, error: "Directory permission denied." };
      }
    }

    try {
      const safUri = await SAF.createFileAsync(directoryUri, filename, XLSX_MIME);
      
      // Read the downloaded file from cache as Base64 and write it via SAF
      const base64Data = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      await FileSystem.writeAsStringAsync(safUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Launch the default system app to view it
      const IntentLauncher = await import("expo-intent-launcher");
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: safUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: XLSX_MIME,
      });
      
      return { success: true };
    } catch (e) {
      // If saving fails, the permission might have been revoked or folder deleted.
      // Clear the saved URI so we can prompt again next time.
      await AsyncStorage.removeItem("download_directory_uri");
      return { success: false, error: "Failed to save the file to Downloads. Please try again." };
    }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}




/**
 * Delete a course (event) by course code. Requires staff authentication.
 * This will also cascade-delete all registrants and attendance records.
 */
export async function deleteCourse(
  courseCode: string
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(
    API_ENDPOINTS.DELETE_COURSE(courseCode),
    {
      method: "DELETE",
      requiresAuth: true,
    }
  );
}
