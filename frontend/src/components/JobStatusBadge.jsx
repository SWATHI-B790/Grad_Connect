import React from "react";
import {
  CheckCircle2,
  Clock,
  Circle,
  MinusCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

/**
 * Normalized status configuration dictionary
 */
const STATUS_CONFIG = {
  published: {
    key: "published",
    label: "Published",
    Icon: CheckCircle2,
    className: "job-status-badge--published",
  },
  pending: {
    key: "pending",
    label: "Pending Review",
    Icon: Clock,
    className: "job-status-badge--pending",
  },
  draft: {
    key: "draft",
    label: "Draft",
    Icon: Circle,
    className: "job-status-badge--draft",
  },
  unpublished: {
    key: "unpublished",
    label: "Unpublished",
    Icon: MinusCircle,
    className: "job-status-badge--unpublished",
  },
  rejected: {
    key: "rejected",
    label: "Rejected",
    Icon: XCircle,
    className: "job-status-badge--rejected",
  },
  closed: {
    key: "closed",
    label: "Closed",
    Icon: AlertCircle,
    className: "job-status-badge--closed",
  },
};

/**
 * Normalize arbitrary status strings into standard canonical status keys
 */
const normalizeStatusKey = (rawStatus) => {
  if (!rawStatus) return "draft";
  const s = String(rawStatus).trim().toLowerCase().replace(/[\s_-]+/g, "");

  if (s === "published" || s === "active" || s === "approved") {
    return "published";
  }
  if (s === "pending" || s === "pendingreview" || s === "inreview" || s === "underreview") {
    return "pending";
  }
  if (s === "draft") {
    return "draft";
  }
  if (s === "unpublished" || s === "inactive") {
    return "unpublished";
  }
  if (s === "rejected" || s === "declined") {
    return "rejected";
  }
  if (s === "closed" || s === "archived" || s === "expired") {
    return "closed";
  }

  return "draft";
};

/**
 * Reusable JobStatusBadge Component
 *
 * Renders a compact, production-grade status indicator
 * with subtle borders, muted backgrounds, and clear iconography.
 */
const JobStatusBadge = ({ status, className = "", style = {} }) => {
  const normalizedKey = normalizeStatusKey(status);
  const config = STATUS_CONFIG[normalizedKey] || STATUS_CONFIG.draft;
  const { Icon, label, className: variantClass } = config;

  return (
    <span
      className={`job-status-badge ${variantClass} ${className}`.trim()}
      style={style}
      role="status"
      aria-label={`Status: ${label}`}
      title={`Job status is ${label}`}
    >
      <Icon size={13} className="job-status-badge__icon" strokeWidth={2.2} />
      <span className="job-status-badge__label">{label}</span>
    </span>
  );
};

export default JobStatusBadge;
