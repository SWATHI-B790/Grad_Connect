import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

/**
 * Global Toast Notification component.
 * Positioned fixed in viewport, ensuring zero layout movement or horizontal overflow.
 */
export const Toast = () => {
  const [toast, setToast] = useState({
    visible: false,
    type: "info", // 'success' | 'error' | 'warning' | 'info'
    message: "",
  });

  useEffect(() => {
    // 1. Standard toast event listener
    const handleToastEvent = (e) => {
      const { message, type = "info" } = e.detail || {};
      if (!message) return;

      setToast({
        visible: true,
        type,
        message,
      });

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);

      return () => clearTimeout(timer);
    };

    // 2. Legacy event compatibility
    const handleRestrictedEvent = (e) => {
      const msg = e.detail?.message;
      if (!msg) return;

      setToast({
        visible: true,
        type: "warning",
        message: msg,
      });

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);

      return () => clearTimeout(timer);
    };

    window.addEventListener("show-toast", handleToastEvent);
    window.addEventListener("show-restricted-toast", handleRestrictedEvent);

    return () => {
      window.removeEventListener("show-toast", handleToastEvent);
      window.removeEventListener("show-restricted-toast", handleRestrictedEvent);
    };
  }, []);

  if (!toast.visible) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle size={18} className="toast-type-icon toast-icon-success" />;
      case "error":
        return <AlertCircle size={18} className="toast-type-icon toast-icon-error" />;
      case "warning":
        return <AlertTriangle size={18} className="toast-type-icon toast-icon-warning" />;
      default:
        return <Info size={18} className="toast-type-icon toast-icon-info" />;
    }
  };

  return (
    <div className={`admin-global-toast toast-${toast.type}`} role="status">
      <div className="toast-icon-wrapper">{getIcon()}</div>
      <div className="toast-content-wrapper">
        <span className="toast-message-text">{toast.message}</span>
      </div>
      <button
        onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
        className="toast-dismiss-btn"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
