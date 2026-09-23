import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  Trash2,
  Slash,
  RotateCcw,
  FileText,
  Award,
  Briefcase,
  GraduationCap,
  Download,
  ExternalLink,
} from "lucide-react";
import API from "../../api/axios";
import AdminPageContainer from "../../components/admin/AdminPageContainer";
import PermissionAlert from "../../components/admin/PermissionAlert";
import ErrorAlert from "../../components/admin/ErrorAlert";

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });

  // Action Loading & Target State
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Action Confirmation Modal (Suspend, Remove, Restore)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'approve' | 'suspend' | 'delete' | 'restore'
    user: null,
    reason: "",
  });

  // View Applicant Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError("");
    setPermissionDenied(false);
    setPermissionMessage("");
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        status: statusFilter,
        role: roleFilter,
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await API.get(`/admin/registrations?${params.toString()}`);
      setRegistrations(res.data.registrations || []);
      setPagination(res.data.pagination || { total: 0, pages: 1, limit: 10 });
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.menuBlocked) {
        setPermissionDenied(true);
        setPermissionMessage(
          err.response?.data?.message ||
          err.response?.data?.msg ||
          "You do not have permission to access the Registration Approval Queue."
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.msg ||
          "Unable to retrieve registration requests. Please refresh and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, roleFilter, search]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const notifyStateChange = () => {
    window.dispatchEvent(new Event("admin-data-updated"));
  };

  // 1. Direct or Confirmed Approve Action
  const handleApprove = async (user) => {
    setActionLoading(true);
    setError("");
    try {
      const res = await API.patch(`/admin/registrations/${user._id}/approve`);
      setSuccess(res.data.message || `Approved membership for ${user.name}`);
      setTimeout(() => setSuccess(""), 4000);
      notifyStateChange();
      fetchRegistrations();
      if (viewModalOpen) setViewModalOpen(false);
      setConfirmModal({ isOpen: false, type: "", user: null, reason: "" });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || "Failed to approve registration");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Rejection Modal Handlers
  const openRejectModal = (user) => {
    setTargetUser(user);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting this registration.");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      const res = await API.patch(`/admin/registrations/${targetUser._id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      setSuccess(res.data.message || `Rejected registration for ${targetUser.name}`);
      setTimeout(() => setSuccess(""), 4000);
      notifyStateChange();
      setRejectModalOpen(false);
      fetchRegistrations();
      if (viewModalOpen) setViewModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || "Failed to reject registration");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Suspend & Remove Confirmation Handlers
  const openConfirmModal = (type, user) => {
    setConfirmModal({
      isOpen: true,
      type,
      user,
      reason: "",
    });
  };

  const handleConfirmActionSubmit = async () => {
    const { type, user, reason } = confirmModal;
    if (!user) return;

    setActionLoading(true);
    setError("");

    try {
      if (type === "approve" || type === "restore") {
        await handleApprove(user);
        return;
      } else if (type === "suspend") {
        const res = await API.patch(`/admin/users/${user._id}/suspend`, {
          suspensionReason: reason.trim() || "Suspended by administrator",
        });
        setSuccess(res.data.message || `Suspended account for ${user.name}`);
      } else if (type === "delete") {
        const res = await API.delete(`/admin/registrations/${user._id}`);
        setSuccess(res.data.message || `Removed registration for ${user.name}`);
      }

      setTimeout(() => setSuccess(""), 4000);
      notifyStateChange();
      setConfirmModal({ isOpen: false, type: "", user: null, reason: "" });
      fetchRegistrations();
      if (viewModalOpen) setViewModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || `Failed to perform ${type} action`);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. View Details Modal
  const openViewModal = async (user) => {
    setSelectedApplicant(user);
    setViewModalOpen(true);
    try {
      const res = await API.get(`/admin/registrations/${user._id}`);
      if (res.data.registration || res.data.user) {
        setSelectedApplicant(res.data.registration || res.data.user);
      }
    } catch (e) {
      // Fallback to existing user object
    }
  };

  return (
    <AdminPageContainer>
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="header-info">
          <h1 className="admin-page-title">
            <UserCheck size={28} className="text-primary" />
            Registration Approval Queue
          </h1>
          <p className="admin-page-subtitle">
            Review, verify, and approve incoming student and alumni membership requests.
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          className="admin-btn-refresh"
          disabled={loading}
          title="Reload registration requests"
        >
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Permission Denied Alert - Rendered inside container, never floating */}
      {permissionDenied && (
        <PermissionAlert
          title="Access Restricted"
          message={permissionMessage}
          onRetry={fetchRegistrations}
          retryLoading={loading}
        />
      )}

      {/* Non-403 API Error Alert with Retry Action */}
      {error && !permissionDenied && (
        <ErrorAlert
          title="Failed to load registrations"
          message={error}
          onRetry={fetchRegistrations}
          retryLoading={loading}
        />
      )}

      {/* Action Success Alert */}
      {success && (
        <div className="admin-inline-success-alert">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Main content renders when user is permitted */}
      {!permissionDenied && (
        <>
          {/* Filter & Search Bar */}
      <div
        className="filter-card"
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
            { label: "All Statuses", value: "all" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: statusFilter === tab.value ? "var(--primary-color)" : "var(--border-color)",
                backgroundColor: statusFilter === tab.value ? "var(--primary-color)" : "transparent",
                color: statusFilter === tab.value ? "#ffffff" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Role Filter & Search */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: "1 1 320px", maxWidth: "500px" }}>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--card-bg)",
              color: "var(--text-main)",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
          </select>

          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--card-bg)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
              }}
            />
          </div>
        </div>
      </div>

      {/* Registrations Data Table */}
      <div
        className="table-card"
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--bg-color)",
                  borderBottom: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <th style={{ padding: "0.85rem 1rem" }}>Applicant</th>
                <th style={{ padding: "0.85rem 1rem" }}>Role</th>
                <th style={{ padding: "0.85rem 1rem" }}>Academic Info</th>
                <th style={{ padding: "0.85rem 1rem" }}>Batch</th>
                <th style={{ padding: "0.85rem 1rem" }}>Career Info</th>
                <th style={{ padding: "0.85rem 1rem" }}>Applied Date</th>
                <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`reg-skeleton-${idx}`} className="admin-skeleton-row">
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="skeleton-box skeleton-circle" style={{ width: "38px", height: "38px" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div className="skeleton-box" style={{ width: "120px", height: "13px" }} />
                          <div className="skeleton-box" style={{ width: "160px", height: "11px" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "80px", height: "20px", borderRadius: "10px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "110px", height: "13px", marginBottom: "4px" }} />
                      <div className="skeleton-box" style={{ width: "80px", height: "11px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "65px", height: "13px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "90px", height: "13px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "75px", height: "13px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "70px", height: "20px", borderRadius: "10px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div className="skeleton-box" style={{ width: "120px", height: "28px", marginLeft: "auto", borderRadius: "6px" }} />
                    </td>
                  </tr>
                ))
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <UserCheck size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
                      No registration requests found
                    </div>
                    <div style={{ fontSize: "0.825rem", marginTop: "4px" }}>
                      {statusFilter === "PENDING"
                        ? "All applicant requests have been processed."
                        : "Try adjusting your search query or filter settings."}
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((u) => {
                  const currentStatus = (u.status || u.accountStatus || "PENDING").toString().toUpperCase();
                  const isPending = currentStatus === "PENDING";
                  const isApproved = currentStatus === "APPROVED";
                  const isRejected = currentStatus === "REJECTED";
                  const isSuspended = currentStatus === "SUSPENDED";

                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background-color 0.15s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-color)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Applicant Name & Email */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <img
                            src={
                              u.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2563eb&color=fff`
                            }
                            alt={u.name}
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid var(--border-color)",
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{u.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "12px",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            backgroundColor: u.role === "student" ? "#e0f2fe" : "#fef3c7",
                            color: u.role === "student" ? "#0369a1" : "#b45309",
                          }}
                        >
                          {u.userType || (u.role === "student" ? "Current Student" : "Alumni")}
                        </span>
                      </td>

                      {/* Academic Info */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 600 }}>{u.department || "General"}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {u.degree ? `${u.degree} • ` : ""}{u.college || "GradConnect Central"}
                        </div>
                      </td>

                      {/* Batch */}
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                        {u.batch || u.graduationYear || "N/A"}
                      </td>

                      {/* Career Info */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {u.jobTitle || u.company ? (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.825rem" }}>{u.jobTitle || "Role"}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.company || ""}</div>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>

                      {/* Applied Date */}
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "0.85rem 1rem" }}>
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
                              : isApproved
                              ? "#dcfce7"
                              : isRejected
                              ? "#fee2e2"
                              : "#ffedd5",
                            color: isPending
                              ? "#854d0e"
                              : isApproved
                              ? "#15803d"
                              : isRejected
                              ? "#b91c1c"
                              : "#c2410c",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: isPending
                                ? "#ca8a04"
                                : isApproved
                                ? "#16a34a"
                                : isRejected
                                ? "#dc2626"
                                : "#ea580c",
                            }}
                          />
                          {currentStatus}
                        </span>
                      </td>

                      {/* Contextual Actions */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                          {/* [View] Button - Always Available */}
                          <button
                            onClick={() => openViewModal(u)}
                            title="View Full Application Profile"
                            style={{
                              padding: "0.38rem 0.6rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--card-bg)",
                              color: "var(--text-main)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            <Eye size={13} />
                            View
                          </button>

                          {/* For Pending Users: [Approve] [Reject] */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => openConfirmModal("approve", u)}
                                disabled={actionLoading}
                                title="Approve Registration"
                                style={{
                                  padding: "0.38rem 0.75rem",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "#16a34a",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <CheckCircle size={13} />
                                Approve
                              </button>

                              <button
                                onClick={() => openRejectModal(u)}
                                disabled={actionLoading}
                                title="Reject Registration"
                                style={{
                                  padding: "0.38rem 0.75rem",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "#dc2626",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <XCircle size={13} />
                                Reject
                              </button>
                            </>
                          )}

                          {/* For Approved Users: [Suspend] [Remove] */}
                          {isApproved && (
                            <>
                              <button
                                onClick={() => openConfirmModal("suspend", u)}
                                disabled={actionLoading}
                                title="Suspend Account"
                                style={{
                                  padding: "0.38rem 0.7rem",
                                  borderRadius: "6px",
                                  border: "1px solid #fed7aa",
                                  backgroundColor: "#fff7ed",
                                  color: "#c2410c",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Slash size={13} />
                                Suspend
                              </button>

                              <button
                                onClick={() => openConfirmModal("delete", u)}
                                disabled={actionLoading}
                                title="Remove User"
                                style={{
                                  padding: "0.38rem 0.7rem",
                                  borderRadius: "6px",
                                  border: "1px solid #fecaca",
                                  backgroundColor: "#fef2f2",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Trash2 size={13} />
                                Remove
                              </button>
                            </>
                          )}

                          {/* For Rejected Users: [Restore/Approve] [Delete] */}
                          {isRejected && (
                            <>
                              <button
                                onClick={() => openConfirmModal("restore", u)}
                                disabled={actionLoading}
                                title="Restore and Approve Registration"
                                style={{
                                  padding: "0.38rem 0.7rem",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "#16a34a",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <RotateCcw size={13} />
                                Restore
                              </button>

                              <button
                                onClick={() => openConfirmModal("delete", u)}
                                disabled={actionLoading}
                                title="Permanently Delete Application"
                                style={{
                                  padding: "0.38rem 0.7rem",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "#dc2626",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </>
                          )}

                          {/* For Suspended Users: [Activate] [Delete] */}
                          {isSuspended && (
                            <>
                              <button
                                onClick={() => openConfirmModal("approve", u)}
                                disabled={actionLoading}
                                title="Reactivate Account"
                                style={{
                                  padding: "0.38rem 0.7rem",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "#16a34a",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <CheckCircle size={13} />
                                Activate
                              </button>

                              <button
                                onClick={() => openConfirmModal("delete", u)}
                                disabled={actionLoading}
                                title="Remove User Account"
                                style={{
                                  padding: "0.38rem 0.7rem",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "#dc2626",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Trash2 size={13} />
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.825rem",
              color: "var(--text-muted)",
            }}
          >
            <div>
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> (
              {pagination.total} total)
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: page <= 1 ? "transparent" : "var(--card-bg)",
                  color: page <= 1 ? "var(--text-muted)" : "var(--text-main)",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: page >= pagination.pages ? "transparent" : "var(--card-bg)",
                  color: page >= pagination.pages ? "var(--text-muted)" : "var(--text-main)",
                  cursor: page >= pagination.pages ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL (APPROVE / SUSPEND / REMOVE / RESTORE) */}
      {confirmModal.isOpen && (
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
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-color)",
                backgroundColor:
                  confirmModal.type === "delete"
                    ? "#fef2f2"
                    : confirmModal.type === "suspend"
                    ? "#fff7ed"
                    : "#f0fdf4",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor:
                    confirmModal.type === "delete"
                      ? "#fee2e2"
                      : confirmModal.type === "suspend"
                      ? "#ffedd5"
                      : "#dcfce7",
                  color:
                    confirmModal.type === "delete"
                      ? "#dc2626"
                      : confirmModal.type === "suspend"
                      ? "#ea580c"
                      : "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {confirmModal.type === "delete" ? (
                  <Trash2 size={20} />
                ) : confirmModal.type === "suspend" ? (
                  <Slash size={20} />
                ) : (
                  <CheckCircle size={20} />
                )}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color:
                      confirmModal.type === "delete"
                        ? "#991b1b"
                        : confirmModal.type === "suspend"
                        ? "#9a3412"
                        : "#166534",
                  }}
                >
                  {confirmModal.type === "delete"
                    ? "Remove this member?"
                    : confirmModal.type === "suspend"
                    ? "Suspend Member Account?"
                    : "Approve this membership?"}
                </h3>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Candidate: <strong>{confirmModal.user?.name}</strong> ({confirmModal.user?.email})
                </div>
              </div>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                {confirmModal.type === "delete"
                  ? "Removing this account will revoke platform access and mark the profile as deactivated in GradConnect."
                  : confirmModal.type === "suspend"
                  ? "Suspending will immediately lock this member out of all platform areas until an administrator reactivates the account."
                  : "Approving will activate this account immediately, unlock all platform features, and dispatch a confirmation alert to the member."}
              </p>

              {confirmModal.type === "suspend" && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    Reason for Suspension (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={confirmModal.reason}
                    onChange={(e) => setConfirmModal({ ...confirmModal, reason: e.target.value })}
                    placeholder="e.g. Conduct review or incomplete verification details."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-main)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, type: "", user: null, reason: "" })}
                  disabled={actionLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmActionSubmit}
                  disabled={actionLoading}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      confirmModal.type === "delete"
                        ? "#dc2626"
                        : confirmModal.type === "suspend"
                        ? "#ea580c"
                        : "#16a34a",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {actionLoading
                    ? "Processing..."
                    : confirmModal.type === "delete"
                    ? "Confirm Removal"
                    : confirmModal.type === "suspend"
                    ? "Confirm Suspension"
                    : "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalOpen && (
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
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-color)",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XCircle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#991b1b" }}>
                  Reject Registration
                </h3>
                <div style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
                  Candidate: <strong>{targetUser?.name}</strong> ({targetUser?.email})
                </div>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Please provide a transparent reason for declining this applicant. This reason will be recorded in the
                audit trail and returned if they attempt to log in.
              </p>

              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    color: "var(--text-main)",
                  }}
                >
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Could not verify enrollment records in the specified department for batch 2026."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-main)",
                    fontSize: "0.875rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--text-main)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
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
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE APPLICANT REVIEW DRAWER / MODAL */}
      {viewModalOpen && selectedApplicant && (
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
              maxWidth: "760px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-color)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <img
                  src={
                    selectedApplicant.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplicant.name)}&background=2563eb&color=fff`
                  }
                  alt={selectedApplicant.name}
                  style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-color)" }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>{selectedApplicant.name}</h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedApplicant.email}</div>
                </div>
              </div>

              <button
                onClick={() => setViewModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.35rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Status Banner */}
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-color)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>ACCOUNT STATUS:</span>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                    {selectedApplicant.status || selectedApplicant.accountStatus || "PENDING"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>MEMBERSHIP IDENTITY:</span>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", textTransform: "capitalize" }}>
                    {selectedApplicant.userType || selectedApplicant.role}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>APPLIED DATE:</span>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    {new Date(selectedApplicant.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Personal Information
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Full Name:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.name}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Email Address:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.email}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Phone Number:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.phone || "Not provided"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Age:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.age || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Academic Information
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>College:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.college || "GradConnect Central University"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Department:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.department || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Degree:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.degree || "B.Tech"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Batch / Pass-out Year:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.batch || selectedApplicant.graduationYear || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Career & Headline Details */}
              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Career &amp; Professional Info
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Headline:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.headline || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Current Company:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.company || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Job Title:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.jobTitle || "N/A"}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Career Interests:</span>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{selectedApplicant.interestedField || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Skills & Interests */}
              {(selectedApplicant.skills?.length > 0 || selectedApplicant.interests?.length > 0) && (
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Skills &amp; Interests
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {selectedApplicant.skills?.map((s, idx) => (
                      <span key={idx} style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", backgroundColor: "#e2e8f0", fontSize: "0.75rem", fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                    {selectedApplicant.interests?.map((i, idx) => (
                      <span key={idx} style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", fontSize: "0.75rem", fontWeight: 600 }}>
                        #{i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedApplicant.bio && (
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Bio / About
                  </h4>
                  <div style={{ padding: "0.75rem", borderRadius: "8px", backgroundColor: "var(--bg-color)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    {selectedApplicant.bio}
                  </div>
                </div>
              )}

              {/* Resume & Documents */}
              {selectedApplicant.resume && (
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Resume Document
                  </h4>
                  <a
                    href={selectedApplicant.resume}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "6px",
                      backgroundColor: "#e0f2fe",
                      color: "#0369a1",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <Download size={14} />
                    View Submitted Resume
                  </a>
                </div>
              )}

              {/* Approval History if Available */}
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                  Verification History:
                </div>
                {selectedApplicant.approvedAt && (
                  <div>
                    • Approved on {new Date(selectedApplicant.approvedAt).toLocaleString()}
                    {selectedApplicant.approvedBy?.name ? ` by ${selectedApplicant.approvedBy.name}` : ""}
                  </div>
                )}
                {selectedApplicant.rejectedAt && (
                  <div style={{ color: "#dc2626" }}>
                    • Rejected on {new Date(selectedApplicant.rejectedAt).toLocaleString()}
                    {selectedApplicant.rejectedBy?.name ? ` by ${selectedApplicant.rejectedBy.name}` : ""}
                    {selectedApplicant.rejectionReason ? ` (Reason: ${selectedApplicant.rejectionReason})` : ""}
                  </div>
                )}
                {selectedApplicant.suspendedAt && (
                  <div style={{ color: "#ea580c" }}>
                    • Suspended on {new Date(selectedApplicant.suspendedAt).toLocaleString()}
                    {selectedApplicant.suspensionReason ? ` (Reason: ${selectedApplicant.suspensionReason})` : ""}
                  </div>
                )}
                {!selectedApplicant.approvedAt && !selectedApplicant.rejectedAt && !selectedApplicant.suspendedAt && (
                  <div>• Pending initial administrator review</div>
                )}
              </div>
            </div>

            {/* Modal Footer / Action Controls */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--bg-color)",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <Link
                to={`/admin/users/${selectedApplicant._id}`}
                style={{
                  fontSize: "0.825rem",
                  fontWeight: 700,
                  color: "var(--secondary-color)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                Open Member Profile Directory <ExternalLink size={13} />
              </Link>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                {selectedApplicant.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedApplicant)}
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
                      {actionLoading ? "Approving..." : "Approve Applicant"}
                    </button>
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        openRejectModal(selectedApplicant);
                      }}
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
                      Reject Applicant
                    </button>
                  </>
                )}

                {selectedApplicant.status === "APPROVED" && (
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      openConfirmModal("suspend", selectedApplicant);
                    }}
                    disabled={actionLoading}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#ea580c",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Suspend Account
                  </button>
                )}

                {selectedApplicant.status === "REJECTED" && (
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      openConfirmModal("restore", selectedApplicant);
                    }}
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
                    Restore &amp; Approve
                  </button>
                )}

                <button
                  onClick={() => setViewModalOpen(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--card-bg)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </AdminPageContainer>
  );
};

export default AdminRegistrations;
