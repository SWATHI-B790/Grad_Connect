const UsageLog = require("../models/UsageLog");

const checkUsageLimit = (feature, limit = 3) => {
  return async (req, res, next) => {
    try {
      // Superadmin and Admin have unlimited access and create no UsageLog
      if (req.user.role === "superadmin" || req.user.role === "admin") {
        return next();
      }

      // Format today's date consistently in YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];

      // Check current count
      let existingLog = await UsageLog.findOne({
        admin: req.user._id,
        feature,
        date: today,
      });

      if (existingLog && existingLog.count >= limit) {
        return res.status(403).json({
          restricted: true,
          msg: "Your access is restricted. It will be renewed tomorrow.",
        });
      }

      // Atomically increment or insert usage log
      const updatedLog = await UsageLog.findOneAndUpdate(
        { admin: req.user._id, feature, date: today },
        { $inc: { count: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Guard against race conditions exceeding limit
      if (updatedLog.count > limit) {
        await UsageLog.updateOne(
          { admin: req.user._id, feature, date: today },
          { $inc: { count: -1 } }
        );
        return res.status(403).json({
          restricted: true,
          msg: "Your access is restricted. It will be renewed tomorrow.",
        });
      }

      next();
    } catch (error) {
      console.error("Usage limit middleware error:", error);
      return res.status(500).json({ message: "Server error checking usage limit" });
    }
  };
};

module.exports = { checkUsageLimit };
