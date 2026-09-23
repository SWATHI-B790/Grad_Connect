import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
  Shield,
  Crown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export const AdminHeader = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const fetchPendingNotifs = async () => {
    try {
      const res = await API.get("/admin/notifications");
      if (res.data?.pendingCount !== undefined) {
        setPendingCount(res.data.pendingCount);
      }
    } catch (e) {
      // Silently catch
    }
  };

  useEffect(() => {
    fetchPendingNotifs();

    const handleUpdate = () => {
      fetchPendingNotifs();
    };

    window.addEventListener("admin-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("admin-data-updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isSuperadmin = user?.role === "superadmin";
  const displayRole = user?.adminLabel || (isSuperadmin ? "Super Admin" : "Admin");

  return (
    <header className="admin-header-bar">
      {/* Left section: Mobile Toggle + Admin Indicator + Public Site Link */}
      <div className="admin-header-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="admin-sidebar-toggle-btn"
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          title="Toggle Navigation Menu"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="admin-center-badge">
          <span className="live-indicator-dot" />
          <span className="admin-center-title">GradConnect Admin Center</span>
        </div>

        <Link
          to="/"
          className="view-site-link"
          title="Switch to public GradConnect website"
        >
          <span>View Public Site</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Right section: Theme Toggle + Bell Alert + Admin Profile + Logout */}
      <div className="admin-header-right">
        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="admin-theme-btn"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Pending Registrations Bell Alert */}
        <Link
          to="/admin/registrations"
          className="admin-notif-bell"
          title={
            pendingCount > 0
              ? `${pendingCount} pending registration(s) require review`
              : "No pending registrations"
          }
          aria-label="Registration review queue"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="admin-notif-badge">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </Link>

        {/* Admin Profile Pill */}
        <Link
          to="/admin/settings"
          className="admin-user-pill"
          title="Open Admin Settings"
        >
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || "Admin"
              )}&background=dc2626&color=fff&bold=true`
            }
            alt={user?.name || "Admin"}
            className="admin-avatar-img"
          />
          <div className="admin-user-text">
            <span className="admin-name">{user?.name}</span>
            <span className="admin-role-tag">
              {isSuperadmin ? (
                <Crown size={11} className="role-icon-inline" />
              ) : (
                <Shield size={11} className="role-icon-inline" />
              )}
              {displayRole}
            </span>
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="admin-logout-btn"
          title="Sign out of Admin Session"
        >
          <LogOut size={15} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
