import React from "react";

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-meta shimmer" />
        <div className="skeleton-line skeleton-title shimmer" />
        <div className="skeleton-line skeleton-text shimmer" />
        <div className="skeleton-line skeleton-text-short shimmer" />
        <div className="skeleton-footer shimmer" />
      </div>
    </div>
  );
};

export default SkeletonCard;
