import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  UserX,
  FileText,
  Sparkles,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { getImageUrl } from "../utils/getImageUrl";

const EventRegistrations = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState({
    capacity: 100,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    availableSeats: 100,
    totalRegistrations: 0,
  });
  const [registrations, setRegistrations] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRegForReject, setSelectedRegForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedEmails, setCopiedEmails] = useState(false);

  const showToast = (message, type = "success") => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message, type },
      })
    );
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/events/${eventId}/registrations`);
      if (res.data.success) {
        setEvent(res.data.event);
        setStats(res.data.stats || {});
        setRegistrations(res.data.registrations || []);
      }
    } catch (err) {
      console.error("Failed to fetch event registrations:", err);
      setError(err.response?.data?.message || "Unable to load registrations for this event.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [eventId]);

  // Handle Approve
  const handleApprove = async (regId, participantName) => {
    if (stats.availableSeats <= 0) {
      showToast("Cannot approve: Event has reached full attendee capacity.", "error");
      return;
    }

    setActionLoadingId(regId);
    try {
      const res = await API.post(`/events/${eventId}/registrations/${regId}/approve`);
      showToast(res.data?.message || `Approved ${participantName || "participant"}!`);
      // Update local state smoothly
      setRegistrations((prev) =>
        prev.map((r) =>
          r._id === regId
            ? { ...r, status: "APPROVED", approvedAt: new Date(), rejectionReason: "" }
            : r
        )
      );
      setStats((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
        approvedCount: prev.approvedCount + 1,
        availableSeats: Math.max(0, prev.availableSeats - 1),
      }));
    } catch (err) {
      console.error("Error approving registration:", err);
      showToast(err.response?.data?.message || "Failed to approve registration.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (reg) => {
    setSelectedRegForReject(reg);
    setRejectionReason("");
    setRejectionError("");
    setRejectModalOpen(true);
  };

  // Submit Reject
  const handleSubmitReject = async (e) => {
    e.preventDefault();
    if (!selectedRegForReject) return;

    if (!rejectionReason.trim()) {
      setRejectionError("Please provide a constructive reason for rejecting this application.");
      return;
    }

    const regId = selectedRegForReject._id;
    const participantName = selectedRegForReject.name || selectedRegForReject.userId?.name || "Participant";
    setActionLoadingId(regId);

    try {
      const res = await API.post(`/events/${eventId}/registrations/${regId}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      showToast(res.data?.message || `Application for ${participantName} rejected.`);
      
      const wasApproved = ["APPROVED", "REGISTERED", "ATTENDED"].includes(selectedRegForReject.status);
      const wasPending = selectedRegForReject.status === "PENDING";

      setRegistrations((prev) =>
        prev.map((r) =>
          r._id === regId
            ? { ...r, status: "REJECTED", rejectionReason: rejectionReason.trim(), rejectedAt: new Date() }
            : r
        )
      );

      setStats((prev) => ({
        ...prev,
        pendingCount: wasPending ? Math.max(0, prev.pendingCount - 1) : prev.pendingCount,
        approvedCount: wasApproved ? Math.max(0, prev.approvedCount - 1) : prev.approvedCount,
        availableSeats: wasApproved ? Math.min(prev.capacity, prev.availableSeats + 1) : prev.availableSeats,
        rejectedCount: prev.rejectedCount + 1,
      }));

      setRejectModalOpen(false);
      setSelectedRegForReject(null);
    } catch (err) {
      console.error("Error rejecting registration:", err);
      setRejectionError(err.response?.data?.message || "Failed to reject registration.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Copy Approved Attendee Emails
  const handleCopyApprovedEmails = () => {
    const approvedEmails = registrations
      .filter((r) => ["APPROVED", "REGISTERED", "ATTENDED"].includes(r.status))
      .map((r) => r.email || r.userId?.email)
      .filter(Boolean);

    if (approvedEmails.length === 0) {
      showToast("No approved attendees yet to copy.", "info");
      return;
    }

    navigator.clipboard.writeText(approvedEmails.join(", "));
    setCopiedEmails(true);
    showToast(`${approvedEmails.length} approved attendee emails copied!`);
    setTimeout(() => setCopiedEmails(false), 3000);
  };

  // Filtered List
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const pName = reg.name || reg.userId?.name || "";
      const pEmail = reg.email || reg.userId?.email || "";
      const pCollege = reg.college || reg.userId?.college || reg.userId?.institution || "";
      const pDept = reg.department || reg.userId?.department || "";

      const matchesSearch =
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pCollege.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pDept.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "ALL") return true;
      if (activeFilter === "PENDING") return reg.status === "PENDING";
      if (activeFilter === "APPROVED") return ["APPROVED", "REGISTERED", "ATTENDED"].includes(reg.status);
      if (activeFilter === "REJECTED") return reg.status === "REJECTED";
      return true;
    });
  }, [registrations, searchQuery, activeFilter]);

  if (loading) {
    return (
      <div className="events-page-root">
        <div style={{ textAlign: "center", padding: "8rem 1rem" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Loading attendee management console...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="events-page-root">
        <div style={{ maxWidth: "600px", margin: "6rem auto", padding: "2.5rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "16px", textAlign: "center" }}>
          <AlertCircle size={36} style={{ color: "#dc2626", margin: "0 auto 1rem" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#991b1b", marginBottom: "0.5rem" }}>
            Access Restricted or Not Found
          </h2>
          <p style={{ color: "#7f1d1d", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            {error || "Event attendee dashboard could not be loaded."}
          </p>
          <button
            onClick={() => navigate("/my-events")}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              backgroundColor: "var(--primary-color)",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to My Events
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const percentFilled = Math.min(100, Math.round((stats.approvedCount / stats.capacity) * 100));

  return (
    <div className="events-page-root">
      <Toast />

      <div className="events-main-container" style={{ maxWidth: "1200px", paddingTop: "calc(76px + 28px)", minHeight: "85vh" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/my-events"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to My Events</span>
          </Link>
        </div>

        {/* Page Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563eb", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <ShieldCheck size={13} />
              <span>Organizer Attendee Review Center</span>
            </div>

            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.25rem", fontWeight: 800, color: "var(--dark-color)", margin: "0 0 0.5rem" }}>
              {event.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Calendar size={15} style={{ color: "#2563eb" }} />
                {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Clock size={15} style={{ color: "#d97706" }} />
                {event.time || "10:00 AM"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                {event.mode === "Online" ? <Video size={15} style={{ color: "#16a34a" }} /> : <MapPin size={15} style={{ color: "#dc2626" }} />}
                <span>{event.mode}</span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={handleCopyApprovedEmails}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.65rem 1.1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--card-bg, #ffffff)",
                color: "var(--text-main)",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {copiedEmails ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              <span>{copiedEmails ? "Emails Copied!" : "Copy Attendee Emails"}</span>
            </button>

            <Link
              to={`/events/${event._id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.65rem 1.1rem",
                borderRadius: "8px",
                backgroundColor: "var(--primary-color)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              <ExternalLink size={15} />
              <span>Public Event Page</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {/* Total Capacity */}
          <div style={{ backgroundColor: "var(--card-bg, #ffffff)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Total Capacity
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0f172a" }}>
              {stats.capacity}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Max attendee limit
            </div>
          </div>

          {/* Approved Attendees */}
          <div style={{ backgroundColor: "var(--card-bg, #ffffff)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Confirmed Attendees
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#16a34a" }}>
              {stats.approvedCount}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              {percentFilled}% seats filled
            </div>
          </div>

          {/* Pending Approval */}
          <div style={{ backgroundColor: stats.pendingCount > 0 ? "#fffbeb" : "var(--card-bg, #ffffff)", border: stats.pendingCount > 0 ? "1px solid #fde68a" : "1px solid var(--border-color)", borderRadius: "14px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#b45309", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Pending Review
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#d97706" }}>
              {stats.pendingCount}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#92400e", marginTop: "0.2rem" }}>
              Requires organizer decision
            </div>
          </div>

          {/* Available Seats */}
          <div style={{ backgroundColor: "var(--card-bg, #ffffff)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Available Seats
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: stats.availableSeats === 0 ? "#dc2626" : "#2563eb" }}>
              {stats.availableSeats}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              {stats.availableSeats === 0 ? "Event is at full capacity" : "Open for approval"}
            </div>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div style={{ backgroundColor: "var(--card-bg, #ffffff)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            <span>Seat Allocation Progress</span>
            <span style={{ color: percentFilled >= 100 ? "#dc2626" : "#2563eb", fontWeight: 800 }}>
              {stats.approvedCount} / {stats.capacity} Seats ({percentFilled}%)
            </span>
          </div>
          <div style={{ height: "10px", backgroundColor: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${percentFilled}%`,
                backgroundColor: percentFilled >= 100 ? "#dc2626" : percentFilled > 75 ? "#ea580c" : "#16a34a",
                borderRadius: "999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "420px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search applicant name, email, department, or college..."
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

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: `All (${registrations.length})` },
              { id: "PENDING", label: `Pending Review (${stats.pendingCount})` },
              { id: "APPROVED", label: `Approved (${stats.approvedCount})` },
              { id: "REJECTED", label: `Rejected (${stats.rejectedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: activeFilter === tab.id ? "1px solid var(--primary-color)" : "1px solid var(--border-color)",
                  backgroundColor: activeFilter === tab.id ? "rgba(220, 38, 38, 0.08)" : "var(--card-bg, #ffffff)",
                  color: activeFilter === tab.id ? "var(--primary-color)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Participant Table */}
        {filteredRegistrations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px dashed var(--border-color)",
              borderRadius: "16px",
            }}
          >
            <Users size={36} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.4rem" }}>
              No Participant Applications Found
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
              {activeFilter !== "ALL"
                ? `No registrations match the "${activeFilter}" filter.`
                : "No users have registered for this event yet."}
            </p>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 800 }}>Applicant</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 800 }}>Academic Details</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 800 }}>Statement of Interest</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 800 }}>Status</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 800, textAlign: "right" }}>Moderation Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => {
                    const participantName = reg.name || reg.userId?.name || "Anonymous User";
                    const participantEmail = reg.email || reg.userId?.email || "";
                    const participantPhone = reg.phone || reg.userId?.phone || "";
                    const participantAvatar =
                      reg.userId?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=2563eb&color=fff`;

                    const isApproved = ["APPROVED", "REGISTERED", "ATTENDED"].includes(reg.status);
                    const isPending = reg.status === "PENDING";
                    const isRejected = reg.status === "REJECTED";

                    return (
                      <tr
                        key={reg._id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Column 1: Applicant Profile */}
                        <td style={{ padding: "1.2rem 1.25rem", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                              src={participantAvatar}
                              alt={participantName}
                              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>
                                {participantName}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                <Mail size={12} />
                                <span>{participantEmail}</span>
                              </div>
                              {participantPhone && (
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                  <Phone size={12} />
                                  <span>{participantPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Academic Details */}
                        <td style={{ padding: "1.2rem 1.25rem", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {reg.college || reg.userId?.college || reg.userId?.institution || "GradConnect University"}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                            {reg.department || reg.userId?.department || "General Engineering"}
                          </div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#2563eb", fontSize: "0.75rem", fontWeight: 700 }}>
                            <GraduationCap size={12} />
                            <span>Batch: {reg.year || reg.userId?.batch || reg.userId?.graduationYear || "Current"}</span>
                          </div>
                        </td>

                        {/* Column 3: Reason for attending */}
                        <td style={{ padding: "1.2rem 1.25rem", verticalAlign: "top", maxWidth: "280px" }}>
                          {reg.reason ? (
                            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.4 }}>
                              "{reg.reason}"
                            </p>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>
                              No statement provided
                            </span>
                          )}
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Column 4: Status Badge */}
                        <td style={{ padding: "1.2rem 1.25rem", verticalAlign: "top" }}>
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
                                fontSize: "0.75rem",
                                fontWeight: 800,
                              }}
                            >
                              <Clock size={13} /> Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <div>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#f0fdf4",
                                  color: "#166534",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                <CheckCircle size={13} /> Approved
                              </span>
                              {reg.approvedAt && (
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "3px" }}>
                                  {new Date(reg.approvedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <div>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  backgroundColor: "#fef2f2",
                                  color: "#991b1b",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                <XCircle size={13} /> Rejected
                              </span>
                              {reg.rejectionReason && (
                                <div style={{ fontSize: "0.75rem", color: "#b91c1c", marginTop: "3px", maxWidth: "160px" }}>
                                  "{reg.rejectionReason}"
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Column 5: Moderation Action Buttons */}
                        <td style={{ padding: "1.2rem 1.25rem", verticalAlign: "top", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(reg._id, participantName)}
                                  disabled={actionLoadingId === reg._id || stats.availableSeats <= 0}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "0.5rem 0.9rem",
                                    borderRadius: "8px",
                                    backgroundColor: "#16a34a",
                                    color: "#ffffff",
                                    border: "none",
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                    cursor: stats.availableSeats <= 0 ? "not-allowed" : "pointer",
                                    opacity: stats.availableSeats <= 0 ? 0.6 : 1,
                                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
                                  }}
                                >
                                  <UserCheck size={14} />
                                  <span>{actionLoadingId === reg._id ? "Approving..." : "Approve"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(reg)}
                                  disabled={actionLoadingId === reg._id}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "0.5rem 0.8rem",
                                    borderRadius: "8px",
                                    backgroundColor: "#fef2f2",
                                    color: "#dc2626",
                                    border: "1px solid #fecaca",
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  <UserX size={14} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(reg)}
                                disabled={actionLoadingId === reg._id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "0.45rem 0.75rem",
                                  borderRadius: "6px",
                                  backgroundColor: "transparent",
                                  color: "var(--text-muted)",
                                  border: "1px solid var(--border-color)",
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                                title="Revoke registration pass"
                              >
                                <span>Revoke / Reject</span>
                              </button>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => handleApprove(reg._id, participantName)}
                                disabled={actionLoadingId === reg._id || stats.availableSeats <= 0}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "0.45rem 0.75rem",
                                  borderRadius: "6px",
                                  backgroundColor: "#eff6ff",
                                  color: "#2563eb",
                                  border: "1px solid #bfdbfe",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  cursor: stats.availableSeats <= 0 ? "not-allowed" : "pointer",
                                }}
                                title="Approve applicant"
                              >
                                <span>Re-approve</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject Participant Modal */}
      <AnimatePresence>
        {rejectModalOpen && selectedRegForReject && (
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
                maxWidth: "500px",
                padding: "2rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserX size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                    Reject Application
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Applicant: <strong>{selectedRegForReject.name || selectedRegForReject.userId?.name}</strong>
                  </div>
                </div>
              </div>

              {rejectionError && (
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem" }}>
                  {rejectionError}
                </div>
              )}

              <form onSubmit={handleSubmitReject}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.4rem" }}>
                    Reason for Rejection <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    This reason will be provided to the applicant in their notification so they understand what prerequisites were missing.
                  </p>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setRejectionError("");
                    }}
                    placeholder="e.g. Workshop is limited to 3rd & 4th year students with prior Git experience. Alternatively, capacity reached for this batch."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color, #f8fafc)",
                      color: "var(--text-main)",
                      fontSize: "0.875rem",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalOpen(false);
                      setSelectedRegForReject(null);
                    }}
                    disabled={Boolean(actionLoadingId)}
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
                    disabled={Boolean(actionLoadingId)}
                    style={{
                      padding: "0.65rem 1.5rem",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: actionLoadingId ? "not-allowed" : "pointer",
                    }}
                  >
                    {actionLoadingId ? "Processing..." : "Confirm Rejection"}
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

export default EventRegistrations;
