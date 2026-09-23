import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Professional in-container error alert for API and network failures.
 * Stays strictly within the page container with an inline Retry action.
 */
export const ErrorAlert = ({
  title = "Failed to load registrations",
  message = "Unable to retrieve registration requests. Please refresh and try again.",
  onRetry = null,
  retryLoading = false,
}) => {
  return (
    <div className="admin-inline-error-alert" role="alert">
      <div className="inline-error-icon-wrap">
        <AlertTriangle size={22} className="inline-error-icon" />
      </div>

      <div className="inline-error-body">
        <h3 className="inline-error-title">{title}</h3>
        <p className="inline-error-message">{message}</p>
      </div>

      {onRetry && (
        <div className="inline-error-action">
          <button
            onClick={onRetry}
            disabled={retryLoading}
            className="inline-error-retry-btn"
          >
            <RefreshCw size={14} className={retryLoading ? "spin-icon" : ""} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorAlert;
