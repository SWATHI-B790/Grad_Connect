const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action name is required"],
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    performedByName: {
      type: String,
      default: "System / Anonymous",
      trim: true,
    },
    performedByEmail: {
      type: String,
      default: "",
      trim: true,
    },
    performedByRole: {
      type: String,
      default: "",
      trim: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetResource: {
      type: String,
      default: "",
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["User", "Blog", "Domain", "Event", "Auth", "Settings", "System"],
      default: "System",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetType: 1 });
auditLogSchema.index({ performedBy: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

// Safe helper function to record audit logs without breaking main execution on log errors
const logAdminAction = async ({
  req = null,
  action,
  performedBy = null,
  targetUser = null,
  targetResource = "",
  targetType = "System",
  description,
  details = {},
  status = "success",
}) => {
  try {
    let actorId = performedBy;
    let actorName = "System / Anonymous";
    let actorEmail = "";
    let actorRole = "";
    let ip = "";

    if (req) {
      ip =
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";

      if (req.user) {
        actorId = actorId || req.user._id;
        actorName = req.user.name || actorName;
        actorEmail = req.user.email || actorEmail;
        actorRole = req.user.role || actorRole;
      }
    }

    const logEntry = await AuditLog.create({
      action,
      performedBy: actorId,
      performedByName: actorName,
      performedByEmail: actorEmail,
      performedByRole: actorRole,
      targetUser,
      targetResource: targetResource || "",
      targetType,
      description,
      details,
      ipAddress: ip,
      status,
      timestamp: new Date(),
    });

    return logEntry;
  } catch (err) {
    console.error("Failed to write AuditLog entry:", err.message);
    return null;
  }
};

module.exports = { AuditLog, logAdminAction };
