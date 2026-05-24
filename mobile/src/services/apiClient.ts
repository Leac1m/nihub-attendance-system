import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/api";


const TOKEN_KEY = "auth_token";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

/**
 * Get stored auth token from AsyncStorage
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to retrieve token from AsyncStorage:", error);
    return null;
  }
}

/**
 * Store auth token in AsyncStorage
 */
export async function setStoredToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to store token in AsyncStorage:", error);
    throw error;
  }
}

/**
 * Clear stored auth token from AsyncStorage
 */
export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to clear token from AsyncStorage:", error);
  }
}

/**
 * Generic API request function with automatic auth token injection
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    headers = {},
    body = null,
    requiresAuth = false,
  } = options;

  try {
    // Build request headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Inject auth token if required
    if (requiresAuth) {
      const token = await getStoredToken();
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
          statusCode: 401,
        };
      }
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    // Build full URL
    const url = `${API_BASE_URL}${endpoint}`;

    // Prepare request options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for POST/PUT/PATCH requests
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      if (body instanceof FormData) {
        fetchOptions.body = body;
        delete requestHeaders["Content-Type"];
      } else if (body instanceof URLSearchParams) {
        fetchOptions.body = body.toString();
      } else if (typeof body === "string") {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }

    // Execute request
    const response = await fetch(url, fetchOptions);

    // Parse response
    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle response status
    if (!response.ok) {
      return {
        success: false,
        error:
          data?.detail ||
          data?.error ||
          `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        data,
      };
    }

    return {
      success: true,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown network error";
    console.error(`API request failed for ${endpoint}:`, error);
    return {
      success: false,
      error: errorMessage,
      statusCode: 0,
    };
  }
}
