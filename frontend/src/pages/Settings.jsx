import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar: "",
    password: "",
  });
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/admin/settings");
      if (res.data?.profile) {
        setProfile({
          name: res.data.profile.name || "",
          email: res.data.profile.email || "",
          avatar: res.data.profile.avatar || "",
          password: "",
        });
      }
      if (res.data?.system) {
        setSystem(res.data.system);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        avatar: profile.avatar.trim(),
      };
      if (profile.password && profile.password.trim()) {
        payload.password = profile.password.trim();
      }

      const res = await API.put("/admin/settings/profile", payload);
      setSuccess(res.data.message || "Admin profile updated successfully");
      if (res.data?.profile && setCurrentUser) {
        setCurrentUser({ ...currentUser, ...res.data.profile });
      }
      setProfile((prev) => ({ ...prev, password: "" }));
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <SettingsIcon size={28} className="text-primary" />
          Administrator Preferences &amp; Configuration
        </h1>
        <p className="page-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Manage your administrator profile, credential security, and inspect platform gating controls.
        </p>
      </div>

      {success && (
        <div
          className="alert alert-success"
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <CheckCircle size={18} /> {success}
        </div>
      )}

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
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem" }}>
        {/* Admin Profile Form Card */}
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            borderRadius: "14px",
            border: "1px solid var(--border-color)",
            padding: "1.5rem",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <h3
            style={{
              margin: "0 0 1.25rem",
              fontSize: "1.1rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <User size={18} className="text-secondary" /> Admin Profile Credentials
          </h3>

          <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Admin Display Name *
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Admin Email Address *
              </label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Profile Avatar URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Change Password (leave blank to keep current)
              </label>
              <input
                type="password"
                minLength={6}
                placeholder="••••••••"
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--primary-color)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                }}
              >
                {saving ? "Saving Changes..." : "Save Profile Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Platform Architecture & Health */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem",
                fontSize: "1.05rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ShieldCheck size={18} className="text-primary" /> Platform Gatekeeping
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Student Approval Gate:</span>
                <span style={{ fontWeight: 800, color: "#16a34a" }}>ENFORCED (PENDING)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Alumni Approval Gate:</span>
                <span style={{ fontWeight: 800, color: "#16a34a" }}>ENFORCED (PENDING)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Security Audit Logging:</span>
                <span style={{ fontWeight: 800, color: "#16a34a" }}>ACTIVE</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Platform Version:</span>
                <span style={{ fontWeight: 700 }}>GradConnect v2.4.0</span>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
            }}
          >
            <h3
              style={{
                margin: "0 0 0.5rem",
                fontSize: "1.05rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Server size={18} className="text-secondary" /> System Runtime
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
              Operating on Node.js + Express REST API architecture with MongoDB persistence and JWT httpOnly cookie security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
