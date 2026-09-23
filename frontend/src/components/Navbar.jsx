import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  LogIn,
  User,
  Bell,
  CheckCheck,
  ChevronRight,
  ChevronDown,
  Calendar,
  Plus,
  BookOpen,
  PenTool,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { getImageUrl } from "../utils/getImageUrl";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // User Dropdown State
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  // Notification Bell State (Role: regular user only)
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifDropdownRef = useRef(null);

  // Scroll detection for fixed header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Theme management
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Close menus on route navigation
  useEffect(() => {
    setMobileOpen(false);
    setShowNotifDropdown(false);
    setShowUserDropdown(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Role detection
  const ADMIN_ROLES = ["subadmin", "superadmin", "admin", "admin1", "admin2", "ADMIN", "SUPER_ADMIN", "SUB_ADMIN"];
  const isAdminUser = Boolean(
    user && (
      ADMIN_ROLES.includes(user.role) ||
      ADMIN_ROLES.includes(user.primaryRole) ||
      ["admin", "superadmin", "subadmin"].includes(user.role?.toLowerCase()) ||
      user.role?.toLowerCase()?.includes("admin") ||
      user.adminRole
    )
  );
  const isRegularUser = Boolean(user && !isAdminUser);

  // Format display role
  const getUserRoleLabel = () => {
    if (!user) return "";
    if (isAdminUser) {
      if (user.role === "superadmin" || user.adminRole === "SUPER_ADMIN") return "Super Admin";
      return "Admin";
    }
    const roleLower = (user.role || "").toLowerCase();
    const typeLower = (user.userType || "").toLowerCase();
    if (typeLower.includes("student") || roleLower.includes("student")) return "Student";
    if (typeLower.includes("alumni") || roleLower.includes("alumni")) return "Alumni";
    return "Member";
  };

  const fetchUnreadCount = async () => {
    if (!isRegularUser) return;
    try {
      const response = await API.get("/notifications/unread-count");
      setUnreadCount(response.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread notification count:", err);
    }
  };

  useEffect(() => {
    if (isRegularUser) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 45000);
      return () => clearInterval(interval);
    }
  }, [user, isRegularUser]);

  const fetchRecentNotifications = async () => {
    if (!isRegularUser) return;
    setNotifLoading(true);
    try {
      const response = await API.get("/notifications?limit=6");
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleToggleNotifDropdown = () => {
    if (!showNotifDropdown) {
      fetchRecentNotifications();
    }
    setShowNotifDropdown(!showNotifDropdown);
    setShowUserDropdown(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch("/notifications/mark-all-read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await API.patch(`/notifications/${notif._id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      }
      setShowNotifDropdown(false);
      navigate("/people");
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    const wasAdmin = isAdminUser;
    await logout();
    if (wasAdmin) {
      navigate("/admin/login");
    } else {
      navigate("/login");
    }
  };

  // When on Admin Panel routes, the unified AdminHeader is used
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  const isHomePage = location.pathname === "/";

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const diffSec = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <header
      className={`site-navbar ${
        scrolled || !isHomePage ? "navbar-scrolled" : "navbar-transparent"
      }`}
    >
      <div className="navbar-container">
        {/* ============================================================
            SECTION 1: LEFT - BRAND LOGO & MOTTO
            ============================================================ */}
        <Link to="/" className="navbar-brand">
          <div className="logo-icon-wrapper">
            <GraduationCap size={24} className="logo-shield" />
          </div>
          <div className="logo-text-group">
            <span className="brand-title">GradConnect</span>
            <span className="brand-tagline">Connect. Discover. Grow.</span>
          </div>
        </Link>

        {/* ============================================================
            SECTION 2: CENTER - EXACTLY 6 PUBLIC LINKS
            ============================================================ */}
        <nav className="desktop-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
            Home
          </NavLink>
          <NavLink to="/people" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Discover Alumni
          </NavLink>
          <NavLink to="/domains" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Domains
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Jobs
          </NavLink>
          <NavLink to="/blogs" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Blogs
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Events
          </NavLink>
        </nav>

        {/* ============================================================
            SECTION 3: RIGHT - THEME TOGGLE, NOTIFICATIONS & USER CAPSULE
            ============================================================ */}
        <div className="navbar-actions">
          {/* Dark Mode Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle-btn"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={18} className="sun-icon" /> : <Moon size={18} className="moon-icon" />}
          </button>

          {/* Notifications Bell (Regular Logged-in Users ONLY) */}
          {isRegularUser && (
            <div className="notif-bell-container" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={handleToggleNotifDropdown}
                className={`notif-bell-btn ${showNotifDropdown ? "active" : ""}`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="notif-badge-count">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="notif-dropdown-menu"
                  >
                    <div className="notif-dropdown-header flex-between">
                      <div className="flex-items-center gap-2">
                        <span className="notif-title">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="notif-header-pill">{unreadCount} new</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="mark-all-read-btn"
                          title="Mark all as read"
                        >
                          <CheckCheck size={14} />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="notif-dropdown-body">
                      {notifLoading ? (
                        <div className="notif-empty-state">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="notif-empty-state">No notifications yet.</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotifClick(notif)}
                            className={`notif-item ${!notif.isRead ? "unread-item" : ""}`}
                          >
                            <div className="notif-avatar-circle">
                              {notif.sender?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="notif-item-content">
                              <p className="notif-message">{notif.message}</p>
                              <span className="notif-time">
                                {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>
                            {!notif.isRead && <span className="unread-dot-indicator" />}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="notif-dropdown-footer">
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifDropdown(false)}
                        className="view-all-notifs-link"
                      >
                        <span>View All Notifications</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Profile / Admin Capsule or Auth Buttons */}
          {user ? (
            <div className="user-menu-wrapper" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifDropdown(false);
                }}
                className={`user-capsule-btn ${isAdminUser ? "admin-capsule-btn" : ""} ${showUserDropdown ? "active" : ""}`}
                aria-label="User Account Menu"
              >
                <div className={`user-capsule-avatar ${isAdminUser ? "admin-capsule-avatar" : ""}`}>
                  {user.avatar ? (
                    <img src={getImageUrl(user.avatar)} alt={user.name} className="capsule-img" />
                  ) : (
                    <span>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                  )}
                </div>
                <div className="user-capsule-text">
                  <span className="user-capsule-name">{user.name?.split(" ")[0] || "User"}</span>
                  <span className={`user-capsule-badge ${isAdminUser ? "badge-admin" : "badge-member"}`}>
                    {isAdminUser ? "Admin" : getUserRoleLabel()}
                  </span>
                </div>
                <ChevronDown size={14} className={`user-capsule-caret ${showUserDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="user-dropdown-card"
                  >
                    {/* User Info Header */}
                    <div className="user-dropdown-header">
                      <div className={`dropdown-meta-avatar ${isAdminUser ? "admin-avatar-bg" : ""}`}>
                        {user.avatar ? (
                          <img src={getImageUrl(user.avatar)} alt={user.name} className="dropdown-meta-img" />
                        ) : (
                          <span>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                        )}
                      </div>
                      <div className="user-dropdown-details">
                        <div className="dropdown-user-name">{user.name}</div>
                        <div className="dropdown-user-email">{user.email}</div>
                        <div className="dropdown-badge-row">
                          <span className={`dropdown-role-tag ${isAdminUser ? "tag-admin" : "tag-member"}`}>
                            {isAdminUser ? (user.adminLabel || "Administrator") : getUserRoleLabel()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="dropdown-section-divider" />

                    {/* Links based on user role */}
                    <div className="user-dropdown-menu-list">
                      {isAdminUser ? (
                        // Admin Experience on Public Pages
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setShowUserDropdown(false)}
                          className="user-dropdown-item admin-link-item"
                        >
                          <LayoutDashboard size={16} />
                          <span>Back to Admin Center</span>
                        </Link>
                      ) : (
                        // Student & Alumni Member Experience
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserDropdown(false)}
                            className="user-dropdown-item"
                          >
                            <User size={16} />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/my-events"
                            onClick={() => setShowUserDropdown(false)}
                            className="user-dropdown-item"
                          >
                            <Calendar size={16} />
                            <span>My Events</span>
                          </Link>
                          <Link
                            to="/notifications"
                            onClick={() => setShowUserDropdown(false)}
                            className="user-dropdown-item"
                          >
                            <Bell size={16} />
                            <span>Notifications</span>
                            {unreadCount > 0 && <span className="dropdown-count-pill">{unreadCount}</span>}
                          </Link>
                          {(user.userType === "Alumni" || user.role === "alumni") && (
                            <>
                              <Link
                                to="/my-blogs"
                                onClick={() => setShowUserDropdown(false)}
                                className="user-dropdown-item"
                              >
                                <BookOpen size={16} />
                                <span>My Experiences</span>
                              </Link>
                              <Link
                                to="/blogs/create"
                                onClick={() => setShowUserDropdown(false)}
                                className="user-dropdown-item"
                              >
                                <PenTool size={16} />
                                <span>Share Experience</span>
                              </Link>
                              <Link
                                to="/events/create"
                                onClick={() => setShowUserDropdown(false)}
                                className="user-dropdown-item"
                              >
                                <Plus size={16} />
                                <span>Host an Event</span>
                              </Link>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div className="dropdown-section-divider" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="user-dropdown-item logout-link-item"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-btn-group">
              <Link to="/login" className="btn-nav-login">
                <LogIn size={15} />
                <span>Log In</span>
              </Link>
              <Link to="/register" className="btn-nav-register">
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-hamburger-btn"
            aria-label="Toggle Mobile Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="mobile-menu-drawer">
          <NavLink to="/" className="mobile-nav-link" end>
            Home
          </NavLink>
          <NavLink to="/people" className="mobile-nav-link">
            Discover Alumni
          </NavLink>
          <NavLink to="/domains" className="mobile-nav-link">
            Domains
          </NavLink>
          <NavLink to="/jobs" className="mobile-nav-link">
            Jobs
          </NavLink>
          <NavLink to="/blogs" className="mobile-nav-link">
            Blogs
          </NavLink>
          <NavLink to="/events" className="mobile-nav-link">
            Events
          </NavLink>

          <div className="mobile-drawer-divider" />

          {/* Member Links vs Admin Links */}
          {user ? (
            isAdminUser ? (
              <>
                <NavLink to="/admin/dashboard" className="mobile-nav-link mobile-admin-link">
                  <LayoutDashboard size={18} />
                  <span>Back to Admin Center</span>
                </NavLink>
                <button onClick={handleLogout} className="mobile-nav-link mobile-logout-btn">
                  <LogOut size={18} />
                  <span>Log Out ({user.name})</span>
                </button>
              </>
            ) : (
              <>
                <NavLink to="/profile" className="mobile-nav-link">
                  <User size={18} />
                  <span>My Profile</span>
                </NavLink>
                <NavLink to="/my-events" className="mobile-nav-link">
                  <Calendar size={18} />
                  <span>My Events</span>
                </NavLink>
                <NavLink to="/notifications" className="mobile-nav-link">
                  <Bell size={18} />
                  <span>Notifications ({unreadCount})</span>
                </NavLink>
                <button onClick={handleLogout} className="mobile-nav-link mobile-logout-btn">
                  <LogOut size={18} />
                  <span>Log Out ({user.name})</span>
                </button>
              </>
            )
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="btn btn-primary w-full">
                Log In
              </Link>
              <Link to="/register" className="btn btn-secondary w-full">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
