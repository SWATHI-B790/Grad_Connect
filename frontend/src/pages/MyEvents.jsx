import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Edit3,
  Trash2,
  Sparkles,
  Search,
  Filter,
  Layers,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Building,
  Info,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { getImageUrl } from "../utils/getImageUrl";

const MyEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const defaultTab = searchParams.get("tab") || (isAlumniOrAdmin ? "hosted" : "registrations");
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [hostedEvents, setHostedEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Unlocked access map for registered events
  const [accessDataMap, setAccessDataMap] = useState({});
  const [loadingAccessId, setLoadingAccessId] = useState(null);

  const showToast = (message, type = "success") => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type },
      })
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [];
      if (isAlumniOrAdmin) {
        promises.push(API.get("/events/my-events"));
      } else {
        promises.push(Promise.resolve({ data: { events: [] } }));
      }
      promises.push(API.get("/events/my-registrations"));

      const [hostedRes, regRes] = await Promise.all(promises);

      if (hostedRes?.data?.events) {
        setHostedEvents(hostedRes.data.events);
      }
      if (regRes?.data?.registrations) {
        setRegistrations(regRes.data.registrations);
      }
    } catch (err) {
      console.error("Failed to load user events:", err);
      setError("Unable to load event data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch access details for an approved registered event
  const handleUnlockAccess = async (eventId) => {
    if (accessDataMap[eventId]) return;
    setLoadingAccessId(eventId);
    try {
      const res = await API.get(`/events/${eventId}/access`);
      if (res.data?.accessGranted) {
        setAccessDataMap((prev) => ({ ...prev, [eventId]: res.data }));
      }
    } catch (err) {
      console.error("Error fetching access details:", err);
      showToast(err.response?.data?.message || "Could not retrieve access pass.", "error");
    } finally {
      setLoadingAccessId(null);
    }
  };

  // Cancel registration
  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm("Are you sure you want to cancel this event registration?")) {
      return;
    }
    setActionLoading(eventId);
    try {
      await API.post(`/events/${eventId}/unregister`);
      showToast("Registration cancelled successfully.");
      fetchData();
    } catch (err) {
      console.error("Error cancelling registration:", err);
      showToast(err.response?.data?.message || "Failed to cancel registration.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete hosted event
  const handleDeleteHostedEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setActionLoading(eventId);
    try {
      await API.delete(`/events/${eventId}`);
      showToast("Event deleted successfully.");
      setHostedEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err) {
      console.error("Error deleting event:", err);
      showToast(err.response?.data?.message || "Failed to delete event.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter hosted events
  const filteredHostedEvents = useMemo(() => {
    return hostedEvents.filter((ev) => {
      const matchesSearch =
        ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.category?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "PENDING") return ev.status === "PENDING_ADMIN_APPROVAL";
      if (statusFilter === "APPROVED") return ["APPROVED", "PUBLISHED", "Upcoming", "Open for Registration"].includes(ev.status);
      if (statusFilter === "REJECTED") return ev.status === "REJECTED";
      if (statusFilter === "CANCELLED") return ev.status === "CANCELLED";
      return true;
    });
  }, [hostedEvents, searchQuery, statusFilter]);

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const ev = reg.event;
      if (!ev) return false;
      const matchesSearch =
        ev.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.category?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "PENDING") return reg.status === "PENDING";
      if (statusFilter === "APPROVED") return ["APPROVED", "REGISTERED", "ATTENDED"].includes(reg.status);
      if (statusFilter === "REJECTED") return reg.status === "REJECTED";
      return true;
    });
  }, [registrations, searchQuery, statusFilter]);

  return (
    <div className="events-page-root">
      <Toast />

      <div className="events-main-container" style={{ maxWidth: "1200px", paddingTop: "calc(76px + 32px)", minHeight: "80vh" }}>
        {/* Page Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", backgroundColor: "rgba(220, 38, 38, 0.08)", color: "var(--primary-color)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <Sparkles size={13} />
              <span>Personal Event Hub</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.25rem", fontWeight: 800, color: "var(--dark-color)", margin: "0 0 0.5rem" }}>
              My Events & Registrations
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0, maxWidth: "600px" }}>
              Monitor your event proposals, review participant applications, and access exclusive passes for confirmed sessions.
            </p>
          </div>

          {isAlumniOrAdmin && (
            <Link
              to="/events/create"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.85rem 1.5rem",
                borderRadius: "10px",
                backgroundColor: "var(--primary-color)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)",
              }}
            >
              <Plus size={18} />
              <span>Host New Event</span>
            </Link>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "1rem", borderBottom: "2px solid var(--border-color)", marginBottom: "2rem" }}>
          {isAlumniOrAdmin && (
            <button
              type="button"
              onClick={() => handleTabChange("hosted")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.25rem",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "1rem",
                color: activeTab === "hosted" ? "var(--primary-color)" : "var(--text-muted)",
                borderBottom: activeTab === "hosted" ? "3px solid var(--primary-color)" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <Building size={18} />
              <span>Hosted Events</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: activeTab === "hosted" ? "rgba(220, 38, 38, 0.1)" : "#f1f5f9",
                  color: activeTab === "hosted" ? "var(--primary-color)" : "#64748b",
                  fontWeight: 800,
                }}
              >
                {hostedEvents.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleTabChange("registrations")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0.75rem 1.25rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "1rem",
              color: activeTab === "registrations" ? "var(--primary-color)" : "var(--text-muted)",
              borderBottom: activeTab === "registrations" ? "3px solid var(--primary-color)" : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s ease",
            }}
          >
            <UserCheck size={18} />
            <span>My Registrations</span>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "12px",
                backgroundColor: activeTab === "registrations" ? "rgba(220, 38, 38, 0.1)" : "#f1f5f9",
                color: activeTab === "registrations" ? "var(--primary-color)" : "#64748b",
                fontWeight: 800,
              }}
            >
              {registrations.length}
            </span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.75rem",
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "420px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder={`Search in ${activeTab === "hosted" ? "hosted events" : "registrations"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 1rem 0.65rem 2.4rem",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--card-bg, #ffffff)",
                color: "var(--text-main)",
                fontSize: "0.9rem",
              }}
            />
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All" },
              { id: "PENDING", label: activeTab === "hosted" ? "Under Review" : "Pending Approval" },
              { id: "APPROVED", label: activeTab === "hosted" ? "Live / Approved" : "Confirmed" },
              { id: "REJECTED", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: statusFilter === f.id ? "1px solid var(--primary-color)" : "1px solid var(--border-color)",
                  backgroundColor: statusFilter === f.id ? "rgba(220, 38, 38, 0.08)" : "var(--card-bg, #ffffff)",
                  color: statusFilter === f.id ? "var(--primary-color)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div className="spinner" style={{ margin: "0 auto 1rem" }} />
            <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Loading events...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#991b1b", textAlign: "center" }}>
            <AlertCircle size={24} style={{ margin: "0 auto 0.5rem" }} />
            <p style={{ margin: 0, fontWeight: 700 }}>{error}</p>
            <button onClick={fetchData} style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "6px", backgroundColor: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>
              Try Again
            </button>
          </div>
        ) : activeTab === "hosted" ? (
          /* =========================================================================
             TAB 1: HOSTED EVENTS (ALUMNI & ADMIN MODERATION VIEW)
             ========================================================================= */
          filteredHostedEvents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                backgroundColor: "var(--card-bg, #ffffff)",
                border: "1px dashed var(--border-color)",
                borderRadius: "16px",
              }}
            >
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(220, 38, 38, 0.08)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Calendar size={28} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                No Hosted Events Found
              </h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem", fontSize: "0.9rem" }}>
                {statusFilter !== "ALL"
                  ? `You do not have any hosted events matching the "${statusFilter}" status filter.`
                  : "You haven't hosted any events yet. Share your industry experience by organizing a session for students!"}
              </p>
              <Link
                to="/events/create"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--primary-color)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                }}
              >
                <Plus size={16} /> Create Your First Event
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {filteredHostedEvents.map((ev) => {
                const isPending = ev.status === "PENDING_ADMIN_APPROVAL";
                const isApproved = ["APPROVED", "PUBLISHED", "Upcoming", "Open for Registration"].includes(ev.status);
                const isRejected = ev.status === "REJECTED";
                const isCancelled = ev.status === "CANCELLED";

                const cap = ev.capacity || ev.maxAttendees || 100;
                const approvedCount = ev.approvedCount || (ev.attendees ? ev.attendees.length : 0);
                const pendingCount = ev.pendingCount || 0;
                const percentFilled = Math.min(100, Math.round((approvedCount / cap) * 100));

                return (
                  <div
                    key={ev._id}
                    style={{
                      backgroundColor: "var(--card-bg, #ffffff)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    {/* Event Banner & Top Info */}
                    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem", padding: "1.5rem" }}>
                      {/* Banner / Poster */}
                      <div
                        style={{
                          position: "relative",
                          height: "160px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          backgroundColor: "#1e293b",
                        }}
                      >
                        {ev.bannerImage || ev.banner ? (
                          <img
                            src={getImageUrl(ev.bannerImage || ev.banner)}
                            alt={ev.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "#94a3b8" }}>
                            <Layers size={36} />
                          </div>
                        )}
                        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(15, 23, 42, 0.8)",
                              color: "#ffffff",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            {ev.category}
                          </span>
                        </div>
                      </div>

                      {/* Main Details */}
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          {/* Status and Mode Pill */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                            {isPending && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "3px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fef3c7",
                                  color: "#b45309",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                <Clock size={13} /> Under Admin Review
                              </span>
                            )}
                            {isApproved && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "3px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#f0fdf4",
                                  color: "#16a34a",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                <CheckCircle size={13} /> Live & Approved
                              </span>
                            )}
                            {isRejected && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "3px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fef2f2",
                                  color: "#dc2626",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                <XCircle size={13} /> Rejected by Admin
                              </span>
                            )}
                            {isCancelled && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "3px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#f1f5f9",
                                  color: "#64748b",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                <AlertCircle size={13} /> Cancelled
                              </span>
                            )}

                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(37, 99, 235, 0.08)",
                                color: "#2563eb",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                              }}
                            >
                              {ev.mode === "Online" ? <Video size={12} /> : <MapPin size={12} />}
                              <span>{ev.mode}</span>
                            </span>

                            {ev.domain && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                                • {ev.domain}
                              </span>
                            )}
                          </div>

                          {/* Event Title */}
                          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 0.5rem" }}>
                            {ev.title}
                          </h2>

                          {/* Metadata row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <Calendar size={15} style={{ color: "#2563eb" }} />
                              {new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <Clock size={15} style={{ color: "#d97706" }} />
                              {ev.startTime ? `${ev.startTime} - ${ev.endTime || ""}` : ev.time || "10:00 AM"}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              {ev.mode === "Online" ? (
                                <>
                                  <Video size={15} style={{ color: "#16a34a" }} />
                                  <span>{ev.meetingPlatform || "Google Meet"}</span>
                                </>
                              ) : (
                                <>
                                  <MapPin size={15} style={{ color: "#dc2626" }} />
                                  <span>{ev.venueName || ev.venue || "Campus Venue"}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Capacity and Registration Telemetry */}
                        <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem", fontSize: "0.8rem", fontWeight: 700 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span>Attendee Capacity:</span>
                              <span style={{ color: "#0f172a", fontWeight: 800 }}>
                                {approvedCount} / {cap} Confirmed Seats ({percentFilled}%)
                              </span>
                            </div>

                            {pendingCount > 0 && (
                              <span
                                style={{
                                  backgroundColor: "#fef3c7",
                                  color: "#b45309",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                {pendingCount} Pending Review
                              </span>
                            )}
                          </div>

                          <div style={{ height: "6px", backgroundColor: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${percentFilled}%`,
                                backgroundColor: percentFilled >= 100 ? "#dc2626" : percentFilled > 75 ? "#ea580c" : "#2563eb",
                                borderRadius: "999px",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rejection Alert Banner (if event rejected by admin) */}
                    {isRejected && (
                      <div
                        style={{
                          margin: "0 1.5rem 1rem",
                          padding: "1rem",
                          backgroundColor: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#991b1b", fontSize: "0.875rem" }}>
                          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                          <div>
                            <strong>Admin Feedback: </strong>
                            <span>{ev.rejectionReason || "Please review event details and resubmit."}</span>
                          </div>
                        </div>

                        <Link
                          to={`/events/edit/${ev._id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            backgroundColor: "#dc2626",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Edit3 size={14} /> Edit & Resubmit
                        </Link>
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div
                      style={{
                        padding: "1rem 1.5rem",
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Link
                          to={`/events/${ev._id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textDecoration: "none",
                          }}
                        >
                          <span>Public Page</span>
                          <ExternalLink size={14} />
                        </Link>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {/* Manage Attendees (Tier 2 Moderation) */}
                        <Link
                          to={`/events/${ev._id}/registrations`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "0.55rem 1.1rem",
                            borderRadius: "8px",
                            backgroundColor: pendingCount > 0 ? "var(--primary-color)" : "#0f172a",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            boxShadow: pendingCount > 0 ? "0 4px 10px rgba(220, 38, 38, 0.25)" : "none",
                          }}
                        >
                          <Users size={15} />
                          <span>Manage Registrations</span>
                          {pendingCount > 0 && (
                            <span
                              style={{
                                backgroundColor: "#ffffff",
                                color: "var(--primary-color)",
                                padding: "1px 6px",
                                borderRadius: "10px",
                                fontSize: "0.75rem",
                                fontWeight: 900,
                              }}
                            >
                              {pendingCount}
                            </span>
                          )}
                        </Link>

                        {/* Edit Event Button */}
                        <Link
                          to={`/events/edit/${ev._id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "0.55rem 1rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--card-bg, #ffffff)",
                            color: "var(--text-main)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            textDecoration: "none",
                          }}
                        >
                          <Edit3 size={15} />
                          <span>Edit</span>
                        </Link>

                        {/* Delete Event Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteHostedEvent(ev._id, ev.title)}
                          disabled={actionLoading === ev._id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "0.55rem 0.85rem",
                            borderRadius: "8px",
                            border: "1px solid #fecaca",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* =========================================================================
             TAB 2: MY REGISTRATIONS (STUDENT / ATTENDEE VIEW)
             ========================================================================= */
          filteredRegistrations.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                backgroundColor: "var(--card-bg, #ffffff)",
                border: "1px dashed var(--border-color)",
                borderRadius: "16px",
              }}
            >
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <UserCheck size={28} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                No Event Registrations Found
              </h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem", fontSize: "0.9rem" }}>
                {statusFilter !== "ALL"
                  ? `You have no registrations matching the "${statusFilter}" filter.`
                  : "You haven't registered for any events yet. Check out upcoming industry workshops and sessions!"}
              </p>
              <Link
                to="/events"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--primary-color)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                }}
              >
                <span>Browse Upcoming Events</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {filteredRegistrations.map((reg) => {
                const ev = reg.event;
                if (!ev) return null;

                const isApproved = ["APPROVED", "REGISTERED", "ATTENDED"].includes(reg.status);
                const isPending = reg.status === "PENDING";
                const isRejected = reg.status === "REJECTED";

                const accessData = accessDataMap[ev._id];

                return (
                  <div
                    key={reg.registrationId || ev._id}
                    style={{
                      backgroundColor: "var(--card-bg, #ffffff)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem", padding: "1.5rem" }}>
                      {/* Banner Poster */}
                      <div
                        style={{
                          position: "relative",
                          height: "160px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          backgroundColor: "#1e293b",
                        }}
                      >
                        {ev.bannerImage || ev.banner ? (
                          <img
                            src={getImageUrl(ev.bannerImage || ev.banner)}
                            alt={ev.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "#94a3b8" }}>
                            <Layers size={36} />
                          </div>
                        )}
                        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(15, 23, 42, 0.8)",
                              color: "#ffffff",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            {ev.category}
                          </span>
                        </div>
                      </div>

                      {/* Details & Status */}
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          {/* Approval Status Badge */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
                            {isApproved && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#f0fdf4",
                                  color: "#166534",
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                <CheckCircle size={14} /> Confirmed • Access Granted
                              </span>
                            )}
                            {isPending && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fef3c7",
                                  color: "#b45309",
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  border: "1px solid #fde68a",
                                }}
                              >
                                <Clock size={14} /> Waiting for Organizer Approval
                              </span>
                            )}
                            {isRejected && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fef2f2",
                                  color: "#991b1b",
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  border: "1px solid #fecaca",
                                }}
                              >
                                <XCircle size={14} /> Registration Not Approved
                              </span>
                            )}

                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(37, 99, 235, 0.08)",
                                color: "#2563eb",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                              }}
                            >
                              {ev.mode === "Online" ? <Video size={12} /> : <MapPin size={12} />}
                              <span>{ev.mode}</span>
                            </span>
                          </div>

                          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 0.5rem" }}>
                            {ev.title}
                          </h2>

                          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <Calendar size={15} style={{ color: "#2563eb" }} />
                              {new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <Clock size={15} style={{ color: "#d97706" }} />
                              {ev.startTime ? `${ev.startTime} - ${ev.endTime || ""}` : ev.time || "10:00 AM"}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              Organizer: <strong>{ev.organizer || ev.createdBy?.name || "GradConnect Alumni"}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Status Explanatory Card */}
                        {isPending && (
                          <div
                            style={{
                              padding: "0.85rem 1rem",
                              borderRadius: "10px",
                              backgroundColor: "#fffbeb",
                              border: "1px solid #fef3c7",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              color: "#92400e",
                              fontSize: "0.85rem",
                            }}
                          >
                            <Lock size={18} style={{ flexShrink: 0, color: "#d97706" }} />
                            <span>
                              Your registration is currently under review by the event organizer. Private video conference link and physical venue directions will be unlocked here once approved.
                            </span>
                          </div>
                        )}

                        {isRejected && (
                          <div
                            style={{
                              padding: "0.85rem 1rem",
                              borderRadius: "10px",
                              backgroundColor: "#fef2f2",
                              border: "1px solid #fecaca",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              color: "#991b1b",
                              fontSize: "0.85rem",
                            }}
                          >
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>
                              <strong>Organizer Feedback: </strong>
                              {reg.rejectionReason || "Unable to confirm registration due to seat capacity or prerequisites."}
                            </span>
                          </div>
                        )}

                        {isApproved && (
                          <div
                            style={{
                              padding: "0.85rem 1rem",
                              borderRadius: "10px",
                              backgroundColor: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "0.75rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontSize: "0.85rem", fontWeight: 700 }}>
                              <Unlock size={18} />
                              <span>Access Pass Active & Ready</span>
                            </div>

                            {!accessData && (
                              <button
                                type="button"
                                onClick={() => handleUnlockAccess(ev._id)}
                                disabled={loadingAccessId === ev._id}
                                style={{
                                  padding: "0.45rem 0.9rem",
                                  borderRadius: "6px",
                                  backgroundColor: "#166534",
                                  color: "#ffffff",
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                {loadingAccessId === ev._id ? "Unlocking..." : "Show Meeting & Venue Pass"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unlocked Access Details Card (Only if Approved) */}
                    {isApproved && accessData && (
                      <div
                        style={{
                          margin: "0 1.5rem 1.5rem",
                          padding: "1.25rem",
                          borderRadius: "12px",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
                          <ShieldCheck size={18} style={{ color: "#16a34a" }} />
                          <span>Approved Participant Access Credentials</span>
                        </h4>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                          {/* Online meeting credentials */}
                          {accessData.meetingLink && (
                            <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>
                                ONLINE MEETING ({accessData.meetingPlatform || "Google Meet"})
                              </div>
                              <a
                                href={accessData.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "0.6rem 1rem",
                                  borderRadius: "6px",
                                  backgroundColor: "#2563eb",
                                  color: "#ffffff",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                  textDecoration: "none",
                                  marginTop: "4px",
                                }}
                              >
                                <Video size={15} /> Join Live Meeting <ExternalLink size={13} />
                              </a>
                            </div>
                          )}

                          {/* Venue info */}
                          {(accessData.venueName || accessData.venueAddress) && (
                            <div style={{ backgroundColor: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>
                                PHYSICAL VENUE & ROOM
                              </div>
                              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem" }}>
                                {accessData.venueName}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {accessData.venueAddress} {accessData.venueCity ? `• ${accessData.venueCity}` : ""}
                              </div>
                              {accessData.room && (
                                <div style={{ marginTop: "4px", fontSize: "0.8rem", color: "#2563eb", fontWeight: 700 }}>
                                  Room / Hall: {accessData.room}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div
                      style={{
                        padding: "1rem 1.5rem",
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      <Link
                        to={`/events/${ev._id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textDecoration: "none",
                        }}
                      >
                        <span>View Event Details</span>
                        <ArrowRight size={14} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleCancelRegistration(ev._id)}
                        disabled={actionLoading === ev._id}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                          color: "#64748b",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        {actionLoading === ev._id ? "Processing..." : "Cancel Registration"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyEvents;
