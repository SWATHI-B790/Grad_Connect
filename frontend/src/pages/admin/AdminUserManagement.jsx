import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Eye,
  Trash2,
  Slash,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  GraduationCap,
  Briefcase,
  SlidersHorizontal,
  X,
} from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import AdminPageContainer from "../../components/admin/AdminPageContainer";
import PermissionAlert from "../../components/admin/PermissionAlert";
import ErrorAlert from "../../components/admin/ErrorAlert";

const AdminUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  // Filters, search & sorting
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });

  // Add / Edit Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add_student' | 'add_alumni' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    userType: "Current Student",
    college: "GradConnect Central University",
    department: "",
    degree: "B.Tech",
    batch: "",
    graduationYear: "",
    jobTitle: "",
    company: "",
    industry: "",
    headline: "",
    bio: "",
    skills: "",
    phone: "",
    status: "APPROVED",
  });

  // Action Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'suspend' | 'activate' | 'delete'
    user: null,
    reason: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setPermissionDenied(false);
    setPermissionMessage("");
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: sortBy,
      });

      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (departmentFilter.trim()) params.append("department", departmentFilter.trim());
      if (batchFilter.trim()) params.append("batch", batchFilter.trim());
      if (search.trim()) params.append("search", search.trim());

      const res = await API.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { total: 0, pages: 1, limit: 10 });
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.menuBlocked) {
        setPermissionDenied(true);
        setPermissionMessage(
          err.response?.data?.message ||
          err.response?.data?.msg ||
          "You do not have permission to access the User Management Directory."
        );
      } else {
        setError(err.response?.data?.message || err.response?.data?.msg || "Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, roleFilter, statusFilter, departmentFilter, batchFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Add Modal
  const openAddModal = (targetRole) => {
    setModalMode(targetRole === "student" ? "add_student" : "add_alumni");
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: targetRole,
      userType: targetRole === "student" ? "Current Student" : "Alumni",
      college: "GradConnect Central University",
      department: "",
      degree: targetRole === "student" ? "B.Tech" : "B.Tech",
      batch: "",
      graduationYear: "",
      jobTitle: "",
      company: "",
      industry: "",
      headline: "",
      bio: "",
      skills: "",
      phone: "",
      status: "APPROVED",
    });
    setUserModalOpen(true);
  };

  // Open Edit Modal with prefilled existing data
  const openEditModal = (u) => {
    setModalMode("edit");
    setSelectedUser(u);
    setFormData({
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "student",
      userType: u.userType || (u.role === "student" ? "Current Student" : "Alumni"),
      college: u.college || "GradConnect Central University",
      department: u.department || "",
      degree: u.degree || "",
      batch: u.batch || "",
      graduationYear: u.graduationYear || "",
      jobTitle: u.jobTitle || "",
      company: u.company || "",
      industry: u.industry || "",
      headline: u.headline || "",
      bio: u.bio || "",
      skills: Array.isArray(u.skills) ? u.skills.join(", ") : u.skills || "",
      phone: u.phone || "",
      status: u.status || "APPROVED",
    });
    setUserModalOpen(true);
  };

  // Handle Save (Add / Edit)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");

    try {
      if (modalMode === "edit") {
        const payload = { ...formData };
        if (!payload.password || !payload.password.trim()) {
          delete payload.password;
        }
        const res = await API.put(`/admin/users/${selectedUser._id}`, payload);
        setSuccess(res.data.message || `User ${formData.name} updated successfully`);
      } else {
        const res = await API.post("/admin/users", formData);
        setSuccess(res.data.message || `Account created successfully`);
      }

      setUserModalOpen(false);
      setTimeout(() => setSuccess(""), 4000);
      window.dispatchEvent(new CustomEvent("admin-data-updated"));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Suspend, Activate, Delete Confirmation Submit
  const handleConfirmAction = async () => {
    const { type, user, reason } = confirmModal;
    if (!user) return;

    setModalLoading(true);
    setError("");

    try {
      if (type === "suspend") {
        const res = await API.patch(`/admin/users/${user._id}/suspend`, {
          suspensionReason: reason.trim() || "Suspended by admin",
        });
        setSuccess(res.data.message || `Suspended ${user.name}`);
      } else if (type === "activate") {
        const res = await API.patch(`/admin/users/${user._id}/activate`);
        setSuccess(res.data.message || `Activated ${user.name}`);
      } else if (type === "delete") {
        const res = await API.delete(`/admin/users/${user._id}`);
        setSuccess(res.data.message || `Deleted ${user.name}`);
      }

      setConfirmModal({ isOpen: false, type: "", user: null, reason: "" });
      setTimeout(() => setSuccess(""), 4000);
      window.dispatchEvent(new CustomEvent("admin-data-updated"));
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to perform ${type} action`);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <AdminPageContainer>
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="header-info">
          <h1 className="admin-page-title">
            <Users size={28} className="text-primary" />
            User Management Directory
          </h1>
          <p className="admin-page-subtitle">
            Search, manage, add, edit, suspend, and view comprehensive accounts across GradConnect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="header-actions" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => openAddModal("student")}
            className="admin-btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
            }}
          >
            <GraduationCap size={16} />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => openAddModal("alumni")}
            className="admin-btn-accent"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
            }}
          >
            <Briefcase size={16} />
            <span>Add Alumni</span>
          </button>

          <button
            onClick={fetchUsers}
            className="admin-btn-refresh"
            disabled={loading}
            title="Reload members list"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Permission Denied Alert */}
      {permissionDenied && (
        <PermissionAlert
          title="Access Restricted"
          message={permissionMessage}
          onRetry={fetchUsers}
          retryLoading={loading}
        />
      )}

      {/* Non-403 API Error Alert */}
      {error && !permissionDenied && (
        <ErrorAlert
          title="Failed to load users"
          message={error}
          onRetry={fetchUsers}
          retryLoading={loading}
        />
      )}

      {/* Success Notification */}
      {success && (
        <div className="admin-inline-success-alert">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {!permissionDenied && (
        <>
          {/* Filters, Search & Sorters */}
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
          gap: "0.85rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Role Filter */}
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
            <option value="student">Students</option>
            <option value="alumni">Alumni</option>
            <option value="admin">Administrators</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
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
            <option value="all">All Statuses</option>
            <option value="APPROVED">Approved / Active</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
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
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="name_desc">Sort: Name (Z-A)</option>
            <option value="recently_active">Sort: Recently Active</option>
          </select>
        </div>

        {/* Search Field */}
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "360px" }}>
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
            placeholder="Search name, email, department..."
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

      {/* Main Users Table */}
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
                <th style={{ padding: "0.85rem 1rem" }}>Member</th>
                <th style={{ padding: "0.85rem 1rem" }}>Role</th>
                <th style={{ padding: "0.85rem 1rem" }}>Academic / Org</th>
                <th style={{ padding: "0.85rem 1rem" }}>Batch</th>
                <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem" }}>Joined Date</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`user-skeleton-${idx}`} className="admin-skeleton-row">
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
                      <div className="skeleton-box" style={{ width: "75px", height: "20px", borderRadius: "10px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "130px", height: "13px", marginBottom: "4px" }} />
                      <div className="skeleton-box" style={{ width: "90px", height: "11px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "65px", height: "13px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "70px", height: "20px", borderRadius: "10px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div className="skeleton-box" style={{ width: "75px", height: "13px" }} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div className="skeleton-box" style={{ width: "100px", height: "28px", marginLeft: "auto", borderRadius: "6px" }} />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <Users size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>No members found</div>
                    <div style={{ fontSize: "0.825rem", marginTop: "4px" }}>
                      Try adjusting your search criteria or filters.
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.status === "SUSPENDED";
                  const isPending = u.status === "PENDING";
                  const isRejected = u.status === "REJECTED";
                  const isApproved = u.status === "APPROVED" || !u.status;
                  const isSelf = currentUser?._id === u._id;
                  const isTargetAdmin = ["admin", "subadmin", "superadmin"].includes(u.role);

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
                      {/* Avatar, Name, Email */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <img
                            src={
                              u.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=dc2626&color=fff`
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
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                              {u.name} {isSelf && <span style={{ fontSize: "0.7rem", color: "#2563eb" }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "12px",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            backgroundColor:
                              u.role === "student"
                                ? "#e0f2fe"
                                : u.role === "alumni"
                                ? "#fef3c7"
                                : "#ede9fe",
                            color:
                              u.role === "student"
                                ? "#0369a1"
                                : u.role === "alumni"
                                ? "#b45309"
                                : "#6d28d9",
                          }}
                        >
                          {u.userType || u.role}
                        </span>
                      </td>

                      {/* Department / Org */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 600 }}>{u.department || u.company || "GradConnect"}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {u.jobTitle || u.college || "Central University"}
                        </div>
                      </td>

                      {/* Batch */}
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                        {u.batch || u.graduationYear || "—"}
                      </td>

                      {/* Status Badge */}
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
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: isPending
                                ? "#ca8a04"
                                : isSuspended
                                ? "#dc2626"
                                : isRejected
                                ? "#ef4444"
                                : "#16a34a",
                            }}
                          />
                          {u.status || "APPROVED"}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                          {/* View Detail Page */}
                          <Link
                            to={`/admin/users/${u._id}`}
                            title="View Full Profile"
                            style={{
                              padding: "0.35rem 0.55rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--card-bg)",
                              color: "var(--text-main)",
                              display: "inline-flex",
                              alignItems: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <Eye size={13} />
                          </Link>

                          {/* Edit User Modal */}
                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit User Information"
                            style={{
                              padding: "0.35rem 0.55rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--card-bg)",
                              color: "#2563eb",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <Edit size={13} />
                          </button>

                          {/* Suspend or Activate */}
                          {!isSelf && (
                            <>
                              {isSuspended ? (
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      type: "activate",
                                      user: u,
                                      reason: "",
                                    })
                                  }
                                  title="Reactivate User"
                                  style={{
                                    padding: "0.35rem 0.55rem",
                                    borderRadius: "6px",
                                    border: "1px solid #bbf7d0",
                                    backgroundColor: "#f0fdf4",
                                    color: "#16a34a",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <CheckCircle size={13} />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      type: "suspend",
                                      user: u,
                                      reason: "",
                                    })
                                  }
                                  title="Suspend User Access"
                                  style={{
                                    padding: "0.35rem 0.55rem",
                                    borderRadius: "6px",
                                    border: "1px solid #fecaca",
                                    backgroundColor: "#fef2f2",
                                    color: "#dc2626",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Slash size={13} />
                                </button>
                              )}

                              {/* Delete Action (guarded for self and other admins) */}
                              {(!isTargetAdmin || currentUser?.role === "superadmin") && (
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      type: "delete",
                                      user: u,
                                      reason: "",
                                    })
                                  }
                                  title="Delete User"
                                  style={{
                                    padding: "0.35rem 0.55rem",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-color)",
                                    backgroundColor: "transparent",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                  onMouseOver={(e) => (e.currentTarget.style.color = "#dc2626")}
                                  onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
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
              {pagination.total} total members)
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

      {/* USER FORM MODAL (ADD / EDIT) */}
      {userModalOpen && (
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
              maxWidth: "680px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                {modalMode === "edit"
                  ? `Edit Profile: ${selectedUser?.name}`
                  : modalMode === "add_student"
                  ? "Add New Student Account"
                  : "Add New Alumni Account"}
              </h3>
              <button
                onClick={() => setUserModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.25rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Personal Information */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  {modalMode === "edit" ? "Update Password (leave blank to keep current)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={modalMode !== "edit"}
                  minLength={6}
                  placeholder={modalMode === "edit" ? "••••••••" : "Minimum 6 characters"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                />
              </div>

              {/* Academic Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Degree
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech, M.S."
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Batch / Class Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
              </div>

              {/* Career Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Microsoft"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Python, MongoDB"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                />
              </div>

              {/* Headline & About */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aspiring Full Stack Developer | CS '26"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  Bio / About
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief introductory summary..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  disabled={modalLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  {modalLoading ? "Saving..." : modalMode === "edit" ? "Update Member" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG (SUSPEND / ACTIVATE / DELETE) */}
      {confirmModal.isOpen && confirmModal.user && (
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
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 800 }}>
              {confirmModal.type === "suspend"
                ? `Suspend ${confirmModal.user.name}?`
                : confirmModal.type === "activate"
                ? `Reactivate ${confirmModal.user.name}?`
                : `Permanently Delete ${confirmModal.user.name}?`}
            </h3>

            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              {confirmModal.type === "suspend"
                ? "This user's login and session access will be immediately blocked until an administrator reactivates the account."
                : confirmModal.type === "activate"
                ? "This user will regain full login access to GradConnect."
                : "This action will permanently deactivate the user account and remove platform access. This action will be audited."}
            </p>

            {confirmModal.type === "suspend" && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  Suspension Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inappropriate behavior, account verification required"
                  value={confirmModal.reason}
                  onChange={(e) => setConfirmModal({ ...confirmModal, reason: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: "", user: null, reason: "" })}
                disabled={modalLoading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={modalLoading}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor:
                    confirmModal.type === "activate"
                      ? "#16a34a"
                      : "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {modalLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </AdminPageContainer>
  );
};

export default AdminUserManagement;
