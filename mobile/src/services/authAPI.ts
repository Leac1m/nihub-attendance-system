import { API_ENDPOINTS } from "@/config/api";
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
  name: string;
  email: string;
  phone: string;
  matriculation_number: string;
  [key: string]: any;
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
