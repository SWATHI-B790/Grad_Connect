import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  CheckCircle,
  AlertCircle,
  Share2,
  ChevronLeft,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Award,
  BookOpen,
  DollarSign,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Edit3,
  XCircle,
  Info,
  Building,
  GraduationCap,
  X,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { getImageUrl } from "../utils/getImageUrl";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [userRegistrationStatus, setUserRegistrationStatus] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessDetails, setAccessDetails] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMeeting, setCopiedMeeting] = useState(false);

  // Registration Modal State
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    year: "",
    reason: "",
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState("");

  const isOwner = useMemo(() => {
    if (!user || !event?.createdBy) return false;
    const cId = event.createdBy._id ? event.createdBy._id.toString() : event.createdBy.toString();
    return cId === user._id.toString();
  }, [user, event]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    return ["admin", "superadmin", "subadmin"].includes(role);
  }, [user]);

  const fetchEvent = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/events/${id}`);
      if (res.data.success && res.data.event) {
        setEvent(res.data.event);
        setUserRegistrationStatus(res.data.userRegistrationStatus);
        setUserRegistration(res.data.userRegistration);
        setHasAccess(res.data.hasAccess);
        setRelatedEvents(res.data.relatedEvents || []);

        // If user already has access, fetch/set private access details
        if (res.data.hasAccess) {
          fetchAccessPass();
        }
      } else {
        setError("Event not found");
      }
    } catch (err) {
      console.error("Error fetching event details:", err);
      setError(err.response?.data?.message || "Failed to load event details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessPass = async () => {
    try {
      const res = await API.get(`/events/${id}/access`);
      if (res.data.success && res.data.accessGranted) {
        setAccessDetails(res.data);
      }
    } catch (err) {
      console.warn("Could not load private access pass:", err);
    }
  };

  useEffect(() => {
    fetchEvent();
    window.scrollTo(0, 0);
  }, [id]);

  // Pre-fill user details into registration form when opening
  const handleOpenRegisterModal = () => {
    if (!user) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    setRegForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      college: user.college || user.institution || "",
      department: user.department || "",
      year: user.batch || user.graduationYear || "",
      reason: "",
    });
    setRegError("");
    setRegModalOpen(true);
  };

  // Submit Registration Form
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    setRegError("");

    try {
      const res = await API.post(`/events/${event._id}/register`, regForm);
      setSuccessMessage(res.data?.message || "Registration submitted! Awaiting organizer approval.");
      setUserRegistrationStatus(res.data?.registrationStatus || "PENDING");
      setRegModalOpen(false);
      fetchEvent();
    } catch (err) {
      console.error("Registration error:", err);
      setRegError(err.response?.data?.message || "Failed to submit registration. Please check fields.");
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to cancel your registration for this event?")) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await API.post(`/events/${event._id}/unregister`);
      setSuccessMessage("Registration cancelled successfully.");
      setUserRegistrationStatus("CANCELLED");
      setHasAccess(false);
      setAccessDetails(null);
      fetchEvent();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel registration.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyMeetingLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedMeeting(true);
    setTimeout(() => setCopiedMeeting(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div
          style={{
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
            backgroundColor: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            border: "1px solid var(--border-color, #e2e8f0)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <AlertCircle size={48} style={{ color: "#dc2626", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>Event Not Found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error}</p>
          <Link
            to="/events"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "var(--primary-color, #2563eb)",
              color: "#fff",
              borderRadius: "10px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <ChevronLeft size={18} /> Back to All Events
          </Link>
        </div>
      </div>
    );
  }

  const cap = event?.capacity || event?.maxAttendees || 100;
  const approvedCount = event?.approvedCount || (event?.attendees ? event.attendees.length : 0);
  const pendingCount = event?.pendingCount || 0;
  const availableSeats = event?.availableSeats !== undefined ? event.availableSeats : Math.max(0, cap - approvedCount);
  const isFull = availableSeats <= 0;

  const isApproved = ["APPROVED", "REGISTERED", "ATTENDED"].includes(userRegistrationStatus);
  const isPending = userRegistrationStatus === "PENDING";
  const isRejected = userRegistrationStatus === "REJECTED";
  const isCancelled = event?.status === "CANCELLED" || event?.status === "Cancelled";
  const isPendingAdminReview = event?.status === "PENDING_ADMIN_APPROVAL";
  const deadlinePassed = event?.registrationDeadline && new Date() > new Date(event.registrationDeadline);
  const percentFilled = Math.min(100, Math.round((approvedCount / cap) * 100));

  // Resolved meeting link
  const finalMeetingLink = accessDetails?.meetingLink || event?.meetingLink;
  const finalPlatform = accessDetails?.meetingPlatform || event?.meetingPlatform || "Google Meet";
  const finalVenueName = accessDetails?.venueName || event?.venueName || event?.venue;
  const finalVenueAddress = accessDetails?.venueAddress || event?.venueAddress || event?.address;
  const finalRoom = accessDetails?.room || event?.room;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-color, #f8fafc)", display: "flex", flexDirection: "column" }}>
      <Toast />

      {/* Breadcrumbs Navigation */}
      <div style={{ backgroundColor: "var(--card-bg, #ffffff)", borderBottom: "1px solid var(--border-color, #e2e8f0)", padding: "0.85rem 1.5rem", paddingTop: "calc(76px + 12px)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
          <Link to="/" style={{ color: "var(--text-muted, #64748b)", textDecoration: "none" }}>Home</Link>
          <span style={{ color: "var(--text-muted, #94a3b8)" }}>/</span>
          <Link to="/events" style={{ color: "var(--text-muted, #64748b)", textDecoration: "none" }}>Events</Link>
          <span style={{ color: "var(--text-muted, #94a3b8)" }}>/</span>
          <span style={{ color: "var(--text-main, #0f172a)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "400px" }}>
            {event.title}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", width: "100%", margin: "1.5rem auto", padding: "0 1.5rem", flex: 1 }}>
        {/* Admin Review Warning Banner (If Pending Admin Approval) */}
        {isPendingAdminReview && (
          <div
            style={{
              padding: "1rem 1.25rem",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px", color: "#d97706" }} />
            <div>
              <strong>Under Admin Review: </strong>
              <span>This event has been submitted by an alumnus and is currently awaiting university administrator approval. It is not visible on the public events board until approved.</span>
            </div>
          </div>
        )}

        {/* Alerts & Feedback */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "1rem 1.25rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontWeight: 700,
            }}
          >
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "1rem 1.25rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontWeight: 700,
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Hero Banner Section */}
        <div
          style={{
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            backgroundColor: "#0f172a",
            marginBottom: "2rem",
            boxShadow: "0 15px 35px -10px rgba(15, 23, 42, 0.2)",
          }}
        >
          {/* Background Banner */}
          <div style={{ position: "relative", height: "340px", width: "100%" }}>
            <img
              src={getImageUrl(event.bannerImage || event.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80")}
              alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.3) 60%, rgba(15, 23, 42, 0.1) 100%)",
              }}
            />
          </div>

          {/* Hero Content Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "2rem 2.5rem",
              color: "#ffffff",
            }}
          >
            {/* Badges Row */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <span
                style={{
                  backgroundColor: "rgba(37, 99, 235, 0.9)",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "0.3rem 0.75rem",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {event.eventType || "Workshop"}
              </span>

              <span
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(8px)",
                  color: "#e2e8f0",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.3rem 0.75rem",
                  borderRadius: "999px",
                }}
              >
                {event.category || "Technology"}
              </span>

              <span
                style={{
                  backgroundColor: event.mode === "Online" ? "rgba(14, 165, 233, 0.9)" : "rgba(217, 119, 6, 0.9)",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "0.3rem 0.75rem",
                  borderRadius: "999px",
                }}
              >
                {event.mode}
              </span>

              {isCancelled && (
                <span
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    padding: "0.3rem 0.75rem",
                    borderRadius: "999px",
                  }}
                >
                  CANCELLED
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: "var(--font-heading, 'Fraunces', serif)",
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.2,
                marginBottom: "0.75rem",
                textShadow: "0 2px 4px rgba(0,0,0,0.4)",
              }}
            >
              {event.title}
            </h1>

            <p
              style={{
                fontSize: "1.05rem",
                color: "#cbd5e1",
                maxWidth: "800px",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {event.shortDescription || event.description.slice(0, 160)}
            </p>
          </div>
        </div>

        {/* Two-Column Grid: Left Main Content / Right Registration & Access Sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem", alignItems: "start" }}>
          {/* Left Column: Full Event Information */}
          <div>
            {/* Quick Metrics Bar */}
            <div
              style={{
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "16px",
                border: "1px solid var(--border-color, #e2e8f0)",
                padding: "1.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1.25rem",
                marginBottom: "1.75rem",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
              }}
            >
              {/* Date */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", fontWeight: 700 }}>
                    DATE
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main, #0f172a)" }}>
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Time & Duration */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "#fef3c7",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", fontWeight: 700 }}>
                    TIME
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main, #0f172a)" }}>
                    {event.startTime ? `${event.startTime} - ${event.endTime || ""}` : event.time || "10:00 AM - 12:00 PM IST"}
                  </div>
                </div>
              </div>

              {/* Mode & Venue */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "#f0fdf4",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {event.mode === "Online" ? <Video size={22} /> : <MapPin size={22} />}
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", fontWeight: 700 }}>
                    LOCATION
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-main, #0f172a)" }}>
                    {event.venueName || event.venue || (event.mode === "Online" ? "Online Meeting" : "Auditorium")}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Event Description */}
            <div
              style={{
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "16px",
                border: "1px solid var(--border-color, #e2e8f0)",
                padding: "2rem",
                marginBottom: "1.75rem",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
              }}
            >
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "1rem" }}>
                About This Event
              </h2>
              <div
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  color: "var(--text-secondary, #334155)",
                  whiteSpace: "pre-line",
                }}
              >
                {event.description}
              </div>

              {/* Topics / Key Takeaways */}
              {event.topics && event.topics.length > 0 && (
                <div style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.85rem" }}>
                    Topics & Key Takeaways
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {event.topics.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: "var(--bg-color, #f1f5f9)",
                          border: "1px solid var(--border-color, #e2e8f0)",
                          padding: "0.35rem 0.85rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--text-main, #0f172a)",
                        }}
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Agenda / Schedule Timeline */}
              {event.agenda && event.agenda.length > 0 && (
                <div style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem" }}>
                    Event Schedule & Agenda
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {event.agenda.map((ag, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "1rem",
                          padding: "0.75rem 1rem",
                          backgroundColor: "var(--bg-color, #f8fafc)",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color, #e2e8f0)",
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", minWidth: "140px" }}>
                          {ag.time}
                        </span>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
                          {ag.activity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related Engineering Track Banner */}
            {event.domainId && (
              <div
                style={{
                  backgroundColor: "var(--card-bg, #ffffff)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  padding: "1.5rem 2rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                    RELATED TECHNICAL DOMAIN
                  </div>
                  <h3 style={{ margin: "0.25rem 0", fontSize: "1.2rem", fontWeight: 800 }}>
                    {event.domainId.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Master key roadmaps, tools, and projects related to this event.
                  </p>
                </div>
                <Link
                  to={`/domains/${event.domainId.slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "10px",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  View Track Roadmap <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Registration Card, Access Pass, Organizer & Share */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Organizer Management Pill (If viewer is creator or admin) */}
            {(isOwner || isAdmin) && (
              <div
                style={{
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
                  <ShieldCheck size={18} style={{ color: "#38bdf8" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#94a3b8" }}>
                    {isOwner ? "Host Management Console" : "Admin Moderation Console"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <Link
                    to={`/events/${event._id}/registrations`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users size={15} /> Review Registrations
                    </span>
                    {pendingCount > 0 && (
                      <span style={{ backgroundColor: "#dc2626", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 800 }}>
                        {pendingCount} Pending
                      </span>
                    )}
                  </Link>

                  <Link
                    to={`/events/edit/${event._id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "#cbd5e1",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Edit3 size={15} /> Edit Event Details
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* Primary Registration / Access Card */}
            <div
              style={{
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "16px",
                border: "1px solid var(--border-color, #e2e8f0)",
                padding: "1.75rem",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                position: "sticky",
                top: "20px",
              }}
            >
              {/* Pricing Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.25rem" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700 }}>TICKET PRICING</span>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--text-main)" }}>
                    {event.price > 0 ? `₹${event.price}` : "Free Event"}
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: event.price > 0 ? "#fef3c7" : "#f0fdf4",
                    color: event.price > 0 ? "#b45309" : "#166534",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  {event.priceType || "Free"}
                </span>
              </div>

              {/* Attendance Capacity Progress */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  <span>Confirmed Attendees</span>
                  <span>{approvedCount} / {cap} seats</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${percentFilled}%`,
                      backgroundColor: percentFilled >= 100 ? "#dc2626" : percentFilled > 75 ? "#ea580c" : "#2563eb",
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  {availableSeats > 0 ? `${availableSeats} seats remaining` : "No seats remaining (Full)"}
                </div>
              </div>

              {/* Dynamic Status Action Blocks */}
              {isCancelled ? (
                <div
                  style={{
                    padding: "0.85rem",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    borderRadius: "10px",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                  }}
                >
                  Event Cancelled by Administration
                </div>
              ) : isApproved || hasAccess ? (
                /* STATE A: APPROVED & ACCESS PASS GRANTED */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div
                    style={{
                      padding: "0.85rem",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      borderRadius: "10px",
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>{isOwner ? "Host Pass Active" : "Verified Attendee Pass"}</span>
                  </div>

                  {/* Private Meeting Credentials */}
                  {finalMeetingLink && (
                    <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "1rem", borderRadius: "10px" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1e40af", marginBottom: "0.4rem" }}>
                        ONLINE MEETING ({finalPlatform})
                      </div>
                      <a
                        href={finalMeetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          padding: "0.75rem",
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          textDecoration: "none",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <Video size={16} /> Join Live Meeting <ExternalLink size={14} />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyMeetingLink(finalMeetingLink)}
                        style={{
                          width: "100%",
                          padding: "0.4rem",
                          backgroundColor: "#ffffff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "6px",
                          color: "#2563eb",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        {copiedMeeting ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedMeeting ? "Link Copied!" : "Copy Meeting URL"}</span>
                      </button>
                    </div>
                  )}

                  {/* Private Room / Venue Details */}
                  {(finalVenueName || finalVenueAddress || finalRoom) && (
                    <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.85rem", borderRadius: "10px", fontSize: "0.85rem" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                        PHYSICAL VENUE
                      </div>
                      <div style={{ fontWeight: 800, color: "var(--text-main)" }}>
                        {finalVenueName}
                      </div>
                      {finalVenueAddress && (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {finalVenueAddress}
                        </div>
                      )}
                      {finalRoom && (
                        <div style={{ marginTop: "4px", color: "#2563eb", fontWeight: 700 }}>
                          Room / Hall: {finalRoom}
                        </div>
                      )}
                    </div>
                  )}

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={handleUnregister}
                      disabled={actionLoading}
                      style={{
                        padding: "0.65rem",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        color: "#64748b",
                        borderRadius: "10px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      {actionLoading ? "Processing..." : "Cancel My Registration"}
                    </button>
                  )}
                </div>
              ) : isPending ? (
                /* STATE B: SUBMITTED & WAITING FOR ORGANIZER APPROVAL */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, marginBottom: "0.3rem" }}>
                      <Clock size={16} />
                      <span>Registration Pending Approval</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.4 }}>
                      Your registration has been submitted. The organizer is reviewing your application. Meeting links will be unlocked automatically upon approval.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleUnregister}
                    disabled={actionLoading}
                    style={{
                      padding: "0.65rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#64748b",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {actionLoading ? "Processing..." : "Withdraw Registration"}
                  </button>
                </div>
              ) : isRejected ? (
                /* STATE C: REGISTRATION REJECTED WITH FEEDBACK */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, marginBottom: "0.3rem" }}>
                      <XCircle size={16} />
                      <span>Registration Not Approved</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.4 }}>
                      {userRegistration?.rejectionReason
                        ? `Organizer feedback: "${userRegistration.rejectionReason}"`
                        : "The organizer was unable to accommodate your application due to capacity or requirements."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenRegisterModal}
                    disabled={isFull}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: isFull ? "not-allowed" : "pointer",
                    }}
                  >
                    Re-apply for Event
                  </button>
                </div>
              ) : isFull ? (
                /* STATE D: EVENT AT FULL CAPACITY */
                <button
                  type="button"
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "10px",
                    backgroundColor: "#e2e8f0",
                    color: "#94a3b8",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: "not-allowed",
                  }}
                >
                  Registration Full (Capacity Reached)
                </button>
              ) : deadlinePassed ? (
                /* STATE E: REGISTRATION DEADLINE PASSED */
                <button
                  type="button"
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "10px",
                    backgroundColor: "#e2e8f0",
                    color: "#94a3b8",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: "not-allowed",
                  }}
                >
                  Registration Deadline Passed
                </button>
              ) : (
                /* STATE F: OPEN FOR REGISTRATION */
                <button
                  type="button"
                  onClick={handleOpenRegisterModal}
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "10px",
                    backgroundColor: "var(--primary-color)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
                >
                  ⚡ Register for Event
                </button>
              )}

              {/* Share info */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    backgroundColor: "transparent",
                    color: "var(--text-main)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {copiedLink ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
                  {copiedLink ? "Link Copied!" : "Share Event Link"}
                </button>
              </div>
            </div>

            {/* Organizer Card */}
            <div
              style={{
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "16px",
                border: "1px solid var(--border-color, #e2e8f0)",
                padding: "1.5rem",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                ORGANIZER
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <img
                  src={
                    event.createdBy?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer || "Admin")}&background=2563eb&color=fff`
                  }
                  alt={event.organizer}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>
                    {event.organizer || event.createdBy?.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {event.createdBy?.jobTitle
                      ? `${event.createdBy.jobTitle} at ${event.createdBy.company || "Industry"}`
                      : "GradConnect Community Host"}
                  </div>
                </div>
              </div>

              {event.createdBy?._id && (
                <Link
                  to={`/profile/${event.createdBy._id}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: "1rem",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-color, #f8fafc)",
                    color: "var(--primary-color)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  View Host Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Application Modal */}
      <AnimatePresence>
        {regModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "520px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 0.25rem" }}>
                    Event Registration
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {event.title}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setRegModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {regError && (
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem" }}>
                  {regError}
                </div>
              )}

              <form onSubmit={handleSubmitRegistration}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "0.85rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      College / Institution
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.college}
                      onChange={(e) => setRegForm({ ...regForm, college: e.target.value })}
                      placeholder="e.g. IIT Bombay"
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "0.85rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      Department / Major
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.department}
                      onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                      placeholder="e.g. Computer Science"
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      Batch / Year
                    </label>
                    <input
                      type="text"
                      value={regForm.year}
                      onChange={(e) => setRegForm({ ...regForm, year: e.target.value })}
                      placeholder="e.g. 2025"
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "0.85rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Statement of Interest / Why do you want to attend?
                  </label>
                  <textarea
                    rows={3}
                    value={regForm.reason}
                    onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                    placeholder="Briefly state your background or what you hope to learn from this session..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "0.85rem", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setRegModalOpen(false)}
                    disabled={regSubmitting}
                    style={{
                      padding: "0.65rem 1.25rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "transparent",
                      color: "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={regSubmitting}
                    style={{
                      padding: "0.65rem 1.5rem",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "var(--primary-color)",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: regSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {regSubmitting ? "Submitting Application..." : "Submit Registration"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default EventDetail;
