import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, AlertOctagon, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({
  adminOnly = false,
  roles = null,
  feature = null,
  redirectMessage = null,
}) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="loading-spinner-container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Verifying authorization...
        </p>
      </div>
    );
  }

  const isTargetingAdmin = location.pathname.startsWith("/admin");

  // 1. Guest / Unauthenticated Handling
  if (!user) {
    if (isTargetingAdmin) {
      return (
        <Navigate
          to="/admin/login"
          state={{ from: location }}
          replace
        />
      );
    }
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: redirectMessage || "Please log in to access this page.",
        }}
        replace
      />
    );
  }

  // Determine administrative privilege
  const roleLower = (user.role || "").toLowerCase();
  const primaryRoleUpper = (user.primaryRole || "").toUpperCase();
  const isAdmin =
    primaryRoleUpper === "ADMIN" ||
    user.role === "ADMIN" ||
    ["admin", "subadmin", "superadmin", "admin1", "admin2"].includes(roleLower);

  // 2. Strict Admin Route Isolation: Non-admins targeting /admin/* redirect to /unauthorized
  if (isTargetingAdmin || adminOnly) {
    if (!isAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 2b. Administrators do NOT have a public member profile - redirect to Admin Center
  if (isAdmin && (location.pathname === "/profile" || location.pathname.startsWith("/profile/"))) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // 3. Status & Approval Verification for non-admin accounts
  if (!isAdmin) {
    const rawStatus = (user.status || user.accountStatus || user.approvalStatus || "APPROVED")
      .toString()
      .toUpperCase();

    const handleSignOut = async () => {
      await logout();
      navigate("/login");
    };

    if (rawStatus === "PENDING") {
      return (
        <div
          style={{
            minHeight: "75vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid #fde68a",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(217, 119, 6, 0.08)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <Clock size={36} />
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--dark-color, #0f172a)",
                marginBottom: "0.75rem",
              }}
            >
              Pending Administrator Approval
            </h2>

            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-muted, #64748b)",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              Your GradConnect account is awaiting administrator approval. You will be able to access the platform once your registration is approved.
            </p>

            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1.75rem",
                textAlign: "left",
                fontSize: "0.85rem",
                color: "#92400e",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>Account Details:</div>
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Registered Role:</strong> {user.userType || (roleLower === "student" ? "Student" : "Alumni")}</div>
              {user.department && <div><strong>Department:</strong> {user.department}</div>}
              {user.batch && <div><strong>Batch:</strong> {user.batch}</div>}
            </div>

            <button
              onClick={handleSignOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                backgroundColor: "var(--card-bg, #ffffff)",
                color: "var(--text-main, #334155)",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    if (rawStatus === "REJECTED") {
      return (
        <div
          style={{
            minHeight: "75vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid #fecaca",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(220, 38, 38, 0.08)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <AlertTriangle size={36} />
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--dark-color, #0f172a)",
                marginBottom: "0.75rem",
              }}
            >
              Registration Not Approved
            </h2>

            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-muted, #64748b)",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              Your registration request was not approved. Please contact the GradConnect administrator for further information.
            </p>

            {user.rejectionReason && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.75rem",
                  textAlign: "left",
                  fontSize: "0.85rem",
                  color: "#991b1b",
                }}
              >
                <strong>Administrator Feedback:</strong>
                <p style={{ margin: "4px 0 0 0" }}>{user.rejectionReason}</p>
              </div>
            )}

            <button
              onClick={handleSignOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                borderRadius: "8px",
                border: "1px solid #fecaca",
                backgroundColor: "#ffffff",
                color: "#dc2626",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    if (rawStatus === "SUSPENDED") {
      return (
        <div
          style={{
            minHeight: "75vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "var(--card-bg, #ffffff)",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <AlertOctagon size={36} />
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--dark-color, #0f172a)",
                marginBottom: "0.75rem",
              }}
            >
              Account Suspended
            </h2>

            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-muted, #64748b)",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              Your GradConnect account has been temporarily suspended. Please contact the campus administrator for assistance.
            </p>

            <button
              onClick={handleSignOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #cbd5e1)",
                backgroundColor: "var(--card-bg, #ffffff)",
                color: "var(--text-main, #334155)",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  }

  // 4. Role-specific validation if roles prop is passed
  if (roles && Array.isArray(roles) && roles.length > 0) {
    const normalizedRoles = roles.map((r) => r.toLowerCase());
    const hasAllowedRole =
      normalizedRoles.includes(roleLower) ||
      (primaryRoleUpper && normalizedRoles.includes(primaryRoleUpper.toLowerCase())) ||
      (normalizedRoles.some((r) => ["admin", "subadmin", "superadmin"].includes(r)) && isAdmin);

    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 5. Check per-page menu feature permission for subadmins
  if (isAdmin && user.role !== "superadmin" && user.adminRole !== "SUPER_ADMIN" && feature && feature !== "dashboard") {
    const allowedMenus = user.allowedMenus || [];
    if (!allowedMenus.includes(feature)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export const AdminRoute = (props) => (
  <ProtectedRoute {...props} adminOnly={true} />
);

export const ApprovedUserRoute = (props) => <ProtectedRoute {...props} />;

export default ProtectedRoute;
