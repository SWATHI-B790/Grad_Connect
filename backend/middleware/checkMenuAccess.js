const checkMenuAccess = (feature) => {
  return (req, res, next) => {
    try {
      // Superadmin and Admin have unrestricted menu access
      if (req.user && (req.user.role === "superadmin" || req.user.role === "admin")) {
        return next();
      }

      // Dashboard is accessible to all authenticated admins
      if (feature === "dashboard") {
        return next();
      }

      // Check if feature is included in allowedMenus array
      const allowed = req.user && req.user.allowedMenus && req.user.allowedMenus.includes(feature);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          menuBlocked: true,
          message: "You do not have permission to access this section.",
          msg: "You do not have permission to access this section.",
        });
      }

      next();
    } catch (error) {
      console.error("Check Menu Access Middleware Error:", error);
      return res.status(500).json({ message: "Server error checking menu permissions" });
    }
  };
};

module.exports = { checkMenuAccess };
