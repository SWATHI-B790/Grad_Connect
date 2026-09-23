import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  User,
  Users,
  UserPlus,
  Calendar,
  CalendarCheck,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Inbox,
  ArrowRight,
  Bookmark,
  Compass,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { getImageUrl } from "../utils/getImageUrl";

// Helper: Format timestamps professionally (relative + exact date)
const formatNotificationTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return `${mins}m ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h ago`;
  }
  if (diffSec < 172800) {
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Yesterday • ${timeStr}`;
  }
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return `${days}d ago`;
  }

  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} • ${timePart}`;
};

// Helper: Map notification type to icon, label, and semantic colors
const getTypeConfig = (type) => {
  switch (type) {
    case "new_follower":
    case "follow_request":
      return {
        label: "Follower",
        icon: UserPlus,
        colorClass: "notif-badge-blue",
      };
    case "event_registered":
    case "event_approved":
    case "event_submission":
      return {
        label: "Event",
        icon: Calendar,
        colorClass: "notif-badge-emerald",
      };
    case "event_cancelled":
    case "event_rejected":
    case "account_rejected":
    case "account_suspended":
      return {
        label: "Alert",
        icon: AlertCircle,
        colorClass: "notif-badge-rose",
      };
    case "account_approved":
    case "account_activated":
      return {
        label: "Account",
        icon: ShieldCheck,
        colorClass: "notif-badge-purple",
      };
    default:
      return {
        label: "Notice",
        icon: Bell,
        colorClass: "notif-badge-amber",
      };
  }
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'unread' | 'network' | 'events' | 'system'
  const [markingAll, setMarkingAll] = useState(false);
  const [avatarErrorMap, setAvatarErrorMap] = useState({});

  // Fetch paginated notifications
  const fetchNotifications = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get(`/notifications?page=${pageNum}&limit=15`);
      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.pages || 1);
      setTotalCount(response.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Unable to retrieve notifications right now. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count badge
  const fetchUnread = useCallback(async () => {
    try {
      const res = await API.get("/notifications/unread-count");
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
    fetchUnread();
  }, [page, fetchNotifications, fetchUnread]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 && !notifications.some((n) => !n.isRead)) return;
    setMarkingAll(true);
    try {
      await API.patch("/notifications/mark-all-read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "All notifications marked as read",
            type: "success",
          },
        })
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "Failed to mark all as read. Please try again.",
            type: "error",
          },
        })
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // Click single notification (optimistically mark as read and navigate)
  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await API.patch(`/notifications/${notif._id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Determine target link based on type
    if (notif.type === "new_follower" || notif.type === "follow_request") {
      if (notif.sender?._id) {
        navigate(`/profile/${notif.sender._id}`);
      } else {
        navigate("/people");
      }
    } else if (notif.type && notif.type.startsWith("event_")) {
      navigate("/events");
    } else if (notif.type && notif.type.startsWith("account_")) {
      navigate("/profile");
    } else if (notif.type && notif.type.startsWith("domain_")) {
      navigate("/domains");
    } else if (notif.type && notif.type.startsWith("blog_")) {
      navigate("/blogs");
    }
  };

  // Filtered notification list
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return notifications.filter((n) => !n.isRead);
      case "network":
        return notifications.filter(
          (n) => n.type === "new_follower" || n.type === "follow_request"
        );
      case "events":
        return notifications.filter((n) => n.type && n.type.startsWith("event_"));
      case "system":
        return notifications.filter(
          (n) =>
            n.type === "system" ||
            (n.type && n.type.startsWith("account_")) ||
            (n.type && n.type.startsWith("domain_"))
        );
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    const network = notifications.filter(
      (n) => n.type === "new_follower" || n.type === "follow_request"
    ).length;
    const events = notifications.filter((n) => n.type && n.type.startsWith("event_")).length;
    const system = notifications.filter(
      (n) =>
        n.type === "system" ||
        (n.type && n.type.startsWith("account_")) ||
        (n.type && n.type.startsWith("domain_"))
    ).length;

    return {
      all: totalCount || notifications.length,
      unread: unreadCount || unread,
      network,
      events,
      system,
    };
  }, [notifications, totalCount, unreadCount]);

  const handleAvatarError = (id) => {
    setAvatarErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="notif-center-wrapper">
      <Toast />

      <main className="notif-center-container" role="main">
        {/* Page Header */}
        <header className="notif-header-bar">
          <div className="notif-header-left">
            <div className="notif-title-row">
              <div className="notif-header-icon-box" aria-hidden="true">
                <Bell size={22} />
              </div>
              <h1 className="notif-page-heading">Notifications</h1>

              {unreadCount > 0 && (
                <span className="notif-unread-badge" aria-label={`${unreadCount} unread notifications`}>
                  <span className="notif-unread-badge-dot" />
                  <span>{unreadCount} unread</span>
                </span>
              )}
            </div>
            <p className="notif-page-subtext">
              Stay updated with your latest network connections, events, and campus activities.
            </p>
          </div>

          <div className="notif-header-actions">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="btn-mark-all-read"
              title={unreadCount === 0 ? "All notifications are already read" : "Mark all notifications as read"}
              aria-label="Mark all notifications as read"
            >
              <CheckCheck size={16} />
              <span>{markingAll ? "Marking..." : "Mark all as read"}</span>
            </button>
          </div>
        </header>

        {/* Content Layout: 2-Column Desktop (Feed + Sidebar) */}
        <div className="notif-main-grid">
          {/* Main Feed Column */}
          <section className="notif-feed-column" aria-label="Notification Feed">
            {/* Filter Pills */}
            <nav className="notif-filter-bar" aria-label="Notification Filters">
              <button
                type="button"
                className={`notif-filter-pill ${activeFilter === "all" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                <span>All</span>
                <span className="notif-filter-count">{counts.all}</span>
              </button>

              <button
                type="button"
                className={`notif-filter-pill ${activeFilter === "unread" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("unread")}
              >
                <span>Unread</span>
                <span className="notif-filter-count">{counts.unread}</span>
              </button>

              <button
                type="button"
                className={`notif-filter-pill ${activeFilter === "network" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("network")}
              >
                <span>Network</span>
                {counts.network > 0 && <span className="notif-filter-count">{counts.network}</span>}
              </button>

              <button
                type="button"
                className={`notif-filter-pill ${activeFilter === "events" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("events")}
              >
                <span>Events</span>
                {counts.events > 0 && <span className="notif-filter-count">{counts.events}</span>}
              </button>

              <button
                type="button"
                className={`notif-filter-pill ${activeFilter === "system" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("system")}
              >
                <span>System</span>
                {counts.system > 0 && <span className="notif-filter-count">{counts.system}</span>}
              </button>
            </nav>

            {/* Notification Feed Body */}
            {loading ? (
              <div className="notif-feed-container" aria-busy="true" aria-label="Loading notifications">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="notif-skeleton-row">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-text-group">
                      <div className="skeleton-line-title" />
                      <div className="skeleton-line-sub" />
                    </div>
                    <div className="skeleton-dot" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="notif-feed-container">
                <div className="notif-error-state-box">
                  <div className="notif-error-icon-circle">
                    <AlertCircle size={28} />
                  </div>
                  <h2 className="notif-error-title">Unable to load notifications</h2>
                  <p className="notif-error-desc">{error}</p>
                  <button
                    type="button"
                    onClick={() => fetchNotifications(page)}
                    className="btn-notif-retry"
                  >
                    <RefreshCw size={15} />
                    <span>Try again</span>
                  </button>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notif-feed-container">
                <div className="notif-empty-state-box">
                  <div className="notif-empty-icon-circle">
                    {activeFilter === "unread" ? <CheckCheck size={32} /> : <Inbox size={32} />}
                  </div>
                  <h2 className="notif-empty-title">
                    {activeFilter === "unread" ? "You're all caught up" : "No notifications yet"}
                  </h2>
                  <p className="notif-empty-desc">
                    {activeFilter === "unread"
                      ? "You have reviewed all your notifications. New interactions will appear here instantly."
                      : "When someone follows you, registers for your event, or shares an update, you'll see it here."}
                  </p>
                  <div className="flex-items-center gap-3">
                    <Link to="/people" className="btn btn-primary btn-sm flex-items-center gap-2">
                      <Users size={15} />
                      <span>Discover Alumni</span>
                    </Link>
                    <Link to="/events" className="btn btn-secondary btn-sm flex-items-center gap-2">
                      <Calendar size={15} />
                      <span>Browse Events</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="notif-feed-container" role="list">
                <AnimatePresence initial={false}>
                  {filteredNotifications.map((notif, idx) => {
                    const config = getTypeConfig(notif.type);
                    const TypeIcon = config.icon;
                    const senderName = notif.sender?.name || "GradConnect Member";
                    const initial = senderName.charAt(0).toUpperCase();
                    const hasAvatar = notif.sender?.avatar && !avatarErrorMap[notif._id];

                    return (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, delay: idx * 0.025 }}
                        onClick={() => handleItemClick(notif)}
                        className={`notif-item-row ${!notif.isRead ? "is-unread" : "is-read"}`}
                        role="listitem"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleItemClick(notif);
                          }
                        }}
                      >
                        {/* Column 1: Avatar & Type Badge */}
                        <div className="notif-avatar-wrapper">
                          {hasAvatar ? (
                            <img
                              src={getImageUrl(notif.sender.avatar)}
                              alt={senderName}
                              className="notif-avatar-img"
                              onError={() => handleAvatarError(notif._id)}
                            />
                          ) : (
                            <div className="notif-avatar-initial" aria-label={senderName}>
                              {initial}
                            </div>
                          )}
                          <div
                            className={`notif-type-badge ${config.colorClass}`}
                            title={config.label}
                          >
                            <TypeIcon size={10} />
                          </div>
                        </div>

                        {/* Column 2: Notification Body */}
                        <div className="notif-content-box">
                          <p className="notif-message-text">
                            {notif.message}
                          </p>
                          <div className="notif-meta-row">
                            <span className="notif-category-tag">{config.label}</span>
                            <span className="notif-meta-dot">•</span>
                            <time className="notif-time-badge" dateTime={notif.createdAt}>
                              {formatNotificationTime(notif.createdAt)}
                            </time>
                            {notif.sender?.jobTitle && (
                              <>
                                <span className="notif-meta-dot">•</span>
                                <span className="notif-sender-meta">
                                  {notif.sender.jobTitle}
                                  {notif.sender.company ? ` at ${notif.sender.company}` : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Status / Action Indicator */}
                        <div className="notif-action-col">
                          {!notif.isRead ? (
                            <span
                              className="notif-dot-indicator"
                              title="Unread notification"
                              aria-label="Unread"
                            />
                          ) : (
                            <ChevronRight size={16} className="notif-chevron-arrow" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="notif-pagination-bar" aria-label="Pagination Navigation">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-notif-page"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="notif-page-status">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-notif-page"
                  aria-label="Go to next page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>

          {/* Desktop Compact Sidebar Column */}
          <aside className="notif-sidebar-column" aria-label="Activity Summary">
            {/* User Overview Card */}
            <div className="notif-sidebar-card">
              <div className="notif-sidebar-title">
                <Sparkles size={16} className="text-primary" />
                <span>Activity Snapshot</span>
              </div>
              <div className="notif-sidebar-stats">
                <div className="notif-stat-box">
                  <span className="notif-stat-number">{counts.unread}</span>
                  <span className="notif-stat-label">Unread</span>
                </div>
                <div className="notif-stat-box">
                  <span className="notif-stat-number">{counts.all}</span>
                  <span className="notif-stat-label">Total Logged</span>
                </div>
              </div>
              <div className="notif-sidebar-links">
                <Link to="/people" className="notif-sidebar-link">
                  <span>Explore Alumni Directory</span>
                  <ArrowRight size={14} />
                </Link>
                <Link to="/events" className="notif-sidebar-link">
                  <span>Upcoming Campus Events</span>
                  <ArrowRight size={14} />
                </Link>
                <Link to="/profile" className="notif-sidebar-link">
                  <span>My Public Profile</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Community Pro-tip Card */}
            <div className="notif-sidebar-card notif-tip-box">
              <strong style={{ display: "block", marginBottom: "6px", color: "var(--dark-color)" }}>
                💡 Community Tip
              </strong>
              Keep your profile skills and graduation details up to date to receive relevant mentorship and alumni connection notifications.
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
