const mongoose = require("mongoose");

const usageLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  feature: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

// Compound unique index for atomic tracking
usageLogSchema.index(
  { admin: 1, feature: 1, date: 1 },
  { unique: true }
);

const UsageLog = mongoose.model("UsageLog", usageLogSchema);

module.exports = UsageLog;
