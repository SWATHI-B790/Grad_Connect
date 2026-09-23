import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  Slash,
  BookOpen,
  Globe,
  Layers,
  FileText,
  Calendar,
  Activity,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AdminPageContainer from "../components/admin/AdminPageContainer";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAlumni: 0,
    totalAdmins: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalDomainArticles: 0,
    totalDomains: 0,
    totalEvents: 0,
  });

  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/admin/dashboard");
      if (response.data.stats) {
        setStats(response.data.stats);
      }
      if (response.data.recentRegistrations) {
        setRecentRegistrations(response.data.recentRegistrations);
      }
      if (response.data.recentActivities) {
        setRecentActivities(response.data.recentActivities);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load admin dashboard metrics. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleDataUpdate = () => {
      fetchDashboardData();
    };

    window.addEventListener("admin-data-updated", handleDataUpdate);
    return () => {
      window.removeEventListener("admin-data-updated", handleDataUpdate);
    };
  }, []);

  const handleQuickApprove = async (applicantId, name) => {
    setActionLoading(true);
    try {
      await API.patch(`/admin/registrations/${applicantId}/approve`);
      setToastMessage(`Approved ${name}`);
      setTimeout(() => setToastMessage(""), 4000);
      window.dispatchEvent(new CustomEvent("admin-data-updated"));
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const displayRole = user?.adminLabel || (user?.role === "superadmin" ? "Super Admin" : "Administrator");

  return (
    <AdminPageContainer>
      {/* Header Banner */}
      <div className="admin-page-header">
        <div className="header-info">
          <h1 className="admin-page-title">
            Executive Admin Control Center
          </h1>
          <p className="admin-page-subtitle">
            Welcome back, <strong>{user?.name}</strong>{" "}
            <span style={{ color: "var(--primary-color)", fontWeight: 700 }}>
              ({displayRole})
            </span>
            ! Real-time telemetry, membership gatekeeping, and content operations.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="admin-btn-refresh"
          title="Reload metrics"
        >
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {toastMessage && (
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <CheckCircle size={18} /> {toastMessage}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "10px",
            marginBottom: "1.25rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "6px",
              border: "1px solid #fca5a5",
              backgroundColor: "#ffffff",
              color: "#991b1b",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick Launch Management Modules */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <Link
            to="/admin/registrations"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: stats.pendingApprovals > 0 ? "1.5px solid #f87171" : "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--text-main, #0f172a)",
              fontWeight: 700,
              fontSize: "0.825rem",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              transition: "transform 0.15s ease",
            }}
          >
            <UserCheck size={16} className={stats.pendingApprovals > 0 ? "text-red-600" : "text-blue-600"} />
            <span>Registrations</span>
            {stats.pendingApprovals > 0 && (
              <span style={{ marginLeft: "auto", padding: "1px 6px", borderRadius: "999px", background: "#dc2626", color: "#fff", fontSize: "0.7rem" }}>
                {stats.pendingApprovals}
              </span>
            )}
          </Link>

          <Link
            to="/admin/users"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--text-main, #0f172a)",
              fontWeight: 700,
              fontSize: "0.825rem",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Users size={16} className="text-blue-600" />
            <span>Users Directory</span>
          </Link>

          <Link
            to="/admin/domains"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--text-main, #0f172a)",
              fontWeight: 700,
              fontSize: "0.825rem",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Layers size={16} className="text-indigo-600" />
            <span>Domains &amp; Tracks</span>
          </Link>

          <Link
            to="/admin/blogs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--text-main, #0f172a)",
              fontWeight: 700,
              fontSize: "0.825rem",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <BookOpen size={16} className="text-emerald-600" />
            <span>Blogs Hub</span>
          </Link>

          <Link
            to="/admin/events"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--text-main, #0f172a)",
              fontWeight: 700,
              fontSize: "0.825rem",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Calendar size={16} className="text-rose-600" />
            <span>Campus Events</span>
          </Link>

          <Link
            to="/admin/activity"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--text-main, #0f172a)",
              fontWeight: 700,
              fontSize: "0.825rem",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Activity size={16} className="text-amber-600" />
            <span>Audit Trail</span>
          </Link>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          <RefreshCw size={24} className="spin-icon" style={{ margin: "0 auto 0.5rem" }} />
          Loading system metrics...
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "1rem",
            marginBottom: "1.75rem",
          }}
        >
          {/* Pending Approvals (CRITICAL GATE) */}
          <Link
            to="/admin/registrations"
            style={{
              textDecoration: "none",
              color: "inherit",
              backgroundColor: stats.pendingApprovals > 0 ? "#fef2f2" : "var(--card-bg)",
              border: stats.pendingApprovals > 0 ? "2px solid #f87171" : "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCheck size={20} />
              </div>
              <span
                style={{
                  padding: "0.2rem 0.55rem",
                  borderRadius: "10px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  backgroundColor: stats.pendingApprovals > 0 ? "#dc2626" : "#e2e8f0",
                  color: stats.pendingApprovals > 0 ? "#ffffff" : "#475569",
                }}
              >
                {stats.pendingApprovals > 0 ? "Action Required" : "All Clear"}
              </span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#991b1b" }}>
              {stats.pendingApprovals}
            </div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Pending Approvals
            </div>
          </Link>

          {/* Total Members */}
          <Link
            to="/admin/users"
            style={{
              textDecoration: "none",
              color: "inherit",
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Directory</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.totalUsers}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Total Members
            </div>
          </Link>

          {/* Students */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GraduationCap size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Students</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.totalStudents}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Enrolled Students
            </div>
          </div>

          {/* Alumni */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#fef3c7",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Briefcase size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Graduates</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.totalAlumni}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Verified Alumni
            </div>
          </div>

          {/* Suspended Accounts */}
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Slash size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Restricted</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.suspendedUsers}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Suspended Accounts
            </div>
          </div>

          {/* Community Blogs */}
          <Link
            to="/admin/blogs"
            style={{
              textDecoration: "none",
              color: "inherit",
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#f0fdf4",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Feed</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.totalBlogs}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Community Posts
            </div>
          </Link>

          {/* Engineering Domains */}
          <Link
            to="/admin/domains"
            style={{
              textDecoration: "none",
              color: "inherit",
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#eff6ff",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Layers size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Domains</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.totalDomains || 9}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Engineering Tracks
            </div>
          </Link>

          {/* Domain Articles */}
          <Link
            to="/admin/domains"
            style={{
              textDecoration: "none",
              color: "inherit",
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#faf5ff",
                  color: "#9333ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Guides</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.totalDomainArticles}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Domain Articles
            </div>
          </Link>

          {/* Events */}
          <Link
            to="/admin/events"
            style={{
              textDecoration: "none",
              color: "inherit",
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#fff1f2",
                  color: "#e11d48",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Calendar size={20} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)" }}>Events</span>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900 }}>{stats.totalEvents}</div>
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
              Active Events
            </div>
          </Link>
        </motion.div>
      )}

      {/* Two-Column Operational Dashboard Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Pending Approvals Queue Widget */}
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            borderRadius: "14px",
            border: "1px solid var(--border-color)",
            padding: "1.25rem",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserCheck size={18} className="text-primary" />
              Pending Approvals Queue
            </h3>
            <Link
              to="/admin/registrations"
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--primary-color)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              View All ({stats.pendingApprovals}) <ArrowRight size={14} />
            </Link>
          </div>

          {recentRegistrations.filter((r) => r.status === "PENDING").length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
              <CheckCircle size={36} style={{ color: "#16a34a", margin: "0 auto 0.5rem", opacity: 0.8 }} />
              <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem" }}>
                Approval Queue is Empty
              </div>
              <div style={{ fontSize: "0.8rem", marginTop: "2px" }}>
                All student and alumni registrations are verified.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentRegistrations
                .filter((r) => r.status === "PENDING")
                .map((applicant) => (
                  <div
                    key={applicant._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <img
                        src={
                          applicant.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.name)}&background=2563eb&color=fff`
                        }
                        alt={applicant.name}
                        style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{applicant.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {applicant.userType || applicant.role} • {applicant.department || "General"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <Link
                        to={`/admin/users/${applicant._id}`}
                        style={{
                          padding: "0.35rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--card-bg)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          color: "var(--text-main)",
                        }}
                      >
                        Review
                      </Link>
                      <button
                        onClick={() => handleQuickApprove(applicant._id, applicant.name)}
                        disabled={actionLoading}
                        style={{
                          padding: "0.35rem 0.65rem",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Audit Activities */}
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            borderRadius: "14px",
            border: "1px solid var(--border-color)",
            padding: "1.25rem",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={18} className="text-secondary" />
              Live Platform Audit Trail
            </h3>
            <Link
              to="/admin/activity"
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--secondary-color)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              Full Log <ArrowRight size={14} />
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No audit activities recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {recentActivities.slice(0, 6).map((act) => (
                <div
                  key={act._id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-color)",
                    fontSize: "0.8rem",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: act.action.includes("APPROVED")
                        ? "#16a34a"
                        : act.action.includes("SUSPENDED") || act.action.includes("REJECTED")
                        ? "#dc2626"
                        : "#2563eb",
                      marginTop: "6px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{act.description}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1px" }}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • By {act.performedByName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminPageContainer>
  );
};

export default Dashboard;
