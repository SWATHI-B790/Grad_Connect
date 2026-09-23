import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Slash,
  Trash2,
  Edit,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Briefcase,
  Award,
  FileText,
  Clock,
  Shield,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals for Reject & Suspend
  const [reasonModal, setReasonModal] = useState({
    isOpen: false,
    type: "", // 'reject' | 'suspend'
    reason: "",
  });

  const fetchUserDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/admin/users/${id}`);
      setUser(res.data.user);
      setAuditLogs(res.data.auditLogs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await API.patch(`/admin/users/${id}/approve`);
      setSuccess(res.data.message || "Account approved successfully");
      setTimeout(() => setSuccess(""), 4000);
      fetchUserDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      const res = await API.patch(`/admin/users/${id}/activate`);
      setSuccess(res.data.message || "Account activated successfully");
      setTimeout(() => setSuccess(""), 4000);
      fetchUserDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReasonSubmit = async (e) => {
    e.preventDefault();
    if (!reasonModal.reason.trim()) return;

    setActionLoading(true);
    try {
      if (reasonModal.type === "reject") {
        const res = await API.patch(`/admin/users/${id}/reject`, {
          rejectionReason: reasonModal.reason.trim(),
        });
        setSuccess(res.data.message || "Account rejected");
      } else if (reasonModal.type === "suspend") {
        const res = await API.patch(`/admin/users/${id}/suspend`, {
          suspensionReason: reasonModal.reason.trim(),
        });
        setSuccess(res.data.message || "Account suspended");
      }
      setReasonModal({ isOpen: false, type: "", reason: "" });
      setTimeout(() => setSuccess(""), 4000);
      fetchUserDetails();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${user.name}? This action will be audited.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await API.delete(`/admin/users/${id}`);
      navigate("/admin/users", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={28} className="spin-icon" style={{ margin: "0 auto 1rem" }} />
        Loading complete profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <AlertCircle size={40} style={{ color: "#dc2626", margin: "0 auto 1rem" }} />
        <h2>User Not Found</h2>
        <Link to="/admin/users" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
          Back to Directory
        </Link>
      </div>
    );
  }

  const isPending = user.status === "PENDING";
  const isSuspended = user.status === "SUSPENDED";
  const isRejected = user.status === "REJECTED";
  const isSelf = currentUser?._id === user._id;

  return (
    <div className="admin-page-container" style={{ maxWidth: "1180px", margin: "0 auto" }}>
      {/* Back Link */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to="/admin/users"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} /> Back to User Directory
        </Link>
      </div>

      {/* Notifications */}
      {success && (
        <div
          className="alert alert-success"
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {error && (
        <div
          className="alert alert-error"
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Profile Header Card */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          <img
            src={
              user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=dc2626&color=fff`
            }
            alt={user.name}
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid var(--border-color)",
            }}
          />

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>{user.name}</h2>

              {/* Role Pill */}
              <span
                style={{
                  display: "inline-block",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  backgroundColor: user.role === "student" ? "#e0f2fe" : "#fef3c7",
                  color: user.role === "student" ? "#0369a1" : "#b45309",
                }}
              >
                {user.userType || user.role}
              </span>

              {/* Status Badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "12px",
                  fontSize: "0.725rem",
                  fontWeight: 800,
                  backgroundColor: isPending
                    ? "#fef9c3"
                    : isSuspended
                    ? "#fef2f2"
                    : isRejected
                    ? "#fee2e2"
                    : "#dcfce7",
                  color: isPending
                    ? "#854d0e"
                    : isSuspended
                    ? "#991b1b"
                    : isRejected
                    ? "#b91c1c"
                    : "#15803d",
                }}
              >
                {user.status || "APPROVED"}
              </span>
            </div>

            <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {user.headline || `${user.department || "Student"} • ${user.college || "GradConnect"}`}
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {isPending && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Approve Account
              </button>
              <button
                onClick={() => setReasonModal({ isOpen: true, type: "reject", reason: "" })}
                disabled={actionLoading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Reject
              </button>
            </>
          )}

          {!isPending && !isSelf && (
            <>
              {isSuspended ? (
                <button
                  onClick={handleActivate}
                  disabled={actionLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    backgroundColor: "#f0fdf4",
                    color: "#166534",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Reactivate Access
                </button>
              ) : (
                <button
                  onClick={() => setReasonModal({ isOpen: true, type: "suspend", reason: "" })}
                  disabled={actionLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    backgroundColor: "#fef2f2",
                    color: "#991b1b",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Suspend
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={actionLoading}
                style={{
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left Column: Academic & Personal */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Academic Information */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.25rem",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem",
                fontSize: "1rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <GraduationCap size={18} className="text-primary" /> Academic Profile
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>College</span>
                <strong>{user.college || "GradConnect Central University"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>Department</span>
                <strong>{user.department || "General"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>Degree</span>
                <strong>{user.degree || "B.Tech"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>Batch Year</span>
                <strong>{user.batch || user.graduationYear || "N/A"}</strong>
              </div>
            </div>
          </div>

          {/* Professional & Career */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.25rem",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem",
                fontSize: "1rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Briefcase size={18} className="text-secondary" /> Career &amp; Experience
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>Current Organization</span>
                <strong>{user.company || "Not specified"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>Designation</span>
                <strong>{user.jobTitle || "Not specified"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>Industry</span>
                <strong>{user.industry || "Software & Technology"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block" }}>Phone Contact</span>
                <strong>{user.phone || "Not provided"}</strong>
              </div>
            </div>
          </div>

          {/* Skills & Bio */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.25rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 800 }}>About &amp; Summary</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-main)", lineHeight: 1.6 }}>
              {user.bio || "No summary provided by applicant."}
            </p>

            <h4 style={{ margin: "1rem 0 0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Skills &amp; Competencies
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No skills listed</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Experience, Certifications, Audit History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Experience Timeline */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.25rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 800 }}>Experience History</h3>
            {user.experience && user.experience.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {user.experience.map((exp, idx) => (
                  <div key={idx} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{exp.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {exp.company} • {exp.startDate} - {exp.currentlyWorking ? "Present" : exp.endDate}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No external experience records.</div>
            )}
          </div>

          {/* Certifications & Achievements */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.25rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 800 }}>Certifications &amp; Honors</h3>
            {user.certifications && user.certifications.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {user.certifications.map((c, idx) => (
                  <div key={idx} style={{ fontSize: "0.85rem" }}>
                    <strong>{c.name}</strong> <span style={{ color: "var(--text-muted)" }}>— {c.organization}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No certifications recorded.</div>
            )}
          </div>

          {/* Audit History Log for this User */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.25rem",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem",
                fontSize: "1rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Clock size={18} className="text-amber" /> Administrative Audit Log
            </h3>
            {auditLogs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "260px", overflowY: "auto" }}>
                {auditLogs.map((log) => (
                  <div
                    key={log._id}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <strong style={{ color: "var(--primary-color)" }}>{log.action}</strong>
                      <span style={{ color: "var(--text-muted)" }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-main)" }}>{log.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No audit records for this account yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* REJECTION / SUSPENSION REASON MODAL */}
      {reasonModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              padding: "1.5rem",
              border: "1px solid var(--border-color)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 800 }}>
              {reasonModal.type === "reject" ? "Specify Rejection Reason" : "Specify Suspension Reason"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Please enter the official justification. This will be stored in the audit record.
            </p>

            <form onSubmit={handleReasonSubmit}>
              <textarea
                required
                rows={3}
                value={reasonModal.reason}
                onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
                placeholder="Enter justification..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  marginBottom: "1rem",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setReasonModal({ isOpen: false, type: "", reason: "" })}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetail;
