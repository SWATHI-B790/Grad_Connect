import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  XCircle,
  ArrowRight,
  UserCheck,
} from "lucide-react";

const Login = ({ defaultRole }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState(null);
  const [errorReason, setErrorReason] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, studentLogin, alumniLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const roleFromUrl = searchParams.get("role");
  const initialRole = defaultRole || (roleFromUrl === "student" ? "student" : "alumni");
  const [selectedRole, setSelectedRole] = useState(initialRole);

  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    } else {
      const roleParam = searchParams.get("role");
      if (roleParam === "student") {
        setSelectedRole("student");
      } else if (roleParam === "alumni") {
        setSelectedRole("alumni");
      }
    }
  }, [defaultRole, location.search]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setErrorCode(null);
    setErrorReason("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setErrorCode(null);
    setErrorReason("");

    try {
      let loggedUser;
      if (selectedRole === "student") {
        loggedUser = await studentLogin(formData.email.trim(), formData.password);
      } else {
        loggedUser = await alumniLogin(formData.email.trim(), formData.password);
      }

      // Handle post-login redirection
      const urlParams = new URLSearchParams(location.search);
      const from = location.state?.from?.pathname || location.state?.from || urlParams.get("from");

      if (from && !from.startsWith("/admin")) {
        navigate(from, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login failed:", err);
      const respData = err.response?.data;
      const code = respData?.code;
      setErrorCode(code || null);

      if (code === "ACCOUNT_PENDING") {
        setError(
          respData?.message ||
            "Your GradConnect account is awaiting administrator approval. You will be able to access the platform once your registration is approved."
        );
        setErrorReason("");
      } else if (code === "ACCOUNT_REJECTED") {
        setError(
          respData?.message ||
            "Your registration request was not approved. Please contact the GradConnect administrator for further information."
        );
        setErrorReason(respData?.rejectionReason || "");
      } else if (code === "ACCOUNT_SUSPENDED") {
        setError(respData?.message || "Your account has been suspended. Please contact the administrator.");
        setErrorReason(respData?.suspensionReason || "");
      } else if (code === "INVALID_PORTAL") {
        setError(respData?.message || "Please select the correct role for your account.");
      } else {
        setError(
          respData?.message ||
            respData?.msg ||
            "Invalid credentials. Please verify your email and password."
        );
        setErrorReason("");
      }
    } finally {
      setLoading(false);
    }
  };

  const isStudent = selectedRole === "student";

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div
            className="auth-logo-badge"
            style={{
              background: isStudent
                ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                : "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "#ffffff",
              boxShadow: isStudent
                ? "0 4px 14px rgba(37, 99, 235, 0.3)"
                : "0 4px 14px rgba(220, 38, 38, 0.3)",
            }}
          >
            {isStudent ? <GraduationCap size={28} /> : <Briefcase size={28} />}
          </div>
          <h2 className="auth-title">
            {isStudent ? "Student Member Login" : "Alumni Member Login"}
          </h2>
          <p className="auth-subtitle">
            {isStudent
              ? "Sign in to access campus networking, events, and mentor roadmaps"
              : "Sign in to share industry insights, host events, and mentor students"}
          </p>
        </div>

        {/* Dual Role Selector: Alumni vs Student */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            padding: "4px",
            background: "#f1f5f9",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedRole("alumni");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s ease",
              background: !isStudent ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "transparent",
              color: !isStudent ? "#ffffff" : "#475569",
              boxShadow: !isStudent ? "0 2px 8px rgba(220,38,38,0.25)" : "none",
            }}
          >
            <Briefcase size={15} />
            <span>Alumni</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("student");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s ease",
              background: isStudent ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
              color: isStudent ? "#ffffff" : "#475569",
              boxShadow: isStudent ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
            }}
          >
            <GraduationCap size={15} />
            <span>Student</span>
          </button>
        </div>

        {/* Error Alerts */}
        {error && (
          <div
            className={`alert ${
              errorCode === "ACCOUNT_PENDING"
                ? "alert-warning"
                : "alert-error"
            }`}
            style={{
              marginBottom: "18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 14px",
              borderRadius: "10px",
              backgroundColor: errorCode === "ACCOUNT_PENDING" ? "#fffbeb" : "#fef2f2",
              border: `1px solid ${errorCode === "ACCOUNT_PENDING" ? "#fde68a" : "#fecaca"}`,
              color: errorCode === "ACCOUNT_PENDING" ? "#92400e" : "#991b1b",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            {errorCode === "ACCOUNT_PENDING" ? (
              <Clock size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            ) : (
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            )}
            <div>
              <strong>{error}</strong>
              {errorReason && (
                <div style={{ marginTop: "4px", fontSize: "0.8rem", opacity: 0.95 }}>
                  Reason: {errorReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              {isStudent ? "Student Email Address" : "Alumni Email Address"}
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
                placeholder={isStudent ? "student@university.edu" : "alumni@company.com"}
                required
                autoComplete="email"
                style={{ paddingLeft: "42px" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
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
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                style={{ paddingLeft: "42px", paddingRight: "42px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{
              background: isStudent
                ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                : "linear-gradient(135deg, #dc2626, #b91c1c)",
              height: "46px",
              fontWeight: 700,
              fontSize: "0.925rem",
              borderRadius: "10px",
              marginTop: "8px",
            }}
          >
            {loading
              ? "Signing In..."
              : isStudent
              ? "Sign In as Student"
              : "Sign In as Alumni"}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer" style={{ marginTop: "24px" }}>
          <p>
            Don't have an account yet?{" "}
            <Link
              to="/register"
              style={{
                color: isStudent ? "#2563eb" : "#dc2626",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Create Free Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
