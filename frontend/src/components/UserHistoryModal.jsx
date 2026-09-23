import React from "react";

const UserHistoryModal = ({ isOpen, onClose, targetUser, history = [], loading = false }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case "created":
        return "badge-action-created";
      case "updated":
        return "badge-action-updated";
      case "deleted":
        return "badge-action-deleted";
      default:
        return "badge-action-default";
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card history-modal-card">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">📜 User Activity Timeline</h3>
            <p className="history-modal-subtitle">
              Audit log for <strong>{targetUser?.name || "User"}</strong> ({targetUser?.email})
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" type="button">
            &times;
          </button>
        </div>

        <div className="modal-body history-modal-body">
          {loading ? (
            <div className="history-loading">Fetching activity history...</div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              No activity logs recorded for this user yet.
            </div>
          ) : (
            <div className="timeline-container">
              {history.map((log) => {
                const adminName = log.performedBy?.name || "Administrator";
                const adminEmail = log.performedBy?.email;
                const adminLabel = log.performedBy?.adminLabel;

                return (
                  <div key={log._id} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                          {log.action.toUpperCase()}
                        </span>
                        <span className="timeline-timestamp">
                          🕒 {formatDate(log.timestamp)}
                        </span>
                      </div>

                      <div className="timeline-performer">
                        Performed by: <strong>{adminName}</strong>
                        {adminLabel && <span className="performer-label"> ({adminLabel})</span>}
                        {adminEmail && <span className="performer-email"> - {adminEmail}</span>}
                      </div>

                      {/* Display Action Diffs / Details */}
                      <div className="timeline-changes-box">
                        {log.action === "created" && (
                          <div className="change-detail">
                            <span className="detail-tag">Initial State:</span>
                            <div className="diff-list">
                              <div><strong>Name:</strong> {log.changes?.name || targetUser?.name}</div>
                              <div><strong>Email:</strong> {log.changes?.email || targetUser?.email}</div>
                              <div><strong>Role:</strong> {log.changes?.role || targetUser?.role}</div>
                            </div>
                          </div>
                        )}

                        {log.action === "updated" && log.changes && (
                          <div className="change-detail">
                            <span className="detail-tag">Field Changes:</span>
                            <div className="diff-list">
                              {Object.entries(log.changes).map(([field, diff]) => (
                                <div key={field} className="diff-item">
                                  <span className="diff-field">{field}:</span>{" "}
                                  <span className="diff-old">{String(diff.from)}</span> &rarr;{" "}
                                  <span className="diff-new">{String(diff.to)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.action === "deleted" && (
                          <div className="change-detail">
                            <span className="detail-tag">Deleted Snapshot:</span>
                            <div className="diff-list">
                              <div><strong>Name:</strong> {log.changes?.name || "N/A"}</div>
                              <div><strong>Email:</strong> {log.changes?.email || "N/A"}</div>
                              <div><strong>Role:</strong> {log.changes?.role || "N/A"}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserHistoryModal;
