import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          backgroundColor: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "20px",
          padding: "3rem 2.25rem",
          textAlign: "center",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "18px",
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 4px 14px rgba(220, 38, 38, 0.15)",
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <h1
          style={{
            fontSize: "1.65rem",
            fontWeight: 800,
            color: "var(--dark-color, #0f172a)",
            marginBottom: "0.6rem",
            letterSpacing: "-0.02em",
          }}
        >
          Access Restricted
        </h1>

        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--text-muted, #64748b)",
            lineHeight: 1.55,
            marginBottom: "2rem",
          }}
        >
          You don't have permission to access this area. This section is restricted to authorized GradConnect administrators.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <Link
            to="/"
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            <Home size={16} />
            <span>Go to Home</span>
          </Link>

          {user && (
            <Link
              to="/profile"
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              <User size={16} />
              <span>Back to My Profile</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
