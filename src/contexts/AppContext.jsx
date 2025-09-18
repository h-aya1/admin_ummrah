import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      setUser({ id: "1", name: "Admin", role: "Administrator", email: "admin@demo.com" });
    }
  }, []);

  const login = async ({ email, password }) => {
    setLoading(true);
    setError("");
    try {
      // Mock auth
      await new Promise((r) => setTimeout(r, 600));
      if (email === "admin@demo.com" && password === "admin123") {
        localStorage.setItem("token", "demo-token");
        setIsAuthenticated(true);
        setUser({ id: "1", name: "Admin", role: "Administrator", email });
        return { success: true };
      }
      throw new Error("Invalid credentials");
    } catch (e) {
      setError(e.message || "Login failed");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = useMemo(() => ({
    // auth
    loading,
    isAuthenticated,
    user,
    error,
    login,
    logout,
    // ui prefs
    theme,
    setTheme,
    language,
    setLanguage,
    // data
    notifications,
    setNotifications,
    users,
    setUsers,
    groups,
    setGroups,
    dashboardStats,
    setDashboardStats,
  }), [loading, isAuthenticated, user, error, theme, language, notifications, users, groups, dashboardStats]);

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}


