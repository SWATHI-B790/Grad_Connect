import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  Video,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  Filter,
  Check,
  X,
  Layers,
  Award,
  AlertTriangle,
  UserCheck,
  Shield,
  Activity,
  Send,
  Sparkles,
  FileText,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  "Technical Workshop",
  "Career Bootcamp",
  "Hackathon",
  "Alumni Webinar",
  "Mentorship Session",
  "Panel Discussion",
  "Placement Preparation",
  "Alumni Meetup",
  "Other",
];

const EVENT_TYPES = [
  "Workshop",
  "Webinar",
  "Meetup",
  "Hackathon",
  "Tech Fest",
  "Career Event",
  "Alumni Meet",
  "Networking Event",
  "Seminar",
  "Conference",
  "Coding Event",
  "Industry Talk",
  "Other",
];

const AdminEventManagement = () => {
  const { user } = useAuth();

  // Active Tab: 'events' (all events) | 'pending' (alumni submissions)
  const [activeTab, setActiveTab] = useState("events");

  // Data & Telemetry
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    pendingEvents: 0,
    draftEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });

  // Modals & Drawers
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formStep, setFormStep] = useState(1);

  // Attendees Drawer
  const [attendeesDrawerOpen, setAttendeesDrawerOpen] = useState(false);
  const [attendeesEvent, setAttendeesEvent] = useState(null);
  const [attendeesList, setAttendeesList] = useState([]);
  const [attendeesCounts, setAttendeesCounts] = useState({ total: 0, registered: 0, attended: 0, noShow: 0, cancelled: 0 });
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");

  // Rejection Feedback Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetEvent, setRejectTargetEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetEvent, setCancelTargetEvent] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Deletion Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);

  // Action Menu Dropdown State
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".event-more-menu-container")) {
        setActiveActionMenuId(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setActiveActionMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Available Technical Domains for Linking
  const [availableDomains, setAvailableDomains] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "Technical Workshop",
    eventType: "Workshop",
    domainId: "",
    domain: "Full Stack Development",
    date: "",
    startTime: "10:00 AM",
    endTime: "4:00 PM",
    duration: "1 Day",
    registrationDeadline: "",
    mode: "Online",
    venue: "Zoom / Virtual Hall",
    location: "Zoom / Virtual Hall",
    address: "",
    city: "",
    meetingLink: "",
    organizer: "GradConnect Admin",
    maxAttendees: 100,
    price: 0,
    priceType: "Free",
    currency: "INR",
    bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    registrationEnabled: true,
    topicsInput: "",
  });

  // Fetch Domains for selection
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await API.get("/domains");
        setAvailableDomains(res.data.data || res.data.domains || []);
      } catch (e) {
        // non-blocking
      }
    };
    fetchDomains();
  }, []);

  // Fetch Admin Events & Telemetry
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search.trim()) params.append("search", search.trim());
      if (modeFilter !== "all") params.append("mode", modeFilter);
      if (eventTypeFilter !== "all") params.append("eventType", eventTypeFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);
      if (dateFilter !== "all") params.append("dateFilter", dateFilter);

      // In Pending tab, force status=PENDING
      if (activeTab === "pending") {
        params.append("status", "PENDING");
      } else if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await API.get(`/admin/events?${params.toString()}`);
      if (res.data.success) {
        setEvents(res.data.events || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Fetch admin events error:", err);
      setError(err.response?.data?.message || "Server error fetching events. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, eventTypeFilter, modeFilter, sourceFilter, dateFilter, activeTab]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle Form Modal Open (Add / Edit)
  const openCreateModal = () => {
    setFormMode("add");
    setSelectedEvent(null);
    setFormStep(1);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    setFormData({
      title: "",
      shortDescription: "",
      description: "",
      category: "Technical Workshop",
      eventType: "Workshop",
      domainId: availableDomains[0]?._id || "",
      domain: availableDomains[0]?.name || "Full Stack Development",
      date: tomorrow,
      startTime: "10:00 AM",
      endTime: "4:00 PM",
      duration: "6 Hours",
      registrationDeadline: tomorrow,
      mode: "Online",
      venue: "Zoom Virtual Hall",
      location: "Zoom Virtual Hall",
      address: "",
      city: "",
      meetingLink: "https://zoom.us/j/gradconnect",
      organizer: user?.name || "GradConnect Admin",
      maxAttendees: 100,
      price: 0,
      priceType: "Free",
      currency: "INR",
      bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      status: "PUBLISHED",
      registrationEnabled: true,
      topicsInput: "Enterprise Systems, Modern Concurrency, Microservices",
    });
    setFormModalOpen(true);
  };

  const openEditModal = (ev) => {
    setFormMode("edit");
    setSelectedEvent(ev);
    setFormStep(1);
    setFormData({
      title: ev.title || "",
      shortDescription: ev.shortDescription || "",
      description: ev.description || "",
      category: ev.category || "Technical Workshop",
      eventType: ev.eventType || "Workshop",
      domainId: ev.domainId?._id || ev.domainId || "",
      domain: ev.domain || "Full Stack Development",
      date: ev.date ? new Date(ev.date).toISOString().split("T")[0] : "",
      startTime: ev.startTime || "10:00 AM",
      endTime: ev.endTime || "4:00 PM",
      duration: ev.duration || "1 Day",
      registrationDeadline: ev.registrationDeadline ? new Date(ev.registrationDeadline).toISOString().split("T")[0] : "",
      mode: ev.mode || "Online",
      venue: ev.venue || ev.location || "Zoom Virtual Hall",
      location: ev.location || ev.venue || "Zoom Virtual Hall",
      address: ev.address || "",
      city: ev.city || "",
      meetingLink: ev.meetingLink || ev.onlineLink || "",
      organizer: ev.organizer || "GradConnect Admin",
      maxAttendees: ev.maxAttendees || 100,
      price: ev.price || 0,
      priceType: ev.price > 0 ? "Paid" : "Free",
      currency: ev.currency || "INR",
      bannerImage: ev.bannerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      status: ev.status || "PUBLISHED",
      registrationEnabled: ev.registrationEnabled !== false,
      topicsInput: Array.isArray(ev.topics) ? ev.topics.join(", ") : "",
    });
    setFormModalOpen(true);
  };

  // Submit Create or Edit Event Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const parsedTopics = formData.topicsInput
        ? formData.topicsInput.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        price: Number(formData.price) || 0,
        maxAttendees: parseInt(formData.maxAttendees, 10) || 100,
        topics: parsedTopics,
      };

      if (formMode === "add") {
        const res = await API.post("/admin/events", payload);
        setSuccess(`Event "${payload.title}" created successfully!`);
      } else {
        const res = await API.put(`/admin/events/${selectedEvent._id}`, payload);
        setSuccess(`Event "${payload.title}" updated successfully!`);
      }

      setFormModalOpen(false);
      fetchEvents();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save event. Please verify all inputs.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (ev) => {
    try {
      const res = await API.patch(`/admin/events/${ev._id}/publish`);
      setSuccess(res.data.message || "Event publish status updated");
      fetchEvents();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle event publish status");
    }
  };

  // Approve Alumni Submission
  const handleApproveSubmission = async (ev) => {
    try {
      const res = await API.put(`/admin/events/${ev._id}/approve`);
      setSuccess(`Approved & published alumni event "${ev.title}"!`);
      fetchEvents();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve event");
    }
  };

  // Reject Alumni Submission Modal trigger
  const openRejectModal = (ev) => {
    setRejectTargetEvent(ev);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason for feedback.");
      return;
    }
    setActionLoading(true);
    try {
      await API.put(`/admin/events/${rejectTargetEvent._id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      setSuccess(`Event submission rejected with feedback sent to organizer.`);
      setRejectModalOpen(false);
      fetchEvents();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject event");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Event Modal trigger
  const openCancelModal = (ev) => {
    setCancelTargetEvent(ev);
    setCancellationReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    setActionLoading(true);
    try {
      await API.patch(`/admin/events/${cancelTargetEvent._id}/cancel`, {
        cancellationReason: cancellationReason.trim() || "Cancelled by university administration",
      });
      setSuccess(`Event "${cancelTargetEvent.title}" has been cancelled.`);
      setCancelModalOpen(false);
      fetchEvents();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel event");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Event Modal trigger
  const openDeleteModal = (ev) => {
    setDeleteTargetEvent(ev);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setActionLoading(true);
    try {
      await API.delete(`/admin/events/${deleteTargetEvent._id}`);
      setSuccess(`Event "${deleteTargetEvent.title}" permanently deleted.`);
      setDeleteModalOpen(false);
      fetchEvents();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete event");
    } finally {
      setActionLoading(false);
    }
  };

  // Attendees Drawer Handlers
  const openAttendeesDrawer = async (ev) => {
    setAttendeesEvent(ev);
    setAttendeesDrawerOpen(true);
    setAttendeesLoading(true);
    try {
      const res = await API.get(`/admin/events/${ev._id}/attendees`);
      if (res.data.success) {
        setAttendeesList(res.data.attendees || []);
        if (res.data.counts) setAttendeesCounts(res.data.counts);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendees");
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleUpdateAttendeeStatus = async (registrationId, newStatus) => {
    try {
      const res = await API.patch(`/admin/events/${attendeesEvent._id}/attendees/${registrationId}`, {
        status: newStatus,
      });
      setAttendeesList((prev) =>
        prev.map((a) => (a.registrationId === registrationId ? { ...a, status: newStatus } : a))
      );
      // Refresh event capacity badge in background
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update attendance status");
    }
  };

  // Filtered attendees for drawer search
  const filteredAttendees = attendeesList.filter((a) => {
    if (!attendeeSearch.trim()) return true;
    const q = attendeeSearch.toLowerCase();
    return (
      a.user?.name?.toLowerCase().includes(q) ||
      a.user?.email?.toLowerCase().includes(q) ||
      a.user?.department?.toLowerCase().includes(q)
    );
  });

  // Reset all search & filter dropdowns
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setEventTypeFilter("all");
    setModeFilter("all");
    setDateFilter("all");
    setSourceFilter("all");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    eventTypeFilter !== "all" ||
    modeFilter !== "all" ||
    dateFilter !== "all" ||
    sourceFilter !== "all";

  const formatEventDate = (dateVal) => {
    if (!dateVal) return "TBD";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  const formatEventTime = (ev) => {
    if (ev.startTime && ev.endTime) {
      return `${ev.startTime} – ${ev.endTime}`;
    }
    return ev.time || ev.startTime || "Schedule TBD";
  };

  const renderStatusBadge = (ev) => {
    const statusRaw = ev.status || (ev.published ? "PUBLISHED" : "DRAFT");
    if (statusRaw === "PENDING_ADMIN_APPROVAL" || statusRaw === "PENDING") {
      return (
        <span className="event-status-pill pending" title="Awaiting university administrator approval">
          <span className="event-status-dot" />
          <span>Pending Review</span>
        </span>
      );
    }
    if (statusRaw === "PUBLISHED" || (ev.published && statusRaw !== "CANCELLED" && statusRaw !== "DRAFT")) {
      return (
        <span className="event-status-pill published" title="Published and live in public directory">
          <span className="event-status-dot" />
          <span>Published</span>
        </span>
      );
    }
    if (statusRaw === "CANCELLED") {
      return (
        <span className="event-status-pill cancelled" title="Event cancelled">
          <span className="event-status-dot" />
          <span>Cancelled</span>
        </span>
      );
    }
    if (statusRaw === "COMPLETED") {
      return (
        <span className="event-status-pill completed" title="Event completed">
          <span className="event-status-dot" />
          <span>Completed</span>
        </span>
      );
    }
    return (
      <span className="event-status-pill draft" title="Draft / Unpublished in console">
        <span className="event-status-dot" />
        <span>Draft</span>
      </span>
    );
  };

  const renderModeBadge = (mode) => {
    const m = (mode || "Online").toLowerCase();
    if (m === "offline" || m === "in-person") {
      return <span className="event-mode-badge offline">Offline</span>;
    }
    if (m === "hybrid") {
      return <span className="event-mode-badge hybrid">Hybrid</span>;
    }
    return <span className="event-mode-badge online">Online</span>;
  };

  return (
    <div className="admin-page-container">
      {/* ============================================================
          1. PAGE HEADER BAR
          ============================================================ */}
      <header className="event-admin-header">
        <div className="event-admin-title-group">
          <div className="event-admin-icon-circle">
            <Calendar size={22} />
          </div>
          <div>
            <h1 className="event-admin-title">Event Management</h1>
            <p className="event-admin-subtitle">
              Review, publish, manage, and monitor all GradConnect events.
            </p>
          </div>
        </div>

        <div className="event-admin-header-actions">
          <button
            type="button"
            className="btn-event-refresh"
            onClick={fetchEvents}
            title="Refresh event catalog"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-event-create-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>Create Event</span>
          </button>
        </div>
      </header>

      {/* ============================================================
          2. NOTIFICATION / ALERT BANNERS
          ============================================================ */}
      {success && (
        <div className="blog-alert-box success">
          <div className="blog-alert-content">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
          <button
            type="button"
            className="blog-alert-close"
            onClick={() => setSuccess("")}
            title="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="event-error-card">
          <div className="event-error-left">
            <AlertCircle size={20} />
            <div>
              <div className="event-error-title">Unable to load events</div>
              <div className="event-error-desc">{error}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn-event-error-retry"
            onClick={fetchEvents}
          >
            Retry
          </button>
        </div>
      )}

      {/* ============================================================
          3. 6-CARD ANALYTICS GRID
          ============================================================ */}
      <div className="event-analytics-grid">
        {/* Total Events */}
        <div className="event-analytics-card">
          <div className="event-stat-header">
            <span className="event-stat-label">TOTAL EVENTS</span>
            <div className="event-stat-icon-wrap neutral">
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <div className="event-stat-value">{stats.totalEvents}</div>
            <p className="event-stat-subtext">Platform catalog</p>
          </div>
        </div>

        {/* Published & Live */}
        <div className="event-analytics-card">
          <div className="event-stat-header">
            <span className="event-stat-label">PUBLISHED &amp; LIVE</span>
            <div className="event-stat-icon-wrap green">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="event-stat-value" style={{ color: "#059669" }}>
              {stats.publishedEvents}
            </div>
            <p className="event-stat-subtext">Publicly visible</p>
          </div>
        </div>

        {/* Pending Review */}
        <div
          className={`event-analytics-card is-clickable ${stats.pendingEvents > 0 ? "highlight-amber" : ""}`}
          onClick={() => setActiveTab("pending")}
          title="Click to view pending proposals"
        >
          <div className="event-stat-header">
            <span className="event-stat-label" style={{ color: stats.pendingEvents > 0 ? "#b45309" : undefined }}>
              PENDING REVIEW
            </span>
            <div className="event-stat-icon-wrap amber">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="event-stat-value" style={{ color: stats.pendingEvents > 0 ? "#d97706" : undefined }}>
              {stats.pendingEvents}
            </div>
            <p className="event-stat-subtext">
              {stats.pendingEvents > 0 ? "Action required" : "All moderated"}
            </p>
          </div>
        </div>

        {/* Draft / Unpublished */}
        <div className="event-analytics-card">
          <div className="event-stat-header">
            <span className="event-stat-label">DRAFT / UNPUBLISHED</span>
            <div className="event-stat-icon-wrap slate">
              <FileText size={16} />
            </div>
          </div>
          <div>
            <div className="event-stat-value">{stats.draftEvents}</div>
            <p className="event-stat-subtext">Internal drafts</p>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="event-analytics-card">
          <div className="event-stat-header">
            <span className="event-stat-label">UPCOMING SESSIONS</span>
            <div className="event-stat-icon-wrap blue">
              <Activity size={16} />
            </div>
          </div>
          <div>
            <div className="event-stat-value" style={{ color: "#2563eb" }}>
              {stats.upcomingEvents}
            </div>
            <p className="event-stat-subtext">Scheduled ahead</p>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="event-analytics-card">
          <div className="event-stat-header">
            <span className="event-stat-label">TOTAL REGISTRATIONS</span>
            <div className="event-stat-icon-wrap purple">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="event-stat-value" style={{ color: "#7c3aed" }}>
              {stats.totalRegistrations}
            </div>
            <p className="event-stat-subtext">Attendee signups</p>
          </div>
        </div>
      </div>

      {/* ============================================================
          4. EVENT TABS
          ============================================================ */}
      <div className="event-tabs-container">
        <button
          type="button"
          className={`event-tab-btn ${activeTab === "events" ? "active-events" : ""}`}
          onClick={() => {
            setActiveTab("events");
            setPage(1);
          }}
        >
          <Calendar size={16} />
          <span>All Events</span>
          <span className="event-tab-badge neutral">{stats.totalEvents}</span>
        </button>

        <button
          type="button"
          className={`event-tab-btn ${activeTab === "pending" ? "active-pending" : ""}`}
          onClick={() => {
            setActiveTab("pending");
            setPage(1);
          }}
        >
          <Clock size={16} />
          <span>Pending Submissions</span>
          <span className={`event-tab-badge ${stats.pendingEvents > 0 ? "red" : "neutral"}`}>
            {stats.pendingEvents}
          </span>
        </button>
      </div>

      {/* ============================================================
          5. SEARCH & FILTER TOOLBAR
          ============================================================ */}
      <div className="event-management-toolbar">
        {/* Search Input with Guaranteed 44px Clearance */}
        <div className="event-search-wrapper">
          <Search size={16} className="event-search-icon" />
          <input
            type="text"
            className="event-search-input"
            placeholder="Search events by title, venue, organizer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button
              type="button"
              className="event-search-clear"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              title="Clear search query"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters */}
        {activeTab === "events" && (
          <div className="event-filter-select-wrapper">
            <select
              className="event-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Status: All</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>
            <ChevronDown size={14} className="event-select-chevron" />
          </div>
        )}

        <div className="event-filter-select-wrapper">
          <select
            className="event-filter-select"
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Type: All</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="event-select-chevron" />
        </div>

        <div className="event-filter-select-wrapper">
          <select
            className="event-filter-select"
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Mode: All</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
          <ChevronDown size={14} className="event-select-chevron" />
        </div>

        <div className="event-filter-select-wrapper">
          <select
            className="event-filter-select"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Date: All</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="past">Past</option>
          </select>
          <ChevronDown size={14} className="event-select-chevron" />
        </div>

        <div className="event-filter-select-wrapper">
          <select
            className="event-filter-select"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Source: All</option>
            <option value="admin">Admin Created</option>
            <option value="alumni">Alumni Submitted</option>
          </select>
          <ChevronDown size={14} className="event-select-chevron" />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn-event-reset-filters"
            onClick={handleResetFilters}
            title="Clear all active search and filter rules"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* ============================================================
          6. EVENT MANAGEMENT TABLE (CSS GRID ARCHITECTURE)
          ============================================================ */}
      <div className="event-table-card">
        <div className="event-table-scroll-wrapper">
          <div className="event-grid-table">
            {/* Header row with synchronized CSS grid columns */}
            <div className="event-grid-header">
              <div className="event-grid-th col-details">Event Details</div>
              <div className="event-grid-th col-datetime">Date &amp; Time</div>
              <div className="event-grid-th col-modevenue">Mode &amp; Venue</div>
              <div className="event-grid-th col-organizer">Organizer</div>
              <div className="event-grid-th col-capacity">Capacity</div>
              <div className="event-grid-th col-status">Status</div>
              <div className="event-grid-th col-actions">Actions</div>
            </div>

            <div className="event-grid-body">
              {loading ? (
                // 5-Row Shimmer Skeleton Loading using identical CSS Grid structure
                [...Array(5)].map((_, i) => (
                  <div key={`skel-${i}`} className="event-grid-row skeleton-row">
                    <div className="event-grid-cell col-details">
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          className="event-skeleton-cell"
                          style={{ width: "56px", height: "56px", borderRadius: "10px", flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div className="event-skeleton-cell" style={{ width: "85%", height: "16px" }} />
                          <div className="event-skeleton-cell" style={{ width: "50%", height: "12px" }} />
                        </div>
                      </div>
                    </div>
                    <div className="event-grid-cell col-datetime">
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div className="event-skeleton-cell" style={{ width: "80px", height: "14px" }} />
                        <div className="event-skeleton-cell" style={{ width: "100px", height: "12px" }} />
                      </div>
                    </div>
                    <div className="event-grid-cell col-modevenue">
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div
                          className="event-skeleton-cell"
                          style={{ width: "60px", height: "18px", borderRadius: "6px" }}
                        />
                        <div className="event-skeleton-cell" style={{ width: "110px", height: "12px" }} />
                      </div>
                    </div>
                    <div className="event-grid-cell col-organizer">
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div className="event-skeleton-cell" style={{ width: "95px", height: "14px" }} />
                        <div className="event-skeleton-cell" style={{ width: "80px", height: "12px" }} />
                      </div>
                    </div>
                    <div className="event-grid-cell col-capacity">
                      <div
                        className="event-skeleton-cell"
                        style={{ width: "75px", height: "28px", borderRadius: "8px" }}
                      />
                    </div>
                    <div className="event-grid-cell col-status">
                      <div
                        className="event-skeleton-cell"
                        style={{ width: "85px", height: "24px", borderRadius: "20px" }}
                      />
                    </div>
                    <div className="event-grid-cell col-actions">
                      <div style={{ display: "flex", gap: "8px" }}>
                        <div
                          className="event-skeleton-cell"
                          style={{ width: "36px", height: "36px", borderRadius: "8px" }}
                        />
                        <div
                          className="event-skeleton-cell"
                          style={{ width: "75px", height: "36px", borderRadius: "8px" }}
                        />
                        <div
                          className="event-skeleton-cell"
                          style={{ width: "36px", height: "36px", borderRadius: "8px" }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : events.length === 0 ? (
                // Professional Centered Empty State
                <div className="event-empty-container">
                  <div className="event-empty-icon-wrap">
                    <Calendar size={30} />
                  </div>
                  <h3 className="event-empty-title">
                    {activeTab === "pending" ? "No Pending Submissions" : "No Events Found"}
                  </h3>
                  <p className="event-empty-desc">
                    {activeTab === "pending"
                      ? "All alumni proposals have been moderated. You're completely caught up!"
                      : hasActiveFilters
                      ? "There are currently no events matching your active filters or search terms."
                      : "No events are scheduled in the system yet. Organize your first session."}
                  </p>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      className="btn-event-reset-filters"
                      onClick={handleResetFilters}
                    >
                      <RotateCcw size={14} /> Clear All Filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-event-create-primary"
                      onClick={openCreateModal}
                    >
                      <Plus size={16} /> Create Event
                    </button>
                  )}
                </div>
              ) : (
                events.map((ev) => {
                  const attendeeCount = ev.attendees?.length || 0;
                  const maxCap = ev.maxAttendees || 100;
                  const isPending = ev.status === "PENDING" || ev.status === "PENDING_ADMIN_APPROVAL";
                  const isPub = ev.published && ev.status !== "DRAFT" && ev.status !== "CANCELLED";
                  const isAlumni =
                    ev.createdByRole === "alumni" ||
                    ev.creatorModel === "Alumni" ||
                    ev.organizerType === "alumni";

                  return (
                    <div key={ev._id} className="event-grid-row">
                      {/* 1. EVENT DETAILS */}
                      <div className="event-grid-cell col-details">
                        <div className="event-details-cell">
                          <div className="event-thumb-wrapper">
                            <img
                              src={
                                ev.bannerImage ||
                                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&fit=crop"
                              }
                              alt={ev.title}
                              className="event-thumb-img"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&fit=crop";
                              }}
                            />
                          </div>
                          <div className="event-info-wrapper">
                            <div className="event-title-text" title={ev.title}>
                              {ev.title}
                            </div>
                            <div className="event-meta-line">
                              <span>{ev.eventType || "Workshop"}</span>
                              <span>•</span>
                              <span>{ev.category || "General"}</span>
                              {ev.domain && (
                                <>
                                  <span>•</span>
                                  <span className="event-domain-tag">{ev.domain}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. DATE & TIME */}
                      <div className="event-grid-cell col-datetime">
                        <div className="event-datetime-cell">
                          <div className="event-date-main">{formatEventDate(ev.date)}</div>
                          <div className="event-time-sub">{formatEventTime(ev)}</div>
                        </div>
                      </div>

                      {/* 3. MODE & VENUE */}
                      <div className="event-grid-cell col-modevenue">
                        <div className="event-modevenue-cell">
                          {renderModeBadge(ev.mode)}
                          <div
                            className="event-venue-text"
                            title={ev.venue || ev.location || "Virtual Event"}
                          >
                            {ev.venue || ev.location || "Virtual Event"}
                          </div>
                        </div>
                      </div>

                      {/* 4. ORGANIZER */}
                      <div className="event-grid-cell col-organizer">
                        <div className="event-organizer-cell">
                          <div className="event-organizer-name" title={ev.organizer || "GradConnect Admin"}>
                            {ev.organizer || "GradConnect Admin"}
                          </div>
                          <div className="event-organizer-type">
                            {isAlumni ? "🎓 Alumni Submission" : "🛡️ Admin Host"}
                          </div>
                        </div>
                      </div>

                      {/* 5. CAPACITY */}
                      <div className="event-grid-cell col-capacity">
                        <button
                          type="button"
                          className="event-capacity-btn"
                          onClick={() => openAttendeesDrawer(ev)}
                          title="View and manage attendee list"
                        >
                          <Users size={13} style={{ color: "#2563eb" }} />
                          <span>
                            {attendeeCount} / {maxCap}
                          </span>
                        </button>
                      </div>

                      {/* 6. STATUS */}
                      <div className="event-grid-cell col-status">
                        {renderStatusBadge(ev)}
                      </div>

                      {/* 7. ACTIONS */}
                      <div className="event-grid-cell col-actions">
                        <div className="event-actions">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                className="btn-event-action-approve"
                                onClick={() => handleApproveSubmission(ev)}
                                title="Approve & Publish Event Proposal"
                              >
                                <Check size={13} />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                className="btn-event-action-reject"
                                onClick={() => openRejectModal(ev)}
                                title="Reject Proposal with Feedback"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>

                              <button
                                type="button"
                                className="btn-event-icon-action"
                                onClick={() => openEditModal(ev)}
                                title="Edit Event Details"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn-event-icon-action danger"
                                onClick={() => openDeleteModal(ev)}
                                title="Delete Event Proposal"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                to={`/events/${ev.slug || ev._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-event-icon-action view"
                                title="View Public Page"
                              >
                                <ExternalLink size={14} />
                              </Link>

                              <button
                                type="button"
                                className="btn-event-icon-action"
                                onClick={() => openEditModal(ev)}
                                title="Edit Event Details"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                type="button"
                                className={`btn-event-text-action ${
                                  isPub ? "is-pub" : "is-unpub"
                                }`}
                                onClick={() => handleTogglePublish(ev)}
                                title={isPub ? "Unpublish Event" : "Publish Event"}
                              >
                                {isPub ? "Unpublish" : "Publish"}
                              </button>

                              <div className="event-more-menu-container">
                                <button
                                  type="button"
                                  className="btn-event-icon-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(activeActionMenuId === ev._id ? null : ev._id);
                                  }}
                                  title="More Actions"
                                  aria-expanded={activeActionMenuId === ev._id}
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {activeActionMenuId === ev._id && (
                                  <div className="event-more-dropdown" onClick={(e) => e.stopPropagation()}>
                                    {ev.status !== "CANCELLED" && (
                                      <button
                                        type="button"
                                        className="event-more-dropdown-item danger"
                                        onClick={() => {
                                          setActiveActionMenuId(null);
                                          openCancelModal(ev);
                                        }}
                                      >
                                        <X size={14} />
                                        <span>Cancel Event</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="event-more-dropdown-item danger"
                                      onClick={() => {
                                        setActiveActionMenuId(null);
                                        openDeleteModal(ev);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      <span>Delete Event</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="event-pagination-bar">
            <span className="event-pagination-info">
              Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total events)
            </span>
            <div className="event-pagination-controls">
              <button
                type="button"
                className="btn-page-nav"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {[...Array(pagination.pages)].map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === pagination.pages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      className={`btn-page-num ${page === pageNum ? "active" : ""}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === page - 2 || pageNum === page + 2) {
                  return (
                    <span key={`ellipsis-${pageNum}`} style={{ padding: "0 4px", color: "var(--text-muted)" }}>
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                className="btn-page-nav"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MULTI-SECTION CREATE / EDIT EVENT MODAL */}
      {/* ========================================================================= */}
      {formModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              maxWidth: "720px",
              width: "100%",
              backgroundColor: "var(--card-bg, #ffffff)",
              borderRadius: "18px",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderBottom: "1px solid var(--border-color, #e2e8f0)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                  {formMode === "add" ? "Create New Campus Event" : `Edit Event: ${selectedEvent?.title}`}
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Step {formStep} of 3: {formStep === 1 ? "Basic Information & Domain" : formStep === 2 ? "Schedule & Location" : "Registration, Pricing & Media"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "1.75rem", overflowY: "auto", flex: 1 }}>
                {formStep === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Event Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Java Fest 2026 — State Level Technical Workshop"
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Event Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem", backgroundColor: "var(--card-bg)" }}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Event Type *
                        </label>
                        <select
                          value={formData.eventType}
                          onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem", backgroundColor: "var(--card-bg)" }}
                        >
                          {EVENT_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Linked Technical Domain
                      </label>
                      <select
                        value={formData.domainId}
                        onChange={(e) => {
                          const sel = availableDomains.find((d) => d._id === e.target.value);
                          setFormData({ ...formData, domainId: e.target.value, domain: sel ? sel.name : "" });
                        }}
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem", backgroundColor: "var(--card-bg)" }}
                      >
                        <option value="">None (General Event)</option>
                        {availableDomains.map((d) => (
                          <option key={d._id} value={d._id}>{d.name} ({d.category})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Short Summary *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        placeholder="Brief 1-line overview for event cards..."
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Full Event Description *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Comprehensive details about agenda, prerequisites, learning outcomes, and speakers..."
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Event Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Registration Deadline
                        </label>
                        <input
                          type="date"
                          value={formData.registrationDeadline}
                          onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Start Time
                        </label>
                        <input
                          type="text"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          placeholder="e.g. 10:00 AM"
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          End Time
                        </label>
                        <input
                          type="text"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          placeholder="e.g. 4:00 PM"
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Delivery Mode *
                      </label>
                      <select
                        value={formData.mode}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem", backgroundColor: "var(--card-bg)" }}
                      >
                        <option value="Online">Online (Virtual Summit / Webinar)</option>
                        <option value="Offline">Offline (Campus / In-Person)</option>
                        <option value="Hybrid">Hybrid (In-Person + Live Stream)</option>
                      </select>
                    </div>

                    {formData.mode !== "Online" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                            Venue / Auditorium *
                          </label>
                          <input
                            type="text"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value, location: e.target.value })}
                            placeholder="e.g. Main Seminar Hall, Sri Eshwar College"
                            style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                            City / Location
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="e.g. Coimbatore, Tamil Nadu"
                            style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                          />
                        </div>
                      </div>
                    )}

                    {formData.mode !== "Offline" && (
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Meeting Link / Virtual Hall URL
                        </label>
                        <input
                          type="url"
                          value={formData.meetingLink}
                          onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                          placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Organizer Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.organizer}
                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                        placeholder="e.g. Swathi B K & GradConnect Tech Club"
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Maximum Capacity (Attendees) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={formData.maxAttendees}
                          onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                          Ticket Price (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0 for Free"
                          style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Key Topics / Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.topicsInput}
                        onChange={(e) => setFormData({ ...formData, topicsInput: e.target.value })}
                        placeholder="e.g. Modern Java 21, Spring Boot 3, Microservices, Hackathon"
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Banner Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.bannerImage}
                        onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        Publishing Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.9rem", backgroundColor: "var(--card-bg)" }}
                      >
                        <option value="PUBLISHED">Published (Visible Publicly)</option>
                        <option value="DRAFT">Draft (Saved in Admin Console)</option>
                        <option value="UNPUBLISHED">Unpublished</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div
                style={{
                  padding: "1.25rem 1.75rem",
                  borderTop: "1px solid var(--border-color, #e2e8f0)",
                  display: "flex",
                  justifyContent: "space-between",
                  backgroundColor: "var(--bg-color, #f8fafc)",
                }}
              >
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep((s) => s - 1)}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color, #cbd5e1)",
                      backgroundColor: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                ) : <div />}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setFormModalOpen(false)}
                    style={{
                      padding: "0.55rem 1.25rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color, #cbd5e1)",
                      backgroundColor: "#ffffff",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  {formStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setFormStep((s) => s + 1)}
                      style={{
                        padding: "0.55rem 1.5rem",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={actionLoading}
                      style={{
                        padding: "0.55rem 1.75rem",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      {actionLoading ? "Saving..." : formMode === "add" ? "Create Event" : "Save Changes"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATTENDEE MANAGEMENT DRAWER / MODAL */}
      {/* ========================================================================= */}
      {attendeesDrawerOpen && attendeesEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              backgroundColor: "var(--card-bg, #ffffff)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.2)",
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Attendee Management</h3>
                <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {attendeesEvent.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttendeesDrawerOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Attendance Metrics Strip */}
            <div style={{ padding: "1rem 1.5rem", backgroundColor: "var(--bg-color, #f8fafc)", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1, textAlign: "center", padding: "0.5rem", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>REGISTERED</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#2563eb" }}>{attendeesCounts.registered}</div>
              </div>

              <div style={{ flex: 1, textAlign: "center", padding: "0.5rem", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>ATTENDED</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#16a34a" }}>{attendeesCounts.attended}</div>
              </div>

              <div style={{ flex: 1, textAlign: "center", padding: "0.5rem", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>NO SHOW</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#d97706" }}>{attendeesCounts.noShow}</div>
              </div>

              <div style={{ flex: 1, textAlign: "center", padding: "0.5rem", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>CANCELLED</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#dc2626" }}>{attendeesCounts.cancelled}</div>
              </div>
            </div>

            {/* Search Attendee */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
              <input
                type="text"
                placeholder="Search attendee by name, email, department..."
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}
              />
            </div>

            {/* Attendees List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              {attendeesLoading ? (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <RefreshCw size={20} className="spin-icon" style={{ margin: "0 auto 0.5rem" }} />
                  Loading attendee records...
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <Users size={36} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
                  <div>No attendees registered yet for this event.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {filteredAttendees.map((att) => (
                    <div
                      key={att.registrationId}
                      style={{
                        padding: "0.85rem 1rem",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <img
                          src={att.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(att.user?.name || "User")}&background=2563eb&color=fff`}
                          alt={att.user?.name}
                          style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{att.user?.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {att.user?.email} • {att.user?.department || att.user?.role}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Registered: {new Date(att.registeredAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Attendance Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {att.status === "ATTENDED" ? (
                          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#16a34a", padding: "0.2rem 0.6rem", borderRadius: "6px", backgroundColor: "#dcfce7" }}>
                            ✓ Attended
                          </span>
                        ) : att.status === "NO_SHOW" ? (
                          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#d97706", padding: "0.2rem 0.6rem", borderRadius: "6px", backgroundColor: "#fef3c7" }}>
                            No-Show
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateAttendeeStatus(att.registrationId, "ATTENDED")}
                              style={{
                                padding: "0.3rem 0.6rem",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "#16a34a",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Mark Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateAttendeeStatus(att.registrationId, "NO_SHOW")}
                              style={{
                                padding: "0.3rem 0.6rem",
                                borderRadius: "6px",
                                border: "1px solid var(--border-color)",
                                backgroundColor: "#ffffff",
                                color: "#64748b",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              No-Show
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT SUBMISSION MODAL */}
      {/* ========================================================================= */}
      {rejectModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "#ffffff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 800, color: "#991b1b" }}>
              Reject Event Submission
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Provide constructive feedback to the alumni organizer for "{rejectTargetEvent?.title}".
            </p>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please clarify prerequisites and adjust workshop duration before resubmission."
              style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: "1.25rem" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: "#dc2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANCEL EVENT MODAL */}
      {/* ========================================================================= */}
      {cancelModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "#ffffff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 800, color: "#991b1b" }}>
              Cancel Upcoming Event?
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Cancelling "{cancelTargetEvent?.title}" will disable registrations and broadcast a cancellation notification to all confirmed attendees.
            </p>

            <textarea
              rows={2}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Cancellation reason for attendees..."
              style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", marginBottom: "1.25rem" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: "#dc2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "Cancelling..." : "Cancel Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE EVENT MODAL */}
      {/* ========================================================================= */}
      {deleteModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div style={{ maxWidth: "460px", width: "100%", backgroundColor: "#ffffff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 800, color: "#991b1b" }}>
              Delete Event?
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Are you sure you want to delete <strong>"{deleteTargetEvent?.title}"</strong>?
              {deleteTargetEvent?.attendees?.length > 0 && (
                <span style={{ display: "block", color: "#dc2626", fontWeight: 700, marginTop: "6px" }}>
                  ⚠️ This event has {deleteTargetEvent.attendees.length} registered attendees. Deleting it will permanently clear registration records.
                </span>
              )}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: "#dc2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventManagement;
