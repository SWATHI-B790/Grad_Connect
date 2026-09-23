import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  DollarSign,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldAlert,
  Layers,
  Building,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { getImageUrl } from "../utils/getImageUrl";

const CATEGORIES = [
  "Technical Workshop",
  "Coding",
  "AI & Machine Learning",
  "Web Development",
  "Cloud Computing",
  "Data Science",
  "Career & Placement",
  "Entrepreneurship",
  "Alumni Meetup",
  "Seminar",
  "Webinar",
  "Hackathon",
  "Other",
];

const DEFAULT_DOMAINS = [
  "MERN Stack Development",
  "AI & Machine Learning",
  "Cloud Computing & AWS",
  "DevOps & CI/CD Engineering",
  "Cybersecurity & Ethical Hacking",
  "UI/UX Design & Systems",
  "Data Science & Machine Learning",
  "Mobile App Development (Flutter)",
  "Quantum Computing & Algorithms",
  "System Design",
];

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [domains, setDomains] = useState(DEFAULT_DOMAINS);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "Technical Workshop",
    domain: "AI & Machine Learning",
    domainId: "",
    eventType: "Technical Workshop",
    priceType: "Free",
    price: 0,
    mode: "Online",
    meetingPlatform: "Google Meet",
    meetingLink: "",
    venueName: "",
    venueAddress: "",
    venueCity: "",
    room: "",
    date: "",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    timezone: "IST",
    capacity: 100,
    eligibility: "Open to all verified students and alumni",
    topics: "",
    bannerImage: "",
  });

  const isAdmin = user && ["admin", "superadmin", "subadmin"].includes(user.role);

  // Fetch available domains from backend
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await API.get("/domains");
        if (res.data?.domains && res.data.domains.length > 0) {
          setDomains(res.data.domains.map((d) => d.name));
        }
      } catch (err) {
        console.warn("Using default domain list:", err);
      }
    };
    fetchDomains();
  }, []);

  // If editing, fetch existing event data
  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/events/${id}`);
        const ev = res.data?.event || res.data;
        if (ev) {
          const dateStr = ev.date ? new Date(ev.date).toISOString().split("T")[0] : "";
          setFormData({
            title: ev.title || "",
            shortDescription: ev.shortDescription || "",
            description: ev.description || "",
            category: ev.category || "Technical Workshop",
            domain: ev.domain || "AI & Machine Learning",
            domainId: ev.domainId?._id || ev.domainId || "",
            eventType: ev.eventType || "Technical Workshop",
            priceType: ev.price > 0 ? "Paid" : "Free",
            price: ev.price || 0,
            mode: ev.mode || "Online",
            meetingPlatform: ev.meetingPlatform || "Google Meet",
            meetingLink: ev.meetingLink || "",
            venueName: ev.venueName || ev.venue || "",
            venueAddress: ev.venueAddress || ev.address || "",
            venueCity: ev.venueCity || ev.city || "",
            room: ev.room || "",
            date: dateStr,
            startTime: ev.startTime || "10:00 AM",
            endTime: ev.endTime || "12:00 PM",
            timezone: ev.timezone || "IST",
            capacity: ev.capacity || ev.maxAttendees || 100,
            eligibility: ev.eligibility || "Open to all verified students and alumni",
            topics: Array.isArray(ev.topics) ? ev.topics.join(", ") : "",
            bannerImage: ev.bannerImage || "",
          });
          if (ev.bannerImage) {
            setBannerPreview(getImageUrl(ev.bannerImage));
          }
        }
      } catch (err) {
        console.error("Failed to load event for edit:", err);
        setError("Unable to load event details for editing.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      priceType: type,
      price: type === "Free" ? 0 : prev.price > 0 ? prev.price : 199,
    }));
  };

  const handleModeChange = (mode) => {
    setFormData((prev) => ({ ...prev, mode }));
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (5MB max)
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!formData.title.trim()) {
      setError("Event title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Event description is required.");
      return;
    }
    if (!formData.date) {
      setError("Event date is required.");
      return;
    }

    // Time validation helper
    const parseTime = (t) => {
      if (!t) return 0;
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const p = match[3] ? match[3].toUpperCase() : null;
      if (p === "PM" && h < 12) h += 12;
      if (p === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };

    const startMinutes = parseTime(formData.startTime);
    const endMinutes = parseTime(formData.endTime);
    if (startMinutes && endMinutes && endMinutes <= startMinutes) {
      setError("Event end time cannot be earlier than or equal to start time.");
      return;
    }

    // Mode-specific validation
    if (formData.mode !== "Offline" && !formData.meetingLink.trim()) {
      setError("Please provide an online meeting link (Google Meet, Zoom, etc.).");
      return;
    }
    if (formData.mode !== "Online" && !formData.venueName.trim()) {
      setError("Please provide the physical venue name and location.");
      return;
    }

    if (formData.priceType === "Paid" && Number(formData.price) <= 0) {
      setError("Please specify a valid registration fee for paid events.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("shortDescription", formData.shortDescription.trim() || formData.description.slice(0, 160).trim());
      payload.append("description", formData.description.trim());
      payload.append("category", formData.category);
      payload.append("domain", formData.domain);
      payload.append("eventType", formData.category);
      payload.append("priceType", formData.priceType);
      payload.append("price", formData.priceType === "Free" ? 0 : Number(formData.price));
      payload.append("mode", formData.mode);
      payload.append("meetingPlatform", formData.meetingPlatform);
      payload.append("meetingLink", formData.meetingLink.trim());
      payload.append("venueName", formData.venueName.trim());
      payload.append("venueAddress", formData.venueAddress.trim());
      payload.append("venueCity", formData.venueCity.trim());
      payload.append("room", formData.room.trim());
      payload.append("date", formData.date);
      payload.append("startTime", formData.startTime);
      payload.append("endTime", formData.endTime);
      payload.append("timezone", formData.timezone);
      payload.append("capacity", Number(formData.capacity) || 100);
      payload.append("maxAttendees", Number(formData.capacity) || 100);
      payload.append("eligibility", formData.eligibility);

      if (formData.topics) {
        payload.append("topics", JSON.stringify(formData.topics.split(",").map((t) => t.trim()).filter(Boolean)));
      }

      if (bannerFile) {
        payload.append("bannerImage", bannerFile);
      } else if (formData.bannerImage) {
        payload.append("bannerImage", formData.bannerImage);
      }

      let res;
      if (isEditing) {
        res = await API.put(`/events/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await API.post("/events", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: isAdmin
              ? "Event published successfully!"
              : "Your event has been submitted for admin review.",
            type: "success",
          },
        })
      );

      navigate("/my-events");
    } catch (err) {
      console.error("Event submission error:", err);
      const serverMsg = err.response?.data?.message || "Failed to save event. Please check required fields.";
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="events-page-root">
        <div className="events-main-container" style={{ textAlign: "center", padding: "6rem 1rem" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Loading event details...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="events-page-root">
      <Toast />

      <div className="events-main-container" style={{ maxWidth: "1000px", paddingTop: "calc(76px + 32px)" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/events"
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
            <span>← Back to Events</span>
          </Link>
        </div>

        {/* Page Header */}
        <header style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "20px",
                backgroundColor: "rgba(220, 38, 38, 0.08)",
                color: "var(--primary-color)",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <Sparkles size={13} />
              <span>{isEditing ? "Event Editor" : "Host An Event"}</span>
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "2.25rem",
              fontWeight: 700,
              color: "var(--dark-color)",
              lineHeight: 1.2,
              marginBottom: "0.5rem",
            }}
          >
            {isEditing ? "Edit & Update Event" : "Create a Campus Event"}
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "700px" }}>
            Host high-impact workshops, webinars, hackathons, and networking sessions for the GradConnect student and alumni community.
          </p>

          {!isAdmin && (
            <div
              style={{
                marginTop: "1.25rem",
                backgroundColor: "rgba(37, 99, 235, 0.04)",
                border: "1px solid rgba(37, 99, 235, 0.2)",
                borderRadius: "12px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                color: "#1e3a8a",
                fontSize: "0.875rem",
                lineHeight: 1.5,
              }}
            >
              <Info size={20} style={{ flexShrink: 0, marginTop: "2px", color: "#2563eb" }} />
              <div>
                <strong>Alumni Moderation Note:</strong> All events created by alumni are initially set to <em>Pending Admin Approval</em>. University administration verifies event content to ensure high community standards before publishing to the public events directory.
              </div>
            </div>
          )}
        </header>

        {/* Error Callout */}
        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#991b1b",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Creation Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Section 1: Basic Information */}
          <div
            style={{
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "var(--shadow)",
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--dark-color)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar size={18} className="text-primary" />
              <span>1. Basic Information</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Master Class for Machine Learning"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  Short Summary / Tagline
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief one-line summary (shown on event cards)"
                  maxLength={160}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  Full Event Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Describe the topics covered, who should attend, session takeaways, and key speakers..."
                  required
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                    Event Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                    Engineering Domain *
                  </label>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {domains.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Event Type & Pricing */}
          <div
            style={{
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "var(--shadow)",
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--dark-color)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <DollarSign size={18} className="text-primary" />
              <span>2. Event Type &amp; Pricing</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div
                onClick={() => handlePriceTypeChange("Free")}
                style={{
                  border: `2px solid ${formData.priceType === "Free" ? "var(--primary-color)" : "var(--border-color)"}`,
                  backgroundColor: formData.priceType === "Free" ? "rgba(220, 38, 38, 0.04)" : "var(--bg-color)",
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--dark-color)" }}>Free Event</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Open attendance, no registration fee required
                </div>
              </div>

              <div
                onClick={() => handlePriceTypeChange("Paid")}
                style={{
                  border: `2px solid ${formData.priceType === "Paid" ? "var(--primary-color)" : "var(--border-color)"}`,
                  backgroundColor: formData.priceType === "Paid" ? "rgba(220, 38, 38, 0.04)" : "var(--bg-color)",
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--dark-color)" }}>Paid Event</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Requires registration fee per participant
                </div>
              </div>
            </div>

            {formData.priceType === "Paid" && (
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  Registration Fee (₹ INR) *
                </label>
                <div style={{ position: "relative", maxWidth: "300px" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min={1}
                    placeholder="499"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Event Mode & Venue / Meeting Link */}
          <div
            style={{
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "var(--shadow)",
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--dark-color)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Video size={18} className="text-primary" />
              <span>3. Event Mode &amp; Private Access Details</span>
            </h2>

            {/* Mode Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              {["Online", "Offline", "Hybrid"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeChange(m)}
                  style={{
                    padding: "0.85rem",
                    borderRadius: "12px",
                    border: `2px solid ${formData.mode === m ? "var(--primary-color)" : "var(--border-color)"}`,
                    backgroundColor: formData.mode === m ? "rgba(220, 38, 38, 0.04)" : "var(--bg-color)",
                    color: formData.mode === m ? "var(--primary-color)" : "var(--text-main)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Online Fields */}
            {(formData.mode === "Online" || formData.mode === "Hybrid") && (
              <div
                style={{
                  backgroundColor: "var(--bg-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  marginBottom: formData.mode === "Hybrid" ? "1.25rem" : 0,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "1rem", color: "var(--dark-color)" }}>
                  Online Meeting Setup
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "6px" }}>
                      Meeting Platform
                    </label>
                    <select
                      name="meetingPlatform"
                      value={formData.meetingPlatform}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.7rem 0.9rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--card-bg)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Other">Other Platform</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "6px" }}>
                      Meeting Link * (Protected)
                    </label>
                    <input
                      type="url"
                      name="meetingLink"
                      value={formData.meetingLink}
                      onChange={handleChange}
                      placeholder="https://meet.google.com/xyz-abc-def"
                      required={formData.mode !== "Offline"}
                      style={{
                        width: "100%",
                        padding: "0.7rem 0.9rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--card-bg)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>
                </div>

                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  🔒 <strong>Privacy Guarantee:</strong> This link is strictly protected. Only students and alumni with approved registrations will receive this access link.
                </p>
              </div>
            )}

            {/* Offline Fields */}
            {(formData.mode === "Offline" || formData.mode === "Hybrid") && (
              <div
                style={{
                  backgroundColor: "var(--bg-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "1rem", color: "var(--dark-color)" }}>
                  Physical Venue Details
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "6px" }}>
                      Venue / Facility Name *
                    </label>
                    <input
                      type="text"
                      name="venueName"
                      value={formData.venueName}
                      onChange={handleChange}
                      placeholder="e.g. Sri Eshwar College of Engineering, Main Auditorium"
                      required={formData.mode !== "Online"}
                      style={{
                        width: "100%",
                        padding: "0.7rem 0.9rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--card-bg)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "6px" }}>
                        Address *
                      </label>
                      <input
                        type="text"
                        name="venueAddress"
                        value={formData.venueAddress}
                        onChange={handleChange}
                        placeholder="e.g. Vadasithur Road, Kinathukadavu"
                        style={{
                          width: "100%",
                          padding: "0.7rem 0.9rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--card-bg)",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "6px" }}>
                        City *
                      </label>
                      <input
                        type="text"
                        name="venueCity"
                        value={formData.venueCity}
                        onChange={handleChange}
                        placeholder="e.g. Coimbatore"
                        style={{
                          width: "100%",
                          padding: "0.7rem 0.9rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--card-bg)",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "6px" }}>
                        Room / Hall
                      </label>
                      <input
                        type="text"
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        placeholder="e.g. Hall 3B"
                        style={{
                          width: "100%",
                          padding: "0.7rem 0.9rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--card-bg)",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Date, Time & Capacity */}
          <div
            style={{
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "var(--shadow)",
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--dark-color)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Clock size={18} className="text-primary" />
              <span>4. Date, Schedule &amp; Capacity</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  Event Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  Start Time *
                </label>
                <input
                  type="text"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  placeholder="10:00 AM"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  End Time *
                </label>
                <input
                  type="text"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  placeholder="12:00 PM"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                  Maximum Capacity (Seats) *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min={1}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, marginBottom: "6px" }}>
                Target Topics (Comma-separated)
              </label>
              <input
                type="text"
                name="topics"
                value={formData.topics}
                onChange={handleChange}
                placeholder="e.g. Neural Networks, PyTorch, Model Deployment, Career Insights"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  fontSize: "0.95rem",
                }}
              />
            </div>
          </div>

          {/* Section 5: Banner Image */}
          <div
            style={{
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "var(--shadow)",
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--dark-color)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <UploadCloud size={18} className="text-primary" />
              <span>5. Event Banner Image</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="file"
                id="bannerUploadInput"
                accept="image/*"
                onChange={handleBannerFileChange}
                style={{ display: "none" }}
              />

              <label
                htmlFor="bannerUploadInput"
                style={{
                  border: "2px dashed var(--border-color)",
                  borderRadius: "12px",
                  padding: "2rem 1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "var(--bg-color)",
                  transition: "all 0.2s",
                }}
              >
                <UploadCloud size={36} style={{ color: "var(--primary-color)", margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 700, color: "var(--dark-color)", fontSize: "0.95rem" }}>
                  Click to upload banner image
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  PNG, JPG, JPEG, WEBP (Max 5MB)
                </div>
              </label>

              {bannerPreview && (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <img
                    src={bannerPreview}
                    alt="Event banner preview"
                    style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: "10px",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      color: "#ffffff",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    Banner Preview
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Creator Information & Submission */}
          <div
            style={{
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "var(--shadow)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            {/* Creator Attribution Summary */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: isAdmin ? "#eff6ff" : "#fef2f2",
                  color: isAdmin ? "#2563eb" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  border: `2px solid ${isAdmin ? "#bfdbfe" : "#fecaca"}`,
                  overflow: "hidden",
                }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user?.name?.[0] || "U"
                )}
              </div>

              <div>
                <div style={{ fontSize: "0.775rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Posted by
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                  {isAdmin ? "GradConnect Admin" : user?.name || "Verified Alumni"}
                </div>
                <div style={{ fontSize: "0.8rem", color: isAdmin ? "#2563eb" : "#16a34a", fontWeight: 600 }}>
                  {isAdmin ? "Administrator" : "Alumni"}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => navigate("/events")}
                disabled={submitting}
                style={{
                  padding: "0.85rem 1.5rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--text-main)",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "0.85rem 2rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "var(--primary-color)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {submitting ? (
                  <>
                    <div className="spinner-small" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>
                      {isEditing
                        ? "Save & Update Event"
                        : isAdmin
                        ? "Publish Event Directly"
                        : "Submit Event for Approval"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default CreateEvent;
