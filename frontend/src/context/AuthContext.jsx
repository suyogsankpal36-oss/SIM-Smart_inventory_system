import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import api from "../services/api";
import { isJwtExpired } from "../utils/token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cachedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    // If both tokens are expired or missing, discard cached user
    if ((!token && !refreshToken) || (isJwtExpired(token) && isJwtExpired(refreshToken))) {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return null;
    }

    try {
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Hydrate user profile on initial load if valid tokens exist
  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      let token = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");

      // Case 1: No tokens at all (logged out state)
      if (!token && !refreshToken) {
        if (isMounted) setLoading(false);
        return;
      }

      // Case 2: Both access token and refresh token are expired
      if (isJwtExpired(token) && (!refreshToken || isJwtExpired(refreshToken))) {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Case 3: Access token expired, but refresh token is still valid -> proactively refresh
      if (isJwtExpired(token) && refreshToken && !isJwtExpired(refreshToken)) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          token = res.data.access;
          localStorage.setItem("access_token", token);
          if (res.data.refresh) {
            localStorage.setItem("refresh_token", res.data.refresh);
          }
        } catch (refreshErr) {
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
      }

      // Case 4: Token is valid, fetch current user profile
      try {
        const response = await api.get("/auth/me/");
        if (isMounted) {
          setUser(response.data);
          localStorage.setItem("user", JSON.stringify(response.data));
        }
      } catch (error) {
        if (isMounted && error.response?.status === 401) {
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateUser();

    // Listen for automatic logout events triggered by interceptor failure
    const handleAutoLogout = () => {
      if (isMounted) {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    };

    window.addEventListener("auth:logout", handleAutoLogout);
    return () => {
      isMounted = false;
      window.removeEventListener("auth:logout", handleAutoLogout);
    };
  }, []);

  const login = async (identifier, password) => {
    const response = await api.post("/auth/login/", {
      username: identifier,
      password: password,
    });

    const { access, refresh, user: userData } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const loginWithGoogle = async (googlePayload) => {
    const response = await api.post("/auth/google/", googlePayload);
    const { access, refresh, user: userData } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const loginAsGuest = async () => {
    const response = await api.post("/auth/guest-demo/");
    const { access, refresh, user: userData } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register/", userData);
    const { access, refresh, user: newUser } = response.data;

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await api.post("/auth/logout/", { refresh: refreshToken });
      }
    } catch (e) {
      // Proceed with local logout even if network request fails
      console.warn("Logout request error:", e);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const role = user?.role?.toLowerCase() || "";
  const isAdmin = role === "admin" || !!user?.is_admin;
  const isManager = isAdmin || role === "manager" || !!user?.is_manager;
  const isEmployee = !!user;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role,
    isAdmin,
    isManager,
    isEmployee,
    login,
    loginWithGoogle,
    loginAsGuest,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
