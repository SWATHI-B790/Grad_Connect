import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await adminLogin(formData.email.trim(), formData.password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      setError(
        err.response?.data?.message ||
          "Invalid administrative credentials. Please verify and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card admin-card border-admin" style={{ maxWidth: "440px" }}>
        <div className="auth-header">
          <div
            className="auth-logo-badge"
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
            }}
          >
            <Shield size={28} />
          </div>
          <h2 className="auth-title">Administrative Portal</h2>
          <p className="auth-subtitle">Restricted access for authorized university administrators</p>
        </div>

        {error && (
          <div
            className="alert alert-error"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" style={{ fontWeight: 700, fontSize: "0.85rem" }}>
              Administrator Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={17}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@gradconnect.edu"
                required
                autoComplete="email"
                style={{ paddingLeft: "42px" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ fontWeight: 700, fontSize: "0.85rem" }}>
              Security Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={17}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                style={{ paddingLeft: "42px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-dark btn-block"
            disabled={loading}
            style={{
              marginTop: "8px",
              height: "46px",
              fontWeight: 700,
              fontSize: "0.925rem",
              borderRadius: "10px",
            }}
          >
            {loading ? "Authenticating Administrator..." : "Sign In to Admin Center"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
