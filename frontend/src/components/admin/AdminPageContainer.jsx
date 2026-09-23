import React from "react";

/**
 * Standard content container for all Admin Panel pages.
 * Ensures consistent max-width, responsive padding, and prevents horizontal overflow.
 */
export const AdminPageContainer = ({ children, className = "", style = {} }) => {
  return (
    <div
      className={`admin-page-container ${className}`}
      style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default AdminPageContainer;
