import React, { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import UserFormModal from "../components/UserFormModal";
import UserHistoryModal from "../components/UserHistoryModal";

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Modal State (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState("add"); // 'add' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formModalLoading, setFormModalLoading] = useState(false);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTargetUser, setHistoryTargetUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUsers = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await API.get("/admin/users");
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch users from server"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchUsers();
  }, []);

  // Recalculate stats from FULL users array
  const totalUsers = users.length;
  const totalAdmins = users.filter(
    (u) => u.role === "admin" || u.role === "subadmin" || u.role === "superadmin"
  ).length;
  const totalRegularUsers = users.filter((u) => u.role === "user").length;

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Permission check helper for Edit/Delete actions
  const canModifyUser = (targetUser) => {
    if (currentUser?.role === "superadmin") {
      return true;
    }
    if (currentUser?.role === "subadmin" && targetUser?.role === "user") {
      return targetUser.assignedTo === currentUser.adminLabel;
    }
    return false;
  };

  // Open Form Modal for Add User (Unrestricted for all admins)
  const handleOpenAddModal = () => {
    setFormModalMode("add");
    setSelectedUser(null);
    setIsFormModalOpen(true);
    setError("");
    setSuccess("");
  };

  // Open Form Modal for Edit User
  const handleOpenEditModal = (e, userToEdit) => {
    e.stopPropagation(); // Stop row click history modal trigger

    if (!canModifyUser(userToEdit)) {
      window.dispatchEvent(
        new CustomEvent("show-restricted-toast", {
          detail: { message: "Not assigned to you" },
        })
      );
      setError("Not assigned to you");
      return;
    }

    setFormModalMode("edit");
    setSelectedUser(userToEdit);
    setIsFormModalOpen(true);
    setError("");
    setSuccess("");
  };

  // Close Form Modal
  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedUser(null);
  };

  // Submit Add / Edit Form
  const handleFormModalSubmit = async (formData) => {
    setFormModalLoading(true);
    setError("");
    setSuccess("");

    try {
      if (formModalMode === "add") {
        const response = await API.post("/admin/users", formData);
        setSuccess(response.data.message || "User created successfully!");
      } else {
        const response = await API.put(
          `/admin/users/${selectedUser._id}`,
          formData
        );
        setSuccess(response.data.message || "User updated successfully!");
      }
      handleCloseFormModal();
      fetchUsers(true);
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.msg || "Operation failed. Please try again."
      );
    } finally {
      setFormModalLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (e, userToDelete) => {
    e.stopPropagation(); // Stop row click history modal trigger

    if (!canModifyUser(userToDelete)) {
      window.dispatchEvent(
        new CustomEvent("show-restricted-toast", {
          detail: { message: "Not assigned to you" },
        })
      );
      setError("Not assigned to you");
      return;
    }

    if (userToDelete._id === currentUser?.id || userToDelete._id === currentUser?._id) {
      setError("You cannot delete your own admin account.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete user "${userToDelete.name}" (${userToDelete.email})?`
    );

    if (!confirmDelete) return;

    setError("");
    setSuccess("");

    try {
      const response = await API.delete(`/admin/users/${userToDelete._id}`);
      setSuccess(response.data.message || "User deleted successfully!");
      fetchUsers(true);
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.msg || "Failed to delete user"
      );
    }
  };

  // Open User History Timeline Modal (Row Click)
  const handleRowClick = async (userToView) => {
    setHistoryTargetUser(userToView);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);

    try {
      const response = await API.get(`/admin/users/${userToView._id}/history`);
      setUserHistory(response.data.history || []);
    } catch (err) {
      console.error("Failed to load user history:", err);
      setUserHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Close History Modal
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setHistoryTargetUser(null);
    setUserHistory([]);
  };

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🎓 Member Management</h1>
          <p className="dashboard-subtitle">
            Manage alumni &amp; student accounts, verify credentials, and audit member activity
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary add-user-btn"
          >
            ➕ Add Member
          </button>
          <button
            onClick={() => fetchUsers(true)}
            className="btn btn-secondary refresh-btn"
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh Members"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card stat-admins">
          <div className="stat-value">{totalAdmins}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat-card stat-regular">
          <div className="stat-value">{totalRegularUsers}</div>
          <div className="stat-label">Alumni &amp; Students</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card">
        <div className="table-header-row">
          <div>
            <h2 className="table-title">GradConnect Member Directory</h2>
            <p className="table-instruction-subtitle">
              💡 Click any member row to view full Audit Timeline history.
            </p>
          </div>
          <span className="current-admin-indicator">
            Logged in as: <strong>{currentUser?.name}</strong> ({currentUser?.email})
          </span>
        </div>

        {loading ? (
          <div className="table-loading">Loading user records...</div>
        ) : users.length === 0 ? (
          <div className="table-empty">No users found in database.</div>
        ) : (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Registered At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf =
                    u._id === currentUser?.id || u._id === currentUser?._id;
                  const canModify = canModifyUser(u);

                  return (
                    <tr
                      key={u._id}
                      onClick={() => handleRowClick(u)}
                      className={`clickable-row ${isSelf ? "self-user-row" : ""}`}
                      title="Click to view full Activity Audit History"
                    >
                      <td className="user-name-cell">
                        <span className="user-name-text">{u.name}</span>{" "}
                        {isSelf && <span className="self-tag">(You)</span>}
                        <span className="history-hint-badge">📜 History</span>
                      </td>
                      <td className="user-email-cell">
                        <a
                          href={`mailto:${u.email}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {u.email}
                        </a>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      </td>
                      <td>{formatDate(u.lastLogin)}</td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td className="actions-cell">
                        <button
                          onClick={(e) => handleOpenEditModal(e, u)}
                          className={`action-btn action-edit ${!canModify ? "btn-disabled" : ""}`}
                          disabled={!canModify}
                          title={canModify ? "Edit User" : "Not assigned to you"}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteUser(e, u)}
                          className={`action-btn action-delete ${!canModify || isSelf ? "btn-disabled" : ""}`}
                          disabled={!canModify || isSelf}
                          title={
                            isSelf
                              ? "Cannot delete your own account"
                              : canModify
                              ? "Delete User"
                              : "Not assigned to you"
                          }
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Form Modal */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormModalSubmit}
        mode={formModalMode}
        initialData={selectedUser}
        loading={formModalLoading}
      />

      {/* User Activity History Timeline Modal */}
      <UserHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        targetUser={historyTargetUser}
        history={userHistory}
        loading={historyLoading}
      />
    </div>
  );
};

export default AdminDashboard;
