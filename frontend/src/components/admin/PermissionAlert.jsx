import React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

/**
 * Professional in-container authorization warning alert.
 * Renders cleanly inside AdminPageContainer and never overflows.
 */
export const PermissionAlert = ({
  title = "Access Restricted",
  message = "You do not have permission to access this section.",
  subtext = "Contact the Super Admin if you need access.",
  onRetry = null,
  retryLoading = false,
}) => {
  return (
    <div className="admin-permission-alert" role="alert">
      <div className="permission-alert-icon-wrap">
        <ShieldAlert size={22} className="permission-alert-icon" />
      </div>

      <div className="permission-alert-body">
        <div className="permission-alert-header">
          <h3 className="permission-alert-title">{title}</h3>
        </div>

        <p className="permission-alert-message">{message}</p>

        {subtext && (
          <p className="permission-alert-subtext">{subtext}</p>
        )}

        {onRetry && (
          <div className="permission-alert-actions">
            <button
              onClick={onRetry}
              disabled={retryLoading}
              className="permission-alert-retry-btn"
            >
              <RefreshCw size={14} className={retryLoading ? "spin-icon" : ""} />
              Retry Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionAlert;
