const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const UsageLog = require("./models/UsageLog");

const resetUsageLogs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mern_auth_db";
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected for usage logs reset...");

    const today = new Date().toISOString().split("T")[0];

    // Delete all usage logs for today
    const result = await UsageLog.deleteMany({ date: today });
    console.log(`Successfully reset usage logs for today (${today}). Deleted ${result.deletedCount} log(s).`);

    // Reset all usage logs in collection (optional full clean)
    const totalDeleted = await UsageLog.deleteMany({});
    console.log(`Total UsageLog collection cleaned: ${totalDeleted.deletedCount} total log(s) removed.`);

    console.log("\n✅ All subadmin usage counts have been reset to 3 left!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error resetting usage logs:", error);
    process.exit(1);
  }
};

resetUsageLogs();
