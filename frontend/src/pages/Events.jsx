import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Video,
  ArrowRight,
  Sparkles,
  Plus,
  Search,
  Filter,
  X,
  ChevronRight,
  Share2,
  Tag,
  ExternalLink,
  AlertCircle,
  Edit3,
  Trash2,
  Eye,
  ShieldCheck,
  Award,
  Briefcase,
  GraduationCap,
  Building,
  DollarSign,
  Globe,
  Layers,
  UserCheck,
  Copy,
  Check,
  RotateCcw,
  UploadCloud,
  FileText,
  CalendarCheck,
  Flame,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { getImageUrl } from "../utils/getImageUrl";
import Footer from "../components/Footer";

// Category definitions
const CATEGORIES = [
  "All Events",
  "Technical Workshop",
  "Career Bootcamp",
  "Hackathon",
  "Alumni Webinar",
  "Mentorship Session",
  "Panel Discussion",
];

// Technical Domain definitions
const DOMAINS = [
  "All Domains",
  "Cloud Architecture",
  "AI & Machine Learning",
  "System Design",
  "Full Stack Development",
  "Data Engineering",
  "Cybersecurity",
  "Product Management",
  "DevOps & SRE",
];

// Helper: Format date parts
const formatDateParts = (dateString) => {
  if (!dateString) return { month: "TBD", day: "--", dayOfWeek: "---", year: "" };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { month: "TBD", day: "--", dayOfWeek: "---", year: "" };
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  const dayOfWeek = d.toLocaleString("en-US", { weekday: "short" }).toUpperCase();
  const year = String(d.getFullYear());
  return { month, day, dayOfWeek, year };
};

// Helper: Format readable date
const formatFullDate = (dateString) => {
  if (!dateString) return "Date TBD";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Date TBD";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary state
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    alumniHosts: 0,
    technicalDomains: 0,
    studentRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Events");
  const [selectedDomain, setSelectedDomain] = useState("All Domains");
  const [selectedMode, setSelectedMode] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [sortBy, setSortBy] = useState("soonest");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'my-events'

  // Modals & Drawers state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalEvent, setEditModalEvent] = useState(null);
  const [participantsModalEvent, setParticipantsModalEvent] = useState(null);
  const [participantsList, setParticipantsList] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Action / Feedback state
  const [actionLoading, setActionLoading] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Check user role
  const isAlumniOrAdmin = useMemo(() => {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    const uType = (user.userType || "").toLowerCase();
    return (
      role === "alumni" ||
      role === "admin" ||
      role === "superadmin" ||
      role === "subadmin" ||
      uType === "alumni"
    );
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedCategory && selectedCategory !== "All Events") {
        params.category = selectedCategory;
      }
      if (selectedDomain && selectedDomain !== "All Domains") {
        params.domain = selectedDomain;
      }
      if (selectedMode && selectedMode !== "All") {
        params.mode = selectedMode;
      }
      if (selectedPrice && selectedPrice !== "All") {
        params.priceType = selectedPrice;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (sortBy) {
        params.sort = sortBy;
      }

      const res = await API.get("/events", { params });
      setEvents(res.data.events || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Unable to load events at this moment. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, selectedDomain, selectedMode, selectedPrice, sortBy]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  // Helper to test if user is registered for an event
  const isUserRegistered = (event) => {
    if (!user || !event || !event.attendees) return false;
    const currentUserId = user._id || user.id;
    return event.attendees.some((att) => {
      const attId = typeof att === "object" ? att?._id : att;
      return String(attId) === String(currentUserId);
    });
  };

  // Helper to test if current user is the host/creator of an event
  const isEventHost = (event) => {
    if (!user || !event) return false;
    const currentUserId = user._id || user.id;
    const creatorId =
      typeof event.createdBy === "object" ? event.createdBy?._id : event.createdBy;
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(
      (user.role || "").toLowerCase()
    );
    return (creatorId && String(creatorId) === String(currentUserId)) || isAdmin;
  };

  // Filter for 'My Hosted Events' tab
  const displayedEvents = useMemo(() => {
    if (activeTab === "my-events" && user) {
      const currentUserId = user._id || user.id;
      const isAdmin = ["admin", "superadmin", "subadmin"].includes(
        (user.role || "").toLowerCase()
      );
      return events.filter((ev) => {
        if (isAdmin) return true;
        const creatorId =
          typeof ev.createdBy === "object" ? ev.createdBy?._id : ev.createdBy;
        return creatorId && String(creatorId) === String(currentUserId);
      });
    }
    return events;
  }, [events, activeTab, user]);

  // Pick Featured Event
  const featuredEvent = useMemo(() => {
    if (!events.length) return null;
    const found = events.find((ev) => ev.featured);
    return found || events[0];
  }, [events]);

  // Register for event
  const handleRegister = async (event, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate("/login", { state: { from: "/events" } });
      return;
    }

    try {
      setActionLoading(`register-${event._id}`);
      const res = await API.post(`/events/${event._id}/register`);
      showToast(res.data.message || "Registration confirmed! See you at the event.", "success");

      // Update local state
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev._id === event._id) {
            const currentUserId = user._id || user.id;
            const attendees = [...(ev.attendees || []), currentUserId];
            return { ...ev, attendees };
          }
          return ev;
        })
      );

      // If selectedEvent is active, update it
      if (selectedEvent && selectedEvent._id === event._id) {
        setSelectedEvent((prev) => ({
          ...prev,
          attendees: [...(prev.attendees || []), user._id || user.id],
        }));
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to register for event. Please try again.";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Unregister / Cancel registration
  const handleUnregister = async (event, e) => {
    if (e) e.stopPropagation();
    if (!user) return;

    if (!window.confirm("Are you sure you want to cancel your registration for this event?")) {
      return;
    }

    try {
      setActionLoading(`unregister-${event._id}`);
      const res = await API.post(`/events/${event._id}/unregister`);
      showToast(res.data.message || "Registration cancelled.", "info");

      // Update local state
      const currentUserId = user._id || user.id;
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev._id === event._id) {
            const attendees = (ev.attendees || []).filter((a) => {
              const aId = typeof a === "object" ? a?._id : a;
              return String(aId) !== String(currentUserId);
            });
            return { ...ev, attendees };
          }
          return ev;
        })
      );

      if (selectedEvent && selectedEvent._id === event._id) {
        setSelectedEvent((prev) => ({
          ...prev,
          attendees: (prev.attendees || []).filter((a) => {
            const aId = typeof a === "object" ? a?._id : a;
            return String(aId) !== String(currentUserId);
          }),
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to cancel registration.";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete event
  const handleDeleteEvent = async (event, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${event.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(`delete-${event._id}`);
      await API.delete(`/events/${event._id}`);
      showToast("Event deleted successfully.", "info");
      setEvents((prev) => prev.filter((ev) => ev._id !== event._id));
      if (selectedEvent && selectedEvent._id === event._id) {
        setSelectedEvent(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete event.";
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Open Participants Modal
  const handleOpenParticipants = async (event, e) => {
    if (e) e.stopPropagation();
    setParticipantsModalEvent(event);
    setParticipantsList([]);
    setParticipantsLoading(true);

    try {
      const res = await API.get(`/events/${event._id}/participants`);
      setParticipantsList(res.data.participants || []);
    } catch (err) {
      console.error("Error fetching participants:", err);
      showToast("Could not load participants list.", "error");
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Copy share link
  const handleShareEvent = (event, e) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/events?id=${event._id}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    showToast("Event link copied to clipboard!", "success");
    setTimeout(() => setShareCopied(false), 2500);
  };

  // Copy attendee emails
  const handleCopyAttendeeEmails = () => {
    if (!participantsList.length) return;
    const emails = participantsList
      .map((p) => p.email)
      .filter(Boolean)
      .join(", ");
    navigator.clipboard.writeText(emails);
    setCopiedEmail(true);
    showToast("All attendee emails copied to clipboard!", "success");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="events-page-root">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`events-toast ${toastMessage.type === "error" ? "toast-error" : toastMessage.type === "info" ? "toast-info" : "toast-success"}`}
          >
            {toastMessage.type === "error" ? (
              <AlertCircle size={18} />
            ) : toastMessage.type === "info" ? (
              <Sparkles size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="toast-close-btn"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="events-main-container">
        {/* ============================================================
            1. EDITORIAL HERO SECTION
            ============================================================ */}
        <section className="events-hero-section">
          <div className="events-hero-content">
            <div className="events-eyebrow-pill">
              <span className="eyebrow-dot"></span>
              <Sparkles size={14} className="eyebrow-icon" />
              <span>GRADCONNECT INDUSTRY PLATFORM</span>
            </div>

            <h1 className="events-hero-heading">
              Industry Events, <span className="text-gradient">Built for Your Growth</span>
            </h1>

            <p className="events-hero-subtitle">
              Discover technical workshops, alumni webinars, hackathons, and career bootcamps
              hosted by verified industry leaders from Google, Stripe, Microsoft, and high-growth
              startups.
            </p>

            {/* Role-Based Primary Action Bar */}
            <div className="events-hero-actions">
              {isAlumniOrAdmin ? (
                <div className="events-alumni-action-row">
                  <Link
                    to="/events/create"
                    className="btn-create-event-primary"
                    style={{ textDecoration: "none" }}
                  >
                    <Plus size={18} />
                    <span>Host New Industry Event</span>
                  </Link>

                  <Link
                    to="/my-events"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0.65rem 1.15rem",
                      borderRadius: "10px",
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                    }}
                  >
                    <UserCheck size={16} />
                    <span>Manage My Events</span>
                  </Link>

                  <div className="events-tab-toggle">
                    <button
                      type="button"
                      className={`tab-toggle-btn ${activeTab === "all" ? "active" : ""}`}
                      onClick={() => setActiveTab("all")}
                    >
                      <Globe size={15} />
                      <span>All Events</span>
                    </button>
                    <button
                      type="button"
                      className={`tab-toggle-btn ${activeTab === "my-events" ? "active" : ""}`}
                      onClick={() => setActiveTab("my-events")}
                    >
                      <UserCheck size={15} />
                      <span>My Hosted Events</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="events-student-welcome-strip" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="welcome-tag">
                      <GraduationCap size={16} />
                      <span>Student Access</span>
                    </div>
                    <span className="welcome-hint">
                      Explore live sessions, reserve your seat with 1 click, and network directly with alumni hosts.
                    </span>
                  </div>

                  {user && (
                    <Link
                      to="/my-events?tab=registrations"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none",
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <UserCheck size={15} />
                      <span>My Event Passes</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Dynamic Statistics Strip */}
          <div className="events-stats-strip">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-blue">
                <Calendar size={20} />
              </div>
              <div className="stat-meta">
                <span className="stat-value">{stats.upcomingEvents || events.length || 0}</span>
                <span className="stat-label">Upcoming Events</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-red">
                <Building size={20} />
              </div>
              <div className="stat-meta">
                <span className="stat-value">{stats.alumniHosts || 3}</span>
                <span className="stat-label">Alumni Organizers</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-amber">
                <Layers size={20} />
              </div>
              <div className="stat-meta">
                <span className="stat-value">{stats.technicalDomains || 7}</span>
                <span className="stat-label">Tech Domains</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-green">
                <Users size={20} />
              </div>
              <div className="stat-meta">
                <span className="stat-value">{stats.studentRegistrations || 24}</span>
                <span className="stat-label">Student Registrations</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            2. CATEGORY PILLS & FILTERS TOOLBAR
            ============================================================ */}
        <section className="events-filter-toolbar">
          {/* Category Horizontal Pills */}
          <div className="events-category-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Search & Dropdown Filters */}
          <div className="events-search-filter-grid">
            <form onSubmit={handleSearchSubmit} className="events-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, titles, host names, or keywords..."
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchEvents();
                  }}
                  className="search-clear-btn"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="events-filter-dropdowns">
              {/* Domain Dropdown */}
              <div className="filter-select-wrapper">
                <Layers size={14} className="select-icon" />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="filter-select"
                  aria-label="Filter by Technical Domain"
                >
                  {DOMAINS.map((dm) => (
                    <option key={dm} value={dm}>
                      {dm}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Dropdown */}
              <div className="filter-select-wrapper">
                <Video size={14} className="select-icon" />
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="filter-select"
                  aria-label="Filter by Event Mode"
                >
                  <option value="All">All Modes</option>
                  <option value="Online">Online / Virtual</option>
                  <option value="In-person">In-Person Campus</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              {/* Price Dropdown */}
              <div className="filter-select-wrapper">
                <DollarSign size={14} className="select-icon" />
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="filter-select"
                  aria-label="Filter by Price"
                >
                  <option value="All">All Pricing</option>
                  <option value="Free">Free Admission</option>
                  <option value="Paid">Paid Only</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="filter-select-wrapper">
                <Filter size={14} className="select-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                  aria-label="Sort Events"
                >
                  <option value="soonest">Date: Soonest First</option>
                  <option value="latest">Date: Latest First</option>
                  <option value="popular">Most Registered</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(selectedCategory !== "All Events" ||
                selectedDomain !== "All Domains" ||
                selectedMode !== "All" ||
                selectedPrice !== "All" ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All Events");
                    setSelectedDomain("All Domains");
                    setSelectedMode("All");
                    setSelectedPrice("All");
                    setSearchQuery("");
                  }}
                  className="btn-reset-filters"
                  title="Reset all filters"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================
            3. FEATURED EVENT HERO BANNER (Horizontal Split Showcase)
            ============================================================ */}
        {featuredEvent && activeTab === "all" && !searchQuery && (
          <section className="events-featured-section">
            <div className="featured-banner-card">
              <div className="featured-content-col">
                <div className="featured-badge-row">
                  <span className="badge-featured-flag">
                    <Sparkles size={13} />
                    <span>FEATURED EVENT</span>
                  </span>
                  <span className="badge-category-pill">
                    {featuredEvent.category || featuredEvent.eventType || "Workshop"}
                  </span>
                  <span className="badge-mode-pill">
                    {featuredEvent.mode === "Online" ? (
                      <Video size={12} />
                    ) : (
                      <MapPin size={12} />
                    )}
                    <span>{featuredEvent.mode || "Online"}</span>
                  </span>
                  {featuredEvent.domain && (
                    <span className="badge-domain-pill">{featuredEvent.domain}</span>
                  )}
                </div>

                <h2
                  className="featured-title"
                  onClick={() => setSelectedEvent(featuredEvent)}
                >
                  {featuredEvent.title}
                </h2>

                <p className="featured-description">
                  {featuredEvent.shortDescription || featuredEvent.description}
                </p>

                {/* Key Spec Row */}
                <div className="featured-specs-row">
                  <div className="featured-spec-item">
                    <Calendar size={15} className="spec-icon text-red" />
                    <span>{formatFullDate(featuredEvent.date)}</span>
                  </div>
                  <div className="featured-spec-item">
                    <Clock size={15} className="spec-icon text-blue" />
                    <span>
                      {featuredEvent.time || `${featuredEvent.startTime} - ${featuredEvent.endTime}` || "3 Hours"}
                    </span>
                  </div>
                  <div className="featured-spec-item">
                    <MapPin size={15} className="spec-icon text-amber" />
                    <span>{featuredEvent.location || featuredEvent.venue || "Google Meet"}</span>
                  </div>
                  <div className="featured-spec-item">
                    <Users size={15} className="spec-icon text-green" />
                    <span>
                      {featuredEvent.attendees?.length || 0} / {featuredEvent.maxAttendees || 200} seats filled
                    </span>
                  </div>
                </div>

                {/* Host Info & Action Buttons */}
                <div className="featured-bottom-bar">
                  <div className="featured-host-card">
                    <img
                      src={getImageUrl(featuredEvent.createdBy?.avatar)}
                      alt={featuredEvent.createdBy?.name || "Alumni Organizer"}
                      className="host-avatar"
                    />
                    <div className="host-info">
                      <div className="host-name-row">
                        <span className="host-name">
                          {featuredEvent.createdBy?.name || "Senior Alumni Host"}
                        </span>
                        <ShieldCheck size={14} className="text-blue" title="Verified Alumni" />
                      </div>
                      <span className="host-title">
                        {featuredEvent.createdBy?.jobTitle
                          ? `${featuredEvent.createdBy.jobTitle} at ${featuredEvent.createdBy.company || "Tech"}`
                          : "Google Infrastructure Alumni"}
                      </span>
                    </div>
                  </div>

                  <div className="featured-action-buttons">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(featuredEvent)}
                      className="btn-view-details-featured"
                    >
                      <span>View Full Agenda</span>
                      <ArrowRight size={15} />
                    </button>

                    {isUserRegistered(featuredEvent) ? (
                      <button
                        type="button"
                        onClick={(e) => handleUnregister(featuredEvent, e)}
                        className="btn-registered-pill"
                        title="Click to cancel registration"
                      >
                        <CheckCircle size={15} />
                        <span>Registered</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleRegister(featuredEvent, e)}
                        className="btn-register-featured"
                        disabled={actionLoading === `register-${featuredEvent._id}`}
                      >
                        <Sparkles size={15} />
                        <span>Register Now (Free)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleShareEvent(featuredEvent, e)}
                      className="btn-icon-share"
                      title="Share Event"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Media Image */}
              <div
                className="featured-media-col"
                onClick={() => setSelectedEvent(featuredEvent)}
              >
                <img
                  src={getImageUrl(featuredEvent.bannerImage)}
                  alt={featuredEvent.title}
                  className="featured-image"
                />
                <div className="featured-image-overlay">
                  <span className="overlay-pill">
                    <Flame size={14} />
                    <span>High In-Demand</span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            4. EVENT DIRECTORY SECTION (Editorial Modern Rows)
            ============================================================ */}
        <section className="events-directory-section">
          <div className="directory-header-row">
            <div className="directory-title-group">
              <h3 className="directory-title">
                {activeTab === "my-events" ? "My Hosted Events" : "Upcoming Industry Sessions"}
              </h3>
              <span className="directory-count-badge">
                {displayedEvents.length} {displayedEvents.length === 1 ? "event" : "events"}
              </span>
            </div>

            {isAlumniOrAdmin && activeTab === "all" && (
              <button
                type="button"
                onClick={() => {
                  setEditModalEvent(null);
                  setCreateModalOpen(true);
                }}
                className="btn-quick-host-link"
              >
                <Plus size={14} />
                <span>Publish an Event</span>
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="events-skeleton-list">
              {[1, 2, 3].map((n) => (
                <div key={n} className="event-row-skeleton">
                  <div className="skeleton-date-box shimmer"></div>
                  <div className="skeleton-content-box">
                    <div className="skeleton-line shimmer w-25 mb-2"></div>
                    <div className="skeleton-line shimmer w-75 mb-3"></div>
                    <div className="skeleton-line shimmer w-50"></div>
                  </div>
                  <div className="skeleton-action-box shimmer"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {!loading && error && (
            <div className="events-error-box">
              <AlertCircle size={24} className="text-red" />
              <p>{error}</p>
              <button type="button" onClick={fetchEvents} className="btn-retry">
                <RotateCcw size={14} />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && displayedEvents.length === 0 && (
            <div className="events-empty-box">
              <div className="empty-icon-circle">
                <Calendar size={32} />
              </div>
              <h4 className="empty-title">No events found matching your criteria</h4>
              <p className="empty-description">
                {activeTab === "my-events"
                  ? "You haven't hosted any events yet. Share your technical expertise or career advice with students!"
                  : "Try clearing your search query or adjusting your domain and mode filters."}
              </p>
              {activeTab === "my-events" && isAlumniOrAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditModalEvent(null);
                    setCreateModalOpen(true);
                  }}
                  className="btn-create-event-primary mt-4"
                >
                  <Plus size={16} />
                  <span>Host Your First Event</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All Events");
                    setSelectedDomain("All Domains");
                    setSelectedMode("All");
                    setSelectedPrice("All");
                    setSearchQuery("");
                  }}
                  className="btn-retry mt-4"
                >
                  <span>View All Available Events</span>
                </button>
              )}
            </div>
          )}

          {/* Event Directory Rows */}
          {!loading && !error && displayedEvents.length > 0 && (
            <div className="events-directory-list">
              {displayedEvents.map((event) => {
                const dateParts = formatDateParts(event.date);
                const registered = isUserRegistered(event);
                const host = isEventHost(event);
                const maxAttendees = event.maxAttendees || 150;
                const registeredCount = event.attendees?.length || 0;
                const seatsRemaining = Math.max(0, maxAttendees - registeredCount);

                return (
                  <article
                    key={event._id}
                    className={`event-directory-item ${registered ? "is-registered" : ""}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Left: Date Block */}
                    <div className="event-date-block">
                      <span className="date-month">{dateParts.month}</span>
                      <span className="date-day">{dateParts.day}</span>
                      <span className="date-weekday">{dateParts.dayOfWeek}</span>
                    </div>

                    {/* Middle: Event Content & Organizer */}
                    <div className="event-main-content">
                      <div className="event-tag-strip">
                        <span className="event-category-badge">
                          {event.category || event.eventType || "Workshop"}
                        </span>
                        <span
                          className={`event-mode-tag ${
                            event.mode === "Online"
                              ? "tag-online"
                              : event.mode === "Hybrid"
                              ? "tag-hybrid"
                              : "tag-inperson"
                          }`}
                        >
                          {event.mode === "Online" ? (
                            <Video size={11} />
                          ) : (
                            <MapPin size={11} />
                          )}
                          <span>{event.mode || "Online"}</span>
                        </span>
                        {event.domain && (
                          <span className="event-domain-tag">{event.domain}</span>
                        )}
                        {event.priceType === "Paid" ? (
                          <span className="event-price-tag tag-paid">₹{event.price}</span>
                        ) : (
                          <span className="event-price-tag tag-free">FREE</span>
                        )}
                      </div>

                      <h4 className="event-item-title">{event.title}</h4>

                      <p className="event-item-snippet">
                        {event.shortDescription ||
                          (event.description && event.description.slice(0, 140) + "...")}
                      </p>

                      {/* Organizer Row */}
                      <div className="event-organizer-row">
                        <img
                          src={getImageUrl(event.createdBy?.avatar)}
                          alt={event.createdBy?.name || "Organizer"}
                          className="organizer-avatar-sm"
                        />
                        <div className="organizer-meta-sm">
                          <div className="organizer-name-line">
                            <span className="organizer-name">
                              {event.createdBy?.name || "Verified Alumni Organizer"}
                            </span>
                            <ShieldCheck size={13} className="text-blue" />
                          </div>
                          <span className="organizer-role">
                            {event.createdBy?.jobTitle
                              ? `${event.createdBy.jobTitle}${
                                  event.createdBy.company ? ` • ${event.createdBy.company}` : ""
                                }`
                              : "GradConnect Alumni Network"}
                          </span>
                        </div>
                      </div>

                      {/* Topic Tags */}
                      {event.topics && event.topics.length > 0 && (
                        <div className="event-topics-cloud">
                          {event.topics.slice(0, 4).map((t, idx) => (
                            <span key={idx} className="topic-pill">
                              #{t}
                            </span>
                          ))}
                          {event.topics.length > 4 && (
                            <span className="topic-pill-more">
                              +{event.topics.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Meta & Actions */}
                    <div
                      className="event-actions-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="event-quick-specs">
                        <div className="quick-spec-line">
                          <Clock size={13} className="text-muted" />
                          <span>
                            {event.time ||
                              (event.startTime && `${event.startTime} - ${event.endTime}`) ||
                              event.duration ||
                              "10:00 AM"}
                          </span>
                        </div>
                        <div className="quick-spec-line">
                          <MapPin size={13} className="text-muted" />
                          <span className="spec-venue-text" title={event.location || event.venue}>
                            {event.location || event.venue || "Virtual Link Provided"}
                          </span>
                        </div>
                        <div className="quick-spec-line">
                          <Users size={13} className="text-muted" />
                          <span>
                            <strong className="text-dark">{seatsRemaining}</strong> seats left
                            <span className="seats-total"> of {maxAttendees}</span>
                          </span>
                        </div>
                      </div>

                      {/* Primary Action Button */}
                      <div className="event-button-group">
                        {host ? (
                          <div className="host-management-cluster">
                            <button
                              type="button"
                              onClick={(e) => handleOpenParticipants(event, e)}
                              className="btn-manage-participants"
                              title="View registered attendees"
                            >
                              <Users size={14} />
                              <span>Attendees ({registeredCount})</span>
                            </button>

                            <div className="host-icon-actions">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditModalEvent(event);
                                  setCreateModalOpen(true);
                                }}
                                className="btn-icon-edit"
                                title="Edit Event Details"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteEvent(event, e)}
                                className="btn-icon-delete"
                                title="Delete Event"
                                disabled={actionLoading === `delete-${event._id}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ) : registered ? (
                          <div className="registered-actions-cluster">
                            <button
                              type="button"
                              onClick={() => setSelectedEvent(event)}
                              className="btn-registered-status"
                            >
                              <CheckCircle size={14} />
                              <span>✓ Registered</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleUnregister(event, e)}
                              className="btn-cancel-reg-text"
                              disabled={actionLoading === `unregister-${event._id}`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleRegister(event, e)}
                            className="btn-register-directory"
                            disabled={
                              seatsRemaining <= 0 || actionLoading === `register-${event._id}`
                            }
                          >
                            <span>
                              {seatsRemaining <= 0 ? "Registration Full" : "Quick Register"}
                            </span>
                            <ArrowRight size={14} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/events/${event.slug || event._id}`)}
                          className="btn-view-details-text"
                          title="View dedicated event page"
                        >
                          <span>Full Overview</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ============================================================
          5. EVENT DETAILS DRAWER / MODAL
          ============================================================ */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="modal-backdrop" onClick={() => setSelectedEvent(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="event-details-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Banner Header */}
              <div className="modal-banner-wrapper">
                <img
                  src={getImageUrl(selectedEvent.bannerImage)}
                  alt={selectedEvent.title}
                  className="modal-banner-img"
                />
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="modal-close-icon-btn"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>

                <div className="modal-banner-overlay">
                  <div className="modal-badges-row">
                    <span className="modal-category-badge">
                      {selectedEvent.category || selectedEvent.eventType || "Workshop"}
                    </span>
                    <span className="modal-mode-badge">
                      {selectedEvent.mode === "Online" ? (
                        <Video size={13} />
                      ) : (
                        <MapPin size={13} />
                      )}
                      <span>{selectedEvent.mode || "Online"}</span>
                    </span>
                    {selectedEvent.domain && (
                      <span className="modal-domain-badge">{selectedEvent.domain}</span>
                    )}
                    <span className="modal-status-badge">
                      {selectedEvent.status || "Open for Registration"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="modal-content-body">
                <h2 className="modal-event-title">{selectedEvent.title}</h2>

                {/* Organizer Card in Modal */}
                <div className="modal-organizer-box">
                  <img
                    src={getImageUrl(selectedEvent.createdBy?.avatar)}
                    alt={selectedEvent.createdBy?.name || "Host"}
                    className="modal-organizer-avatar"
                  />
                  <div className="modal-organizer-text">
                    <div className="organizer-title-flex">
                      <h4 className="organizer-fullname">
                        {selectedEvent.createdBy?.name || "Senior Alumni Leader"}
                      </h4>
                      <span className="alumni-badge-pill">
                        <ShieldCheck size={13} />
                        <span>Verified Alumni</span>
                      </span>
                    </div>
                    <p className="organizer-position">
                      {selectedEvent.createdBy?.jobTitle
                        ? `${selectedEvent.createdBy.jobTitle} at ${
                            selectedEvent.createdBy.company || "GradConnect"
                          }`
                        : "Senior Industry Mentor"}
                      {selectedEvent.createdBy?.department && (
                        <span> • Dept: {selectedEvent.createdBy.department}</span>
                      )}
                      {selectedEvent.createdBy?.batch && (
                        <span> • Class of {selectedEvent.createdBy.batch}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Structured Specs Grid */}
                <div className="modal-specs-grid">
                  <div className="spec-tile">
                    <div className="spec-tile-icon text-red">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="spec-tile-label">Date & Day</span>
                      <strong className="spec-tile-value">
                        {formatFullDate(selectedEvent.date)}
                      </strong>
                    </div>
                  </div>

                  <div className="spec-tile">
                    <div className="spec-tile-icon text-blue">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="spec-tile-label">Time & Duration</span>
                      <strong className="spec-tile-value">
                        {selectedEvent.time ||
                          `${selectedEvent.startTime || "10:00 AM"} - ${
                            selectedEvent.endTime || "1:00 PM"
                          }`}
                      </strong>
                    </div>
                  </div>

                  <div className="spec-tile">
                    <div className="spec-tile-icon text-amber">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="spec-tile-label">Platform / Venue</span>
                      <strong className="spec-tile-value">
                        {selectedEvent.location || selectedEvent.venue || "Google Meet"}
                      </strong>
                    </div>
                  </div>

                  <div className="spec-tile">
                    <div className="spec-tile-icon text-green">
                      <Users size={18} />
                    </div>
                    <div>
                      <span className="spec-tile-label">Capacity & Seats</span>
                      <strong className="spec-tile-value">
                        {selectedEvent.attendees?.length || 0} /{" "}
                        {selectedEvent.maxAttendees || 200} filled
                      </strong>
                    </div>
                  </div>
                </div>

                {/* About This Event */}
                <div className="modal-section-block">
                  <h4 className="modal-section-heading">
                    <FileText size={16} />
                    <span>About This Event</span>
                  </h4>
                  <div className="modal-description-text">
                    {selectedEvent.description
                      ? selectedEvent.description.split("\n").map((para, i) => (
                          <p key={i} className="description-paragraph">
                            {para}
                          </p>
                        ))
                      : "No detailed description provided."}
                  </div>
                </div>

                {/* Agenda Timeline */}
                {selectedEvent.agenda && selectedEvent.agenda.length > 0 && (
                  <div className="modal-section-block">
                    <h4 className="modal-section-heading">
                      <Clock size={16} />
                      <span>Event Schedule &amp; Agenda</span>
                    </h4>
                    <div className="agenda-timeline">
                      {selectedEvent.agenda.map((item, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-time-badge">{item.time}</div>
                          <div className="timeline-activity">{item.activity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics Covered */}
                {selectedEvent.topics && selectedEvent.topics.length > 0 && (
                  <div className="modal-section-block">
                    <h4 className="modal-section-heading">
                      <Tag size={16} />
                      <span>Key Skills &amp; Topics Covered</span>
                    </h4>
                    <div className="modal-topics-row">
                      {selectedEvent.topics.map((t, idx) => (
                        <span key={idx} className="modal-topic-chip">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility Criteria */}
                {selectedEvent.eligibility && (
                  <div className="modal-section-block">
                    <h4 className="modal-section-heading">
                      <GraduationCap size={16} />
                      <span>Eligibility &amp; Target Audience</span>
                    </h4>
                    <div className="eligibility-alert-box">
                      <ShieldCheck size={16} className="text-blue flex-shrink-0" />
                      <span>{selectedEvent.eligibility}</span>
                    </div>
                  </div>
                )}

                {/* Online Link if Registered */}
                {isUserRegistered(selectedEvent) && selectedEvent.onlineLink && (
                  <div className="meeting-link-box">
                    <Video size={18} className="text-green" />
                    <div className="meeting-link-meta">
                      <span className="link-label">Your Live Event Access Link:</span>
                      <a
                        href={selectedEvent.onlineLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meeting-url-link"
                      >
                        {selectedEvent.onlineLink}
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer-bar">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="btn-modal-cancel"
                >
                  Close
                </button>

                <div className="modal-footer-actions">
                  <button
                    type="button"
                    onClick={() => {
                      const ev = selectedEvent;
                      setSelectedEvent(null);
                      navigate(`/events/${ev.slug || ev._id}`);
                    }}
                    className="btn-modal-share"
                    title="Open dedicated page view"
                  >
                    <ExternalLink size={15} />
                    <span>Open Full Page</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleShareEvent(selectedEvent, e)}
                    className="btn-modal-share"
                  >
                    <Share2 size={15} />
                    <span>{shareCopied ? "Copied Link!" : "Share"}</span>
                  </button>

                  {isEventHost(selectedEvent) ? (
                    <div className="host-footer-btn-group">
                      <button
                        type="button"
                        onClick={(e) => {
                          const ev = selectedEvent;
                          setSelectedEvent(null);
                          handleOpenParticipants(ev, e);
                        }}
                        className="btn-footer-participants"
                      >
                        <Users size={15} />
                        <span>Manage Attendees ({selectedEvent.attendees?.length || 0})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const ev = selectedEvent;
                          setSelectedEvent(null);
                          setEditModalEvent(ev);
                          setCreateModalOpen(true);
                        }}
                        className="btn-footer-edit"
                      >
                        <Edit3 size={15} />
                        <span>Edit Event</span>
                      </button>
                    </div>
                  ) : isUserRegistered(selectedEvent) ? (
                    <div className="registered-footer-group">
                      <span className="registered-indicator">
                        <CheckCircle size={16} className="text-green" />
                        <span>You are registered for this event</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleUnregister(selectedEvent, e)}
                        className="btn-footer-cancel-reg"
                        disabled={actionLoading === `unregister-${selectedEvent._id}`}
                      >
                        Cancel Registration
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRegister(selectedEvent, e)}
                      className="btn-modal-register-primary"
                      disabled={
                        actionLoading === `register-${selectedEvent._id}` ||
                        (selectedEvent.maxAttendees &&
                          (selectedEvent.attendees?.length || 0) >= selectedEvent.maxAttendees)
                      }
                    >
                      <Sparkles size={16} />
                      <span>
                        {selectedEvent.maxAttendees &&
                        (selectedEvent.attendees?.length || 0) >= selectedEvent.maxAttendees
                          ? "Registration Full"
                          : "Confirm My Registration"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          6. CREATE & EDIT EVENT MODAL (Alumni & Admin only)
          ============================================================ */}
      <AnimatePresence>
        {createModalOpen && (
          <EventFormModal
            event={editModalEvent}
            onClose={() => {
              setCreateModalOpen(false);
              setEditModalEvent(null);
            }}
            onSuccess={(savedEvent, isEdit) => {
              setCreateModalOpen(false);
              setEditModalEvent(null);
              fetchEvents();
              showToast(
                isEdit ? "Event updated successfully!" : "Event published successfully!",
                "success"
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* ============================================================
          7. MANAGE PARTICIPANTS MODAL (Alumni host & Admin)
          ============================================================ */}
      <AnimatePresence>
        {participantsModalEvent && (
          <div
            className="modal-backdrop"
            onClick={() => setParticipantsModalEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="participants-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="participants-modal-header">
                <div>
                  <div className="participants-eyebrow">
                    <Users size={14} />
                    <span>REGISTERED ATTENDEES</span>
                  </div>
                  <h3 className="participants-modal-title">
                    {participantsModalEvent.title}
                  </h3>
                  <p className="participants-modal-subtitle">
                    {participantsList.length} of {participantsModalEvent.maxAttendees || 200}{" "}
                    seats filled
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setParticipantsModalEvent(null)}
                  className="modal-close-icon-btn"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="participants-modal-toolbar">
                <button
                  type="button"
                  onClick={handleCopyAttendeeEmails}
                  className="btn-copy-emails"
                  disabled={!participantsList.length}
                >
                  {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedEmail ? "Emails Copied!" : "Copy All Attendee Emails"}</span>
                </button>
              </div>

              <div className="participants-modal-body">
                {participantsLoading ? (
                  <div className="participants-loading-state">
                    <Sparkles size={24} className="shimmer text-blue" />
                    <span>Loading attendee directory...</span>
                  </div>
                ) : participantsList.length === 0 ? (
                  <div className="participants-empty-state">
                    <Users size={32} className="text-muted" />
                    <h4>No students registered yet</h4>
                    <p>When students apply or register, their profile details will appear here.</p>
                  </div>
                ) : (
                  <div className="participants-list">
                    {participantsList.map((p, idx) => (
                      <div key={p._id || idx} className="participant-item-row">
                        <img
                          src={getImageUrl(p.avatar)}
                          alt={p.name || "Student"}
                          className="participant-avatar"
                        />
                        <div className="participant-info">
                          <div className="participant-name-row">
                            <strong className="participant-name">{p.name}</strong>
                            <span className="participant-badge">
                              {p.userType || p.role || "Student"}
                            </span>
                          </div>
                          <span className="participant-email">{p.email}</span>
                          {(p.department || p.batch || p.college) && (
                            <span className="participant-academic">
                              {p.department} {p.batch ? `• Batch of ${p.batch}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="participants-modal-footer">
                <button
                  type="button"
                  onClick={() => setParticipantsModalEvent(null)}
                  className="btn-modal-cancel"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

// ============================================================
// COMPONENT: EventFormModal (Create / Edit Modal)
// ============================================================
const EventFormModal = ({ event, onClose, onSuccess }) => {
  const isEdit = Boolean(event && event._id);

  const [formData, setFormData] = useState({
    title: event?.title || "",
    shortDescription: event?.shortDescription || "",
    description: event?.description || "",
    category: event?.category || event?.eventType || "Technical Workshop",
    domain: event?.domain || "Cloud Architecture",
    date: event?.date ? new Date(event.date).toISOString().slice(0, 10) : "",
    startTime: event?.startTime || "10:00 AM",
    endTime: event?.endTime || "1:00 PM",
    duration: event?.duration || "3 Hours",
    mode: event?.mode || "Online",
    venue: event?.venue || event?.location || "Google Meet",
    onlineLink: event?.onlineLink || "",
    city: event?.city || "",
    address: event?.address || "",
    price: event?.price || 0,
    maxAttendees: event?.maxAttendees || 150,
    eligibility:
      event?.eligibility || "Open to all engineering & technology students and alumni",
    topics: event?.topics ? event.topics.join(", ") : "",
    bannerImage: event?.bannerImage || "",
    featured: event?.featured || false,
  });

  const [agendaItems, setAgendaItems] = useState(() => {
    if (event?.agenda && event.agenda.length > 0) {
      return event.agenda;
    }
    return [
      { time: "10:00 AM - 10:30 AM", activity: "Introduction & Architecture Overview" },
      { time: "10:30 AM - 12:00 PM", activity: "Hands-on Technical Deep Dive & Demo" },
      { time: "12:00 PM - 01:00 PM", activity: "Interactive Q&A & Career Guidance" },
    ];
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(event?.bannerImage || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleAgendaChange = (index, field, value) => {
    setAgendaItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleAddAgendaRow = () => {
    setAgendaItems((prev) => [
      ...prev,
      { time: "Time Slot", activity: "Activity description" },
    ]);
  };

  const handleRemoveAgendaRow = (index) => {
    setAgendaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.date) {
      setErrorMsg("Please fill in the Event Title, Description, and Event Date.");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();

      data.append("title", formData.title.trim());
      data.append("shortDescription", formData.shortDescription.trim());
      data.append("description", formData.description.trim());
      data.append("category", formData.category);
      data.append("eventType", formData.category);
      data.append("domain", formData.domain);
      data.append("date", formData.date);
      data.append("startTime", formData.startTime);
      data.append("endTime", formData.endTime);
      data.append("time", `${formData.startTime} - ${formData.endTime}`);
      data.append("duration", formData.duration);
      data.append("mode", formData.mode);
      data.append("venue", formData.venue);
      data.append("location", formData.venue);
      data.append("onlineLink", formData.onlineLink);
      data.append("city", formData.city);
      data.append("address", formData.address);
      data.append("price", Number(formData.price) || 0);
      data.append("maxAttendees", Number(formData.maxAttendees) || 150);
      data.append("eligibility", formData.eligibility);
      data.append("featured", formData.featured);

      // Parse topics
      const parsedTopics = formData.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      data.append("topics", JSON.stringify(parsedTopics));

      // Filter valid agenda
      const validAgenda = agendaItems.filter((a) => a.time.trim() && a.activity.trim());
      data.append("agenda", JSON.stringify(validAgenda));

      if (bannerFile) {
        data.append("bannerImage", bannerFile);
      } else if (formData.bannerImage) {
        data.append("bannerImage", formData.bannerImage);
      }

      let res;
      if (isEdit) {
        res = await API.put(`/events/${event._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await API.post("/events", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      onSuccess(res.data.event, isEdit);
    } catch (err) {
      console.error("Save Event Error:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to save event. Please check inputs and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="event-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="event-form-header">
          <div>
            <div className="form-eyebrow">
              <CalendarCheck size={14} />
              <span>ALUMNI INDUSTRY HOSTING</span>
            </div>
            <h3 className="form-title">
              {isEdit ? "Edit Industry Event" : "Host a New Industry Event"}
            </h3>
            <p className="form-subtitle">
              Publish structured workshops, webinars, and meetups for GradConnect students.
            </p>
          </div>
          <button type="button" onClick={onClose} className="modal-close-icon-btn">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="form-error-banner">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="event-form-body">
          {/* Section 1: Basic Information */}
          <div className="form-section">
            <h4 className="section-title">
              <Sparkles size={16} />
              <span>Basic Information</span>
            </h4>

            <div className="form-group mb-3">
              <label className="form-label">
                Event Title <span className="text-red">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Masterclass: Production Kubernetes & Cloud Scaling"
                className="form-input"
                required
              />
            </div>

            <div className="form-row-2 mb-3">
              <div className="form-group">
                <label className="form-label">Category / Format</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Technical Workshop">Technical Workshop</option>
                  <option value="Career Bootcamp">Career Bootcamp</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Alumni Webinar">Alumni Webinar</option>
                  <option value="Mentorship Session">Mentorship Session</option>
                  <option value="Panel Discussion">Panel Discussion</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Technical Domain</label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="form-select"
                >
                  {DOMAINS.filter((d) => d !== "All Domains").map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Short Summary (1-2 sentences)</label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="Brief takeaway hook that appears in directory cards..."
                className="form-input"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">
                Full Event Description <span className="text-red">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Detail what will be covered, practical demos, learning outcomes, and prerequisites..."
                className="form-textarea"
                required
              />
            </div>
          </div>

          {/* Section 2: Schedule & Format */}
          <div className="form-section">
            <h4 className="section-title">
              <Clock size={16} />
              <span>Schedule &amp; Mode</span>
            </h4>

            <div className="form-row-3 mb-3">
              <div className="form-group">
                <label className="form-label">
                  Event Date <span className="text-red">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="text"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  placeholder="e.g. 10:00 AM IST"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time / Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g. 2.5 Hours"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row-2 mb-3">
              <div className="form-group">
                <label className="form-label">Event Mode</label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Online">Online / Virtual</option>
                  <option value="In-person">In-Person Campus</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Venue / Platform</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g. Google Meet, Zoom Room 3, or Auditorium Hall"
                  className="form-input"
                />
              </div>
            </div>

            {formData.mode !== "In-person" && (
              <div className="form-group mb-3">
                <label className="form-label">Online Access Link (Google Meet / Zoom URL)</label>
                <input
                  type="url"
                  name="onlineLink"
                  value={formData.onlineLink}
                  onChange={handleChange}
                  placeholder="https://meet.google.com/xyz-abc-def"
                  className="form-input"
                />
              </div>
            )}
          </div>

          {/* Section 3: Capacity & Pricing */}
          <div className="form-section">
            <h4 className="section-title">
              <Users size={16} />
              <span>Capacity, Pricing &amp; Eligibility</span>
            </h4>

            <div className="form-row-2 mb-3">
              <div className="form-group">
                <label className="form-label">Max Capacity (Seats)</label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  min={1}
                  max={1000}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admission Price (0 for Free)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min={0}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Eligibility &amp; Target Audience</label>
              <input
                type="text"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                placeholder="e.g. Open to 3rd & 4th year students, graduate scholars"
                className="form-input"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Topic Tags (comma separated)</label>
              <input
                type="text"
                name="topics"
                value={formData.topics}
                onChange={handleChange}
                placeholder="Kubernetes, Microservices, Docker, Cloud"
                className="form-input"
              />
            </div>
          </div>

          {/* Section 4: Agenda Timeline Builder */}
          <div className="form-section">
            <div className="section-header-flex">
              <h4 className="section-title">
                <Clock size={16} />
                <span>Event Schedule &amp; Agenda</span>
              </h4>
              <button
                type="button"
                onClick={handleAddAgendaRow}
                className="btn-add-agenda"
              >
                <Plus size={13} />
                <span>Add Time Slot</span>
              </button>
            </div>

            <div className="agenda-builder-list">
              {agendaItems.map((item, idx) => (
                <div key={idx} className="agenda-builder-row">
                  <input
                    type="text"
                    value={item.time}
                    onChange={(e) => handleAgendaChange(idx, "time", e.target.value)}
                    placeholder="10:00 AM - 10:45 AM"
                    className="agenda-time-input"
                  />
                  <input
                    type="text"
                    value={item.activity}
                    onChange={(e) => handleAgendaChange(idx, "activity", e.target.value)}
                    placeholder="Topic / session activity description"
                    className="agenda-activity-input"
                  />
                  {agendaItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAgendaRow(idx)}
                      className="btn-remove-agenda"
                      title="Remove row"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Banner Image */}
          <div className="form-section">
            <h4 className="section-title">
              <UploadCloud size={16} />
              <span>Event Cover Banner</span>
            </h4>

            <div className="banner-uploader-box">
              {bannerPreview ? (
                <div className="banner-preview-wrapper">
                  <img src={getImageUrl(bannerPreview)} alt="Preview" className="preview-img" />
                  <label className="btn-change-banner">
                    Change Banner
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden-file-input"
                    />
                  </label>
                </div>
              ) : (
                <label className="banner-dropzone">
                  <UploadCloud size={32} className="dropzone-icon" />
                  <span className="dropzone-text">Click to upload high-res event banner</span>
                  <span className="dropzone-sub">PNG, JPG, WEBP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden-file-input"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="event-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-cancel"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create-event-primary"
              disabled={submitting}
            >
              {submitting ? (
                <span>Publishing Event...</span>
              ) : isEdit ? (
                <span>Save Changes</span>
              ) : (
                <span>Publish Industry Event</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Events;
