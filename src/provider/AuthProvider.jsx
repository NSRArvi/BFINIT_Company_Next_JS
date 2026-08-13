"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on first load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const storedRoles = localStorage.getItem("roles");

      if (storedToken && storedUser && storedRoles) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRoles(JSON.parse(storedRoles));
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("roles");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAuth = useCallback((responseData) => {
    const { token, data } = responseData;
    const { user, roles } = data;

    setToken(token);
    setUser(user);
    setRoles(roles);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("roles", JSON.stringify(roles));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("roles");

    setToken(null);
    setUser(null);
    setRoles(null);
  }, []);

  const isAuthenticated = Boolean(token && user?.id && roles?.length);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    saveAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
