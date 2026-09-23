const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "event_registered",
        "event_approved",
        "event_rejected",
        "event_cancelled",
        "event_submission",
        "event_registration_approved",
        "event_registration_rejected",
        "event_updated",
        "new_follower",
        "follow_request",
        "account_approved",
        "account_rejected",
        "account_suspended",
        "account_activated",
        "system"
      ],
      default: "system",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
