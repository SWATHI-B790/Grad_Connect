import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  CheckCircle,
  Building,
  Bookmark,
  ExternalLink,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  X,
  AlertCircle,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import JobStatusBadge from "../components/JobStatusBadge";

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gradconnect_saved_jobs") || "{}");
    } catch {
      return {};
    }
  });

  // Modal states for details and delete
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const roleLower = user?.role?.toLowerCase() || "";
  const userTypeLower = user?.userType?.toLowerCase() || "";

  const isAdmin = Boolean(
    user &&
      ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(roleLower)
  );
  const isAlumni = Boolean(
    user &&
      (roleLower === "alumni" || userTypeLower === "alumni") &&
      !isAdmin
  );
  const isStudent = Boolean(
    user &&
      (roleLower === "student" || userTypeLower === "student") &&
      !isAdmin
  );

  // Exactly who can see "+ Post a Job"
  const canPost = isAlumni || isAdmin;

  // Role-based filters:
  // - Students: All, Full-Time, Internship, Remote
  // - Alumni: All, Full-Time, Internship, Remote, My Job Posts
  // - Admin: All, Full-Time, Internship, Remote (Admin manages all from /admin/jobs)
  const filterOptions = isAlumni
    ? ["All", "Full-Time", "Internship", "Remote", "My Job Posts"]
    : ["All", "Full-Time", "Internship", "Remote"];

  const fetchJobs = async () => {
    setLoading(true);
    setApiError("");
    try {
      if (activeFilter === "My Job Posts") {
        const res = await API.get("/jobs/my");
        setJobs(res.data.jobs || []);
      } else {
        let url = `/jobs?limit=50`;
        if (activeFilter === "Full-Time") url += `&type=Full-Time`;
        if (activeFilter === "Internship") url += `&type=Internship`;
        if (activeFilter === "Remote") url += `&workMode=Remote`;
        if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

        const res = await API.get(url);
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.error("Fetch jobs error:", err);
      setApiError("Unable to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleToggleSave = (jobId) => {
    setSavedJobs((prev) => {
      const updated = { ...prev, [jobId]: !prev[jobId] };
      try {
        localStorage.setItem("gradconnect_saved_jobs", JSON.stringify(updated));
      } catch {
        // Silently ignore storage errors
      }
      return updated;
    });
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/jobs/${jobToDelete._id}`);
      setSuccessMsg(`"${jobToDelete.title}" deleted successfully.`);
      setDeleteModalOpen(false);
      setJobToDelete(null);
      fetchJobs();
    } catch (err) {
      console.error("Delete job error:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
        return { bg: "#dcfce7", color: "#15803d", label: "Published" };
      case "DRAFT":
        return { bg: "#f1f5f9", color: "#475569", label: "Draft" };
      case "UNPUBLISHED":
        return { bg: "#fee2e2", color: "#b91c1c", label: "Unpublished" };
      case "CLOSED":
        return { bg: "#f3f4f6", color: "#6b7280", label: "Closed" };
      default:
        return { bg: "#f1f5f9", color: "#64748b", label: status || "Published" };
    }
  };

  return (
    <div className="jobs-page" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div className="jobs-page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {/* Page Hero Header */}
        <div className="jobs-hero-wrapper" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            className="jobs-eyebrow-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: "12px",
            }}
          >
            <Briefcase size={14} />
            <span>ALUMNI CAREER PORTAL</span>
          </div>

          <h1
            className="jobs-main-title"
            style={{
              fontFamily: "'Fraunces', serif, Georgia",
              fontSize: "2.35rem",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 10px",
            }}
          >
            Discover Opportunities From Your Alumni Network
          </h1>

          <p
            className="jobs-main-subtitle"
            style={{
              color: "#64748b",
              fontSize: "1rem",
              maxWidth: "680px",
              margin: "0 auto 1.5rem",
              lineHeight: 1.6,
            }}
          >
            Browse verified job postings, internship calls, and internal referral opportunities shared directly by GradConnect alumni and hiring managers.
          </p>

          {/* EXACTLY ONE PRIMARY ACTION: + Post a Job (for Alumni & Admin only, Student never sees it) */}
          {canPost && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "1.75rem" }}>
              <Link
                to="/jobs/create"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
              >
                <Plus size={16} style={{ color: "#ffffff", strokeWidth: 2.5 }} />
                <span>Post a Job</span>
              </Link>
            </div>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="jobs-search-wrapper" style={{ maxWidth: "600px", margin: "0 auto 1.5rem", display: "flex", alignItems: "center", position: "relative" }}>
            <Search size={18} className="jobs-search-icon" style={{ position: "absolute", left: "16px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search jobs by title, company, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="jobs-search-input"
              style={{
                width: "100%",
                padding: "12px 16px 12px 46px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem",
                outline: "none",
                background: "#ffffff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
                boxSizing: "border-box",
              }}
            />
          </form>

          {/* Filter Buttons */}
          <div className="jobs-filter-group" style={{ display: "inline-flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {filterOptions.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`jobs-filter-btn ${activeFilter === filter ? "active" : "inactive"}`}
                style={{
                  padding: "7px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeFilter === filter ? "#ffffff" : "transparent",
                  color: activeFilter === filter ? "#0f172a" : "#64748b",
                  boxShadow: activeFilter === filter ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {filter === "My Job Posts" ? `My Job Posts ${activeFilter === "My Job Posts" ? `(${jobs.length})` : ""}` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Success Notification */}
        {successMsg && (
          <div style={{ maxWidth: "600px", margin: "0 auto 1.5rem", padding: "10px 16px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#166534" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Job Cards Feed */}
        <div className="jobs-feed-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
              <p style={{ margin: 0, fontWeight: 500 }}>Loading career opportunities...</p>
            </div>
          ) : apiError ? (
            /* API ERROR STATE WITH RETRY BUTTON */
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #fee2e2",
                padding: "48px 24px",
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <AlertCircle size={40} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#991b1b", margin: "0 0 6px" }}>
                Unable to load jobs.
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 18px" }}>
                Please try again.
              </p>
              <button
                type="button"
                onClick={fetchJobs}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 22px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={15} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {jobs.length === 0 ? (
                /* EMPTY STATE */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="job-empty-state"
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    padding: "50px 24px",
                    textAlign: "center",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <Briefcase size={44} className="text-slate-400 mx-auto mb-3" />
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
                    {activeFilter === "My Job Posts" ? "You haven't posted any jobs yet" : "No opportunities available yet"}
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "440px", margin: "0 auto", lineHeight: 1.5 }}>
                    {activeFilter === "My Job Posts"
                      ? "Share your first opening or referral opportunity with the GradConnect community today."
                      : "Check back soon for new job postings and internship openings from our alumni network."}
                  </p>
                </motion.div>
              ) : (
                jobs.map((job, idx) => {
                  const isCreatorAdmin = job.createdByRole === "admin" || job.createdByRole === "superadmin";

                  // Normalized field values
                  const effectiveType = job.type || job.jobType || "Full-Time";
                  const effectiveMode = job.workMode || "Remote";
                  const effectiveSalary = job.salary || job.salaryRange || "";
                  const effectiveExperience = job.experience || job.experienceLevel || "";
                  const effectiveSkills = Array.isArray(job.skills) && job.skills.length > 0
                    ? job.skills
                    : Array.isArray(job.requirements)
                    ? job.requirements
                    : [];
                  const effectiveApplyUrl = job.applyUrl || job.applicationUrl || "";
                  const posterName = isCreatorAdmin
                    ? "GradConnect Admin"
                    : job.createdBy?.name || job.postedByName || "Verified Alumni";

                  return (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="job-opportunity-card"
                      style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        padding: "24px",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      }}
                    >
                      {/* Top Row: Icon + Title + Meta + Status (Status ONLY in My Job Posts) */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1, minWidth: "260px" }}>
                          {/* Company Logo / Avatar */}
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "10px",
                              background: "#eff6ff",
                              color: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              flexShrink: 0,
                              overflow: "hidden",
                              border: "1px solid #dbeafe",
                            }}
                          >
                            {job.companyLogo ? (
                              <img src={job.companyLogo} alt={job.company} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              job.company[0]
                            )}
                          </div>

                          {/* Title & Info */}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <h3
                                onClick={() => { setSelectedJob(job); setDetailModalOpen(true); }}
                                style={{
                                  fontSize: "1.15rem",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  margin: 0,
                                  cursor: "pointer",
                                }}
                              >
                                {job.title}
                              </h3>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#334155" }}>
                                  {effectiveType}
                                </span>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
                                  {effectiveMode}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#64748b", marginTop: "4px", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 600, color: "#1e293b" }}>{job.company}</span>
                              <span>•</span>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <MapPin size={13} className="text-slate-400" />
                                <span>{job.location}</span>
                              </span>
                              {effectiveExperience && (
                                <>
                                  <span>•</span>
                                  <span>{effectiveExperience}</span>
                                </>
                              )}
                              {effectiveSalary && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: "#166534", fontWeight: 600 }}>{effectiveSalary}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status badge & Management buttons ONLY in "My Job Posts" view. Never on public cards! */}
                        {activeFilter === "My Job Posts" && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <JobStatusBadge status={job.status} />

                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => navigate(`/jobs/edit/${job._id}`)}
                                title="Edit Opportunity"
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#2563eb",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Edit size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(job)}
                                title="Delete Opportunity"
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #fee2e2",
                                  background: "#ffffff",
                                  color: "#dc2626",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description snippet */}
                      <p
                        onClick={() => { setSelectedJob(job); setDetailModalOpen(true); }}
                        style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          color: "#475569",
                          lineHeight: 1.6,
                          cursor: "pointer",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {job.description}
                      </p>

                      {/* Skills Chips */}
                      {effectiveSkills.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {effectiveSkills.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: "0.75rem",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                background: "#f1f5f9",
                                color: "#334155",
                                fontWeight: 500,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Row: Poster Metadata + Actions */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "12px",
                          borderTop: "1px solid #f1f5f9",
                          fontSize: "0.825rem",
                          color: "#64748b",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {/* Posted By Information */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span>Posted by:</span>
                          <span style={{ fontWeight: 700, color: "#1e293b" }}>
                            {posterName}
                          </span>
                          {!isCreatorAdmin && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "1px 6px",
                                borderRadius: "10px",
                                background: "#f0fdf4",
                                color: "#16a34a",
                              }}
                            >
                              <CheckCircle size={11} />
                              <span>Verified Alumni</span>
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDate(job.publishedAt || job.createdAt)}</span>
                        </div>

                        {/* Actions: Save & Apply */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSave(job._id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "7px 12px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              background: savedJobs[job._id] ? "#fffbeb" : "#ffffff",
                              color: savedJobs[job._id] ? "#b45309" : "#475569",
                              fontSize: "0.825rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <Bookmark size={14} className={savedJobs[job._id] ? "fill-amber-600 text-amber-600" : ""} />
                            <span>{savedJobs[job._id] ? "Saved" : "Save"}</span>
                          </button>

                          {effectiveApplyUrl ? (
                            <a
                              href={effectiveApplyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 18px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#2563eb",
                                color: "#ffffff",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                textDecoration: "none",
                                boxShadow: "0 1px 3px rgba(37, 99, 235, 0.2)",
                              }}
                            >
                              <span>Apply Now</span>
                              <ExternalLink size={13} />
                            </a>
                          ) : job.contactEmail ? (
                            <a
                              href={`mailto:${job.contactEmail}?subject=Application for ${encodeURIComponent(job.title)} via GradConnect`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 18px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#2563eb",
                                color: "#ffffff",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                textDecoration: "none",
                              }}
                            >
                              <span>Contact Referrer</span>
                              <ExternalLink size={13} />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setSelectedJob(job); setDetailModalOpen(true); }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#1e293b",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <span>View Details</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal: Job Details View */}
      {detailModalOpen && selectedJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "#f1f5f9", color: "#475569" }}>
                  {selectedJob.type || selectedJob.jobType || "Full-Time"} • {selectedJob.workMode || "Remote"}
                </span>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "8px 0 4px" }}>
                  {selectedJob.title}
                </h3>
                <div style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.95rem" }}>
                  {selectedJob.company} • {selectedJob.location}
                </div>
              </div>
              <button type="button" onClick={() => setDetailModalOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.9rem", color: "#334155" }}>
              <div>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: "4px" }}>Description:</strong>
                <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#475569" }}>{selectedJob.description}</p>
              </div>

              {selectedJob.responsibilities && (
                <div>
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: "4px" }}>Responsibilities:</strong>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#475569" }}>{selectedJob.responsibilities}</p>
                </div>
              )}

              {selectedJob.qualifications && (
                <div>
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: "4px" }}>Qualifications:</strong>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#475569" }}>{selectedJob.qualifications}</p>
                </div>
              )}

              {/* Skills */}
              {((selectedJob.skills && selectedJob.skills.length > 0) || (selectedJob.requirements && selectedJob.requirements.length > 0)) && (
                <div>
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: "6px" }}>Required Skills:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(selectedJob.skills || selectedJob.requirements).map((s, idx) => (
                      <span key={idx} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.preferredSkills && selectedJob.preferredSkills.length > 0 && (
                <div>
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: "6px" }}>Preferred Skills:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedJob.preferredSkills.map((s, idx) => (
                      <span key={idx} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedJob.salary || selectedJob.salaryRange) && (
                <div>
                  <strong style={{ color: "#0f172a" }}>Salary / Compensation: </strong>
                  <span style={{ color: "#166534", fontWeight: 600 }}>{selectedJob.salary || selectedJob.salaryRange}</span>
                </div>
              )}

              {selectedJob.instructions && (
                <div style={{ background: "#fefce8", padding: "12px", borderRadius: "8px", border: "1px solid #fef08a" }}>
                  <strong style={{ color: "#854d0e", display: "block", marginBottom: "4px" }}>Referral Instructions:</strong>
                  <p style={{ margin: 0, color: "#713f12", fontSize: "0.85rem", lineHeight: 1.5 }}>{selectedJob.instructions}</p>
                </div>
              )}

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#64748b" }}>
                <div>Posted by: {selectedJob.createdByRole === "admin" ? "GradConnect Administrator" : selectedJob.createdBy?.name || selectedJob.postedByName || "Verified Alumni"}</div>
                <div>Posted on: {formatDate(selectedJob.publishedAt || selectedJob.createdAt)}</div>
                {selectedJob.deadline && <div>Application Deadline: {formatDate(selectedJob.deadline)}</div>}
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>

              {(selectedJob.applyUrl || selectedJob.applicationUrl) ? (
                <a
                  href={selectedJob.applyUrl || selectedJob.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 22px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>Apply on Company Site</span>
                  <ExternalLink size={14} />
                </a>
              ) : selectedJob.contactEmail ? (
                <a
                  href={`mailto:${selectedJob.contactEmail}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 22px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>Contact Referrer</span>
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteModalOpen && jobToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", maxWidth: "440px", width: "100%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Delete Job Posting?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{jobToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete Opportunity"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Jobs;
