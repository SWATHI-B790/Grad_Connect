import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Globe,
  Layers,
  Calendar,
  FileText,
  Activity,
  Settings,
  Crown,
  Shield,
  LogOut,
  GraduationCap,
  ChevronRight,
  Lock,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const [usageData, setUsageData] = useState({
    unlimited: user?.role === "superadmin" || user?.role === "admin",
    limit: 3,
    usage: {
      user_management: 0,
      blogs: 0,
      banners: 0,
      reports: 0,
      activity_logs: 0,
      settings: 0,
    },
  });

  const fetchSidebarData = async () => {
    try {
      const [usageRes, notifRes] = await Promise.allSettled([
        API.get("/admin/usage-status"),
        API.get("/admin/notifications"),
      ]);

      if (usageRes.status === "fulfilled") {
        setUsageData(usageRes.value.data);
      }
      if (notifRes.status === "fulfilled" && notifRes.value.data?.pendingCount !== undefined) {
        setPendingCount(notifRes.value.data.pendingCount);
      }
    } catch (error) {
      // Silently handle error
    }
  };

  useEffect(() => {
    fetchSidebarData();

    const handleDataUpdate = () => {
      fetchSidebarData();
    };

    window.addEventListener("admin-data-updated", handleDataUpdate);
    return () => {
      window.removeEventListener("admin-data-updated", handleDataUpdate);
    };
  }, [location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const menuItems = [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      featureKey: "dashboard",
    },
    {
      title: "Pending Registrations",
      path: "/admin/registrations",
      icon: UserCheck,
      featureKey: "user_management",
      badgeCount: pendingCount,
    },
    {
      title: "User Management",
      path: "/admin/users",
      icon: Users,
      featureKey: "user_management",
    },
    {
      title: "Blogs Management",
      path: "/admin/blogs",
      icon: BookOpen,
      featureKey: "blogs",
    },
    {
      title: "Domains & Roadmaps",
      path: "/admin/domains",
      icon: Layers,
      featureKey: "blogs",
    },
    {
      title: "Event Management",
      path: "/admin/events",
      icon: Calendar,
      featureKey: "events",
    },
    {
      title: "Job Management",
      path: "/admin/jobs",
      icon: Briefcase,
      featureKey: "jobs",
    },
    {
      title: "Activity Logs",
      path: "/admin/activity",
      icon: Activity,
      featureKey: "activity_logs",
    },
    {
      title: "Reports",
      path: "/admin/reports",
      icon: FileText,
      featureKey: "reports",
    },
    {
      title: "Settings",
      path: "/admin/settings",
      icon: Settings,
      featureKey: "settings",
    },
  ];

  const isSuperadmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isFullAdmin = isSuperadmin || isAdmin;
  const displayLabel = user?.adminLabel || (isSuperadmin ? "Super Admin" : "Administrator");

  // Determine if a menu section is permanently blocked for the current subadmin
  const isMenuPermanentlyBlocked = (featureKey) => {
    if (isFullAdmin) return false;
    if (featureKey === "dashboard" || featureKey === "events") return false;

    const allowedMenus = user?.allowedMenus || [];
    return !allowedMenus.includes(featureKey);
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const renderBadge = (item, permanentlyBlocked) => {
    // Show pending approval count pill if available
    if (item.badgeCount !== undefined && item.badgeCount > 0) {
      return (
        <span className="sidebar-count-badge" title={`${item.badgeCount} pending reviews`}>
          {item.badgeCount > 99 ? "99+" : item.badgeCount}
        </span>
      );
    }

    if (item.featureKey === "dashboard" || isFullAdmin) return null;

    if (permanentlyBlocked) {
      return (
        <span className="sidebar-status-badge badge-no-access" title="Locked: Permission Required">
          <Lock size={10} style={{ marginRight: "3px" }} />
          Locked
        </span>
      );
    }

    const limit = usageData.limit || 3;
    const currentUsage = usageData.usage?.[item.featureKey] || 0;
    const remaining = limit - currentUsage;

    if (currentUsage >= limit) {
      return <span className="sidebar-status-badge badge-locked">Locked</span>;
    }

    if (remaining === 1) {
      return <span className="sidebar-status-badge badge-warning">1 left</span>;
    }

    return null;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? "sidebar-mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <GraduationCap size={24} />
          </div>
          <div className="brand-text-block">
            <span className="brand-app-name">GradConnect</span>
            <span className="brand-badge-pill">ADMIN PANEL</span>
          </div>
        </div>

        {/* Identity & Role Block */}
        <div className="sidebar-identity-card">
          <div className="identity-avatar-wrap">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || "Admin"
                )}&background=dc2626&color=fff&bold=true`
              }
              alt={user?.name || "Admin"}
              className="identity-avatar"
            />
            <span className="identity-status-dot" />
          </div>

          <div className="identity-info">
            <span className="identity-name" title={user?.name}>
              {user?.name}
            </span>
            <span
              className={`identity-role-pill ${
                isSuperadmin ? "role-superadmin" : "role-subadmin"
              }`}
            >
              {isSuperadmin ? <Crown size={11} /> : <Shield size={11} />}
              <span>{displayLabel}</span>
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-navigation">
          <span className="sidebar-nav-section-title">Operations & Management</span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const permanentlyBlocked = isMenuPermanentlyBlocked(item.featureKey);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? "nav-item-active" : ""} ${
                    permanentlyBlocked ? "nav-item-blocked" : ""
                  }`
                }
              >
                <div className="nav-item-left">
                  <div className="nav-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <span className="nav-item-label">{item.title}</span>
                </div>
                <div className="nav-item-right">
                  {renderBadge(item, permanentlyBlocked)}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with Quick Logout */}
        <div className="sidebar-footer">
          <button
            onClick={handleSignOut}
            className="sidebar-logout-btn"
            title="Log Out of Admin System"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
