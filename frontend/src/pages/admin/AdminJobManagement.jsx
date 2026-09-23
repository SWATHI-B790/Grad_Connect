import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Building,
  MapPin,
  Clock,
  X,
  ShieldCheck,
  Check,
  Ban,
} from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import JobStatusBadge from "../../components/JobStatusBadge";

const AdminJobManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, unpublished: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `/admin/jobs?status=${statusFilter}&type=${typeFilter}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await API.get(url);
      setJobs(res.data.jobs || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Fetch admin jobs error:", err);
      setError(err.response?.data?.message || "Failed to load administrative job listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    setActionLoading(true);

    // Immediate optimistic state update
    setJobs((prev) =>
      prev.map((j) => (j._id === job._id ? { ...j, status: newStatus } : j))
    );

    try {
      await API.patch(`/jobs/${job._id}/status`, { status: newStatus });
      setSuccess(`Job "${job.title}" is now ${newStatus.toLowerCase()}.`);
      fetchJobs();
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.response?.data?.message || "Failed to update job status.");
      fetchJobs();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    setActionLoading(true);
    try {
      await API.delete(`/jobs/${jobToDelete._id}`);
      setSuccess(`Job opportunity "${jobToDelete.title}" was deleted successfully.`);
      setDeleteModalOpen(false);
      setJobToDelete(null);
      fetchJobs();
    } catch (err) {
      console.error("Delete job error:", err);
      setError(err.response?.data?.message || "Failed to delete job.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="admin-jobs-management-page" style={{ padding: "1.75rem 2rem 3rem" }}>
      {/* Page Title & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ display: "inline-flex", padding: "6px", borderRadius: "8px", background: "#fef2f2", color: "#dc2626" }}>
              <Briefcase size={20} />
            </span>
            <h1 style={{ fontFamily: "'Fraunces', serif, Georgia", fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Job Opportunity Management
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.925rem", margin: 0 }}>
            Oversee, moderate, publish, and audit job and internship postings across all alumni and employer partners.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={fetchJobs}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <Link
            to="/jobs/create"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#dc2626",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
            }}
          >
            <Plus size={16} />
            <span>Post a Job</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Postings</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{stats.total}</div>
        </div>
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Published</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>{stats.published}</div>
        </div>
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "0.8rem", color: "#ea580c", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Drafts / Unpub</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#c2410c", marginTop: "4px" }}>{stats.draft + stats.unpublished}</div>
        </div>
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Closed</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#475569", marginTop: "4px" }}>{stats.closed}</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by job title, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "#ffffff",
                outline: "none",
              }}
            >
              <option value="All">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="UNPUBLISHED">Unpublished</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "#ffffff",
                outline: "none",
              }}
            >
              <option value="All">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Jobs Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-2" />
            <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading job opportunities...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b" }}>
            <Briefcase size={40} className="text-slate-300 mx-auto mb-2" />
            <p style={{ fontWeight: 600, fontSize: "1rem", color: "#334155", margin: 0 }}>No job postings found</p>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>
              Try changing the search keyword or filter options.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Job Opportunity</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Company</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Posted By</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Type</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Mode</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Posted Date</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, width: "155px", minWidth: "145px" }}>Status</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const isAlumniCreator = job.createdByRole === "alumni" || job.createdBy?.userType === "Alumni";

                return (
                  <tr key={job._id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}>
                    {/* Job Title */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                        {job.title}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                        {job.location} • {job.experience || "0-2 Years"}
                      </div>
                    </td>

                    {/* Company */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                          {job.company[0]}
                        </div>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>{job.company}</span>
                      </div>
                    </td>

                    {/* Posted By */}
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>
                        {job.createdBy?.name || job.postedByName || (isAlumniCreator ? "Verified Alumni" : "GradConnect Admin")}
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.725rem",
                          fontWeight: 600,
                          color: isAlumniCreator ? "#2563eb" : "#475569",
                          marginTop: "2px",
                        }}
                      >
                        {isAlumniCreator ? "Verified Alumni" : "Administrator"}
                      </span>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "0.775rem", padding: "4px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#334155", fontWeight: 600 }}>
                        {job.type || job.jobType || "Full-Time"}
                      </span>
                    </td>

                    {/* Work Mode */}
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "0.775rem", padding: "4px 8px", borderRadius: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>
                        {job.workMode || "Remote"}
                      </span>
                    </td>

                    {/* Posted Date */}
                    <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "0.825rem" }}>
                      {formatDate(job.publishedAt || job.createdAt)}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "14px 18px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <JobStatusBadge status={job.status} />
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => { setSelectedJob(job); setViewModalOpen(true); }}
                          title="View Details"
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            color: "#64748b",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/edit/${job._id}`)}
                          title="Edit Opportunity"
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            color: "#2563eb",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Edit size={14} />
                        </button>

                        {/* Publish / Unpublish Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(job)}
                          disabled={actionLoading}
                          title={job.status === "PUBLISHED" ? "Unpublish Opportunity" : "Publish Opportunity"}
                          style={{
                            padding: "5px 9px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: job.status === "PUBLISHED" ? "#fff1f2" : "#f0fdf4",
                            color: job.status === "PUBLISHED" ? "#e11d48" : "#16a34a",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {job.status === "PUBLISHED" ? (
                            <>
                              <Ban size={12} />
                              <span>Unpublish</span>
                            </>
                          ) : (
                            <>
                              <Check size={12} />
                              <span>Publish</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => { setJobToDelete(job); setDeleteModalOpen(true); }}
                          title="Delete Opportunity"
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #fee2e2",
                            background: "#ffffff",
                            color: "#dc2626",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: View Job Details */}
      {viewModalOpen && selectedJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", maxWidth: "640px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#475569" }}>
                    {selectedJob.type} • {selectedJob.workMode}
                  </span>
                  <JobStatusBadge status={selectedJob.status} />
                </div>
                <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                  {selectedJob.title}
                </h3>
                <div style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.95rem" }}>
                  {selectedJob.company} • {selectedJob.location}
                </div>
              </div>
              <button type="button" onClick={() => setViewModalOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.9rem", color: "#334155" }}>
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

              <div>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: "6px" }}>Required Skills:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedJob.skills.map((s, idx) => (
                    <span key={idx} style={{ fontSize: "0.75rem", padding: "3px 9px", borderRadius: "6px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {selectedJob.salary && (
                <div>
                  <strong style={{ color: "#0f172a" }}>Salary / Stipend: </strong>
                  <span>{selectedJob.salary}</span>
                </div>
              )}

              {selectedJob.applyUrl && (
                <div>
                  <strong style={{ color: "#0f172a", display: "block", marginBottom: "4px" }}>Application URL:</strong>
                  <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", wordBreak: "break-all" }}>
                    {selectedJob.applyUrl}
                  </a>
                </div>
              )}

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#64748b" }}>
                <div>Posted by: {selectedJob.createdBy?.name} ({selectedJob.createdByRole?.toUpperCase()})</div>
                <div>Created on: {formatDate(selectedJob.createdAt)}</div>
                {selectedJob.deadline && <div>Deadline: {formatDate(selectedJob.deadline)}</div>}
              </div>
            </div>

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
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
              Delete Opportunity?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{jobToDelete.title}"</strong>? This will permanently remove the opportunity listing.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={actionLoading}
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
                disabled={actionLoading}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "Deleting..." : "Delete Opportunity"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobManagement;
