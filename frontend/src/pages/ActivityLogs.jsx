import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import API from "../api/axios";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });

  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        targetType,
        dateRange,
      });
      if (search.trim()) params.append("search", search.trim());

      const response = await API.get(`/admin/activity?${params.toString()}`);
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination || { total: 0, pages: 1, limit: 20 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, targetType, dateRange, search]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="admin-page-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={28} className="text-secondary" />
            Platform Security &amp; Audit Trail
          </h1>
          <p className="page-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Immutable chronological record of administrative actions, user state changes, and content operations.
          </p>
        </div>

        <button
          onClick={fetchActivityLogs}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.55rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--card-bg)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={15} /> Refresh Audit
        </button>
      </div>

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
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Filter Bar */}
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
          {/* Target Type Filter */}
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--card-bg)",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <option value="all">All Modules</option>
            <option value="User">User Management</option>
            <option value="Auth">Authentication</option>
            <option value="Blog">Blogs</option>
            <option value="Domain">Domain Articles</option>
            <option value="Event">Events</option>
            <option value="Settings">Settings</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--card-bg)",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* Search */}
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
            placeholder="Search action, actor, target..."
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
              fontSize: "0.85rem",
            }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
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
                <th style={{ padding: "0.85rem 1rem" }}>Timestamp</th>
                <th style={{ padding: "0.85rem 1rem" }}>Actor</th>
                <th style={{ padding: "0.85rem 1rem" }}>Action</th>
                <th style={{ padding: "0.85rem 1rem" }}>Module</th>
                <th style={{ padding: "0.85rem 1rem" }}>Description</th>
                <th style={{ padding: "0.85rem 1rem" }}>Resource</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <RefreshCw size={24} className="spin-icon" style={{ margin: "0 auto 0.5rem" }} />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <Activity size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
                      No audit activities found
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === "success";
                  const isApproval = log.action.includes("APPROVED");
                  const isSuspension = log.action.includes("SUSPENDED") || log.action.includes("REJECTED");
                  const isDelete = log.action.includes("DELETED");

                  return (
                    <tr
                      key={log._id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background-color 0.15s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-color)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(log.timestamp)}
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 700 }}>{log.performedByName}</div>
                        {log.performedByRole && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                            }}
                          >
                            {log.performedByRole}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "10px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            backgroundColor: isApproval
                              ? "#dcfce7"
                              : isSuspension || isDelete
                              ? "#fee2e2"
                              : "#e0f2fe",
                            color: isApproval
                              ? "#15803d"
                              : isSuspension || isDelete
                              ? "#b91c1c"
                              : "#0369a1",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>{log.targetType || "System"}</td>

                      <td style={{ padding: "0.85rem 1rem", color: "var(--text-main)", maxWidth: "340px" }}>
                        {log.description}
                      </td>

                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {log.targetResource || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} records)
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  cursor: page >= pagination.pages ? "not-allowed" : "pointer",
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
