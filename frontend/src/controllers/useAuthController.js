/**
 * useAuthController.js
 * Controller orchestrating user authentication lifecycle, Google OAuth,
 * instant guest demo access, session persistence, and error handling.
 */
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthUserModel } from "../models/AuthModel";

export function useAuthController() {
  const authContext = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError(null);
      try {
        const user = await authContext.login(credentials);
        return new AuthUserModel(user);
      } catch (err) {
        const detail = err.response?.data?.detail || "Invalid credentials. Please try again.";
        setError(detail);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authContext]
  );

  const loginWithGoogle = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const user = await authContext.loginWithGoogle(payload);
        return new AuthUserModel(user);
      } catch (err) {
        const detail = err.response?.data?.detail || "Google authentication failed.";
        setError(detail);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authContext]
  );

  const loginAsGuestDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authContext.loginAsGuestDemo();
      return new AuthUserModel(user);
    } catch (err) {
      const detail = err.response?.data?.detail || "Unable to initiate guest demo.";
      setError(detail);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authContext]);

  const logout = useCallback(() => {
    authContext.logout();
  }, [authContext]);

  return {
    user: authContext.user ? new AuthUserModel(authContext.user) : null,
    isAuthenticated: authContext.isAuthenticated,
    loading: loading || authContext.loading,
    error,
    login,
    loginWithGoogle,
    loginAsGuestDemo,
    logout,
  };
}
