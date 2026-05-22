import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";
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
 * Fetches the binary blob, saves it to the app's document directory,
 * then opens the native share sheet so the user can open / share the file.
 */
export async function downloadCourseAttendanceSpreadsheet(
  courseCode: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getStoredToken();
    if (!token) {
      return { success: false, error: "No authentication token found" };
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_ATTENDANCE_SPREADSHEET(courseCode)}`;
    const filename = `${courseCode}_attendance.xlsx`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        if (body?.detail) message = body.detail;
      } catch {
        /* response body was not JSON — keep status message */
      }
      return { success: false, error: message };
    }

    const blob = await response.blob();

    // ── Web / Expo Web: use <a download> so the browser saves the file ──────
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as any)?.URL?.createObjectURL &&
      typeof (globalThis as any).document !== "undefined"
    ) {
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

    // ── Expo Go / native: blob → base64 | save | share ──────────────────────
    const Sharing = await import("expo-sharing");
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      return { success: false, error: "Sharing is not available on this device" };
    }

    const FileSystem = await import("expo-file-system/legacy");
    const docDir =
      typeof FileSystem.documentDirectory === "string"
        ? FileSystem.documentDirectory
        : "";

    const fileUri = `${docDir}${filename}`;

    // Convert blob to base64 for FileSystem.writeAsStringAsync
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        resolve(btoa(binary));
      };
      reader.onerror = (e: any) => reject(e);
      reader.readAsArrayBuffer(blob);
    });

    await FileSystem.deleteAsync(fileUri).catch(() => {});
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(fileUri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: `Save ${filename}`,
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

