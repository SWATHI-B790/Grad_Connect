const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    // Approval & status gate for non-admin accounts
    const isAdmin = ["admin", "subadmin", "superadmin", "admin1", "admin2"].includes(user.role);
    if (!isAdmin) {
      const rawStatus = (user.status || user.accountStatus || user.approvalStatus || "APPROVED").toString().toUpperCase();
      if (rawStatus === "PENDING") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_PENDING",
          message: "Your GradConnect account is awaiting administrator approval.",
        });
      }
      if (rawStatus === "REJECTED") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_REJECTED",
          message: "Your GradConnect registration was rejected.",
          rejectionReason: user.rejectionReason || "",
        });
      }
      if (rawStatus === "SUSPENDED") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message: "Your GradConnect account has been suspended.",
          suspensionReason: user.suspensionReason || "",
        });
      }
      if (user.isDeleted) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DELETED",
          message: "This account has been deactivated.",
        });
      }
    } else {
      const rawStatus = (user.status || user.accountStatus || "APPROVED").toString().toUpperCase();
      if (rawStatus === "SUSPENDED") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message: "Your admin account has been suspended.",
          suspensionReason: user.suspensionReason || "",
        });
      }
      if (user.isDeleted) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DELETED",
          message: "This admin account has been deactivated.",
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token invalid or expired" });
  }
};

// Explicit requireApprovedUser middleware
const requireApprovedUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const isAdmin = ["admin", "subadmin", "superadmin", "admin1", "admin2"].includes(req.user.role);
  if (isAdmin) return next();

  const rawStatus = (req.user.status || req.user.accountStatus || req.user.approvalStatus || "APPROVED").toString().toUpperCase();
  if (rawStatus === "PENDING") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_PENDING",
      message: "Your GradConnect account is awaiting administrator approval.",
    });
  }
  if (rawStatus === "REJECTED") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_REJECTED",
      message: "Your GradConnect registration was rejected.",
      rejectionReason: req.user.rejectionReason || "",
    });
  }
  if (rawStatus === "SUSPENDED") {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_SUSPENDED",
      message: "Your GradConnect account has been suspended.",
      suspensionReason: req.user.suspensionReason || "",
    });
  }
  if (req.user.isDeleted) {
    return res.status(403).json({
      success: false,
      code: "ACCOUNT_DELETED",
      message: "This account has been deactivated.",
    });
  }

  next();
};

// Middleware allowing subadmin, superadmin, and admin roles
const isAdminRole = (req, res, next) => {
  if (
    req.user &&
    ["subadmin", "superadmin", "admin", "admin1", "admin2"].includes(req.user.role?.toLowerCase())
  ) {
    if (req.user.status === "SUSPENDED" || req.user.isDeleted) {
      return res.status(403).json({
        success: false,
        msg: "Admin account suspended",
        message: "Your admin account has been suspended or deactivated.",
      });
    }
    next();
  } else {
    return res.status(403).json({
      success: false,
      msg: "Admin access required",
      message: "Administrative privileges required to access this resource.",
    });
  }
};

const requireAdmin = isAdminRole;

// Middleware allowing ONLY superadmin role
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "superadmin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      msg: "Superadmin access required",
      message: "Superadmin access required",
    });
  }
};

const requireSuperAdmin = isSuperAdmin;

// Role requirement factory
const requireRole = (allowedRoles = []) => {
  const normalized = allowedRoles.map((r) => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (normalized.includes(req.user.role?.toLowerCase())) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access restricted. Requires one of: ${allowedRoles.join(", ")}`,
    });
  };
};

// Middleware for optional authentication (attaches req.user if token present, continues anyway if not)
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore invalid/expired token for optional authentication
  }
  next();
};

// Middleware requiring verified Alumni role (and not Admin or Student)
const isAlumniRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const role = (req.user.role || "").toLowerCase();
  const userType = (req.user.userType || "").toLowerCase();
  const isAdmin = ["subadmin", "superadmin", "admin", "admin1", "admin2"].includes(role);

  const isAlumni = (role === "alumni" || userType === "alumni") && !isAdmin;

  if (isAlumni) {
    if (req.user.status === "SUSPENDED" || req.user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "Your alumni account has been suspended or deactivated.",
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Only verified alumni can author experience articles.",
  });
};

// Middleware allowing Alumni or Admin to create and manage job postings
const canPostJob = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const role = (req.user.role || "").toLowerCase();
  const userType = (req.user.userType || "").toLowerCase();
  const isAdmin = ["subadmin", "superadmin", "admin", "admin1", "admin2"].includes(role);
  const isAlumni = (role === "alumni" || userType === "alumni") && !isAdmin;

  if (isAdmin || isAlumni) {
    if (req.user.status === "SUSPENDED" || req.user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended or deactivated.",
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Only verified alumni and administrators can post jobs.",
  });
};

// Backwards compatibility alias
const adminOnly = isAdminRole;

module.exports = {
  protect,
  requireApprovedUser,
  optionalAuth,
  isAdminRole,
  isAlumniRole,
  canPostJob,
  isSuperAdmin,
  adminOnly,
  requireAdmin,
  requireSuperAdmin,
  requireRole,
};


