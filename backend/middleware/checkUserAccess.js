const User = require("../models/User");

const checkUserAccess = async (req, res, next) => {
  try {
    // Superadmin and Admin bypass checkUserAccess completely
    if (req.user && (req.user.role === "superadmin" || req.user.role === "admin")) {
      return next();
    }

    const targetUserId = req.params.id;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return next(); // Controller will handle 404
    }

    // Subadmins are not allowed to modify admin accounts
    if (["admin", "subadmin", "superadmin"].includes(targetUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can modify administrative accounts.",
        msg: "Only superadmin can modify administrative accounts.",
      });
    }

    // Subadmins with user_management permission can manage regular students and alumni
    if (req.user && req.user.allowedMenus && req.user.allowedMenus.includes("user_management")) {
      return next();
    }

    next();
  } catch (error) {
    console.error("Check User Access Middleware Error:", error);
    return res.status(500).json({ message: "Server error checking user permissions" });
  }
};

module.exports = { checkUserAccess };
