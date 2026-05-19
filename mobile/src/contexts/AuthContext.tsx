import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import * as authAPI from "@/services/authAPI";
import { getStoredToken } from "@/services/apiClient";

type AuthContextType = {
  isAuthenticated: boolean;
  user: { email: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isRestoring: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  /**
   * Restore authentication state from stored token on app startup
   */
  const restoreToken = useCallback(async () => {
    setIsRestoring(true);
    try {
      const token = await getStoredToken();
      if (token) {
        // Token exists, consider user authenticated
        // In a real app, you might validate the token with the server
        setIsAuthenticated(true);
        // Extract email from token or fetch from server
        // For now, we'll use a placeholder
        setUser({ email: "authenticated@app.local" });
      }
    } catch (error) {
      console.error("Failed to restore token:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsRestoring(false);
    }
  }, []);

  /**
   * Attempt to sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Use email as username for now (server expects username field)
      const result = await authAPI.login(email, password);

      if (!result.success) {
        throw new Error(result.error || "Sign in failed");
      }

      setUser({ email });
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign out and clear authentication state
   */
  const signOut = useCallback(async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Sign out error:", error);
      // Still clear local state even if logout fails
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Restore token on mount
  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        signIn,
        signOut,
        isLoading,
        isRestoring,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
