import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await API.get("/auth/profile");
        setUser(response.data);
      } catch (error) {
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Register User
  const register = async (name, email, password, extraData = {}) => {
    const payload = typeof name === "object" ? name : { name, email, password, ...extraData };
    const response = await API.post("/auth/register", payload);
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  };

  // Normal User Login
  const login = async (email, password, role) => {
    const payload = role ? { email, password, role } : { email, password };
    const response = await API.post("/auth/login", payload);
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    setUser(response.data);
    return response.data;
  };

  // Dedicated Student Login
  const studentLogin = async (email, password) => {
    const response = await API.post("/auth/student-login", { email, password });
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    setUser(response.data);
    return response.data;
  };

  // Dedicated Alumni Login
  const alumniLogin = async (email, password) => {
    const response = await API.post("/auth/alumni-login", { email, password });
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    setUser(response.data);
    return response.data;
  };

  // Dedicated Isolated Admin Login
  const adminLogin = async (email, password) => {
    const response = await API.post("/auth/admin-login", { email, password });
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    setUser(response.data);
    return response.data;
  };

  // Logout User / Admin
  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const roleLower = (user?.role || "").toLowerCase();
  const isStudent = user?.primaryRole === "STUDENT" || roleLower === "student";
  const isAlumni = user?.primaryRole === "ALUMNI" || roleLower === "alumni";
  const isAdmin = user?.primaryRole === "ADMIN" || ["admin", "subadmin", "superadmin", "admin1", "admin2"].includes(roleLower);
  const isSuperAdmin = user?.adminRole === "SUPER_ADMIN" || roleLower === "superadmin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        studentLogin,
        alumniLogin,
        adminLogin,
        logout,
        setUser,
        isStudent,
        isAlumni,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
