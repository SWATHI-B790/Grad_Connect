const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const seedRoles = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mern_auth_db";
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected for role, adminLabel, and allowedMenus seeding...");

    const superadminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@example.com").toLowerCase().trim();
    const subadminEmail1 = (process.env.SUBADMIN_EMAIL_1 || "admin1@example.com").toLowerCase().trim();
    const subadminEmail2 = (process.env.SUBADMIN_EMAIL_2 || "admin2@example.com").toLowerCase().trim();

    const rolesConfig = [
      {
        name: "Super Administrator",
        email: superadminEmail,
        role: "superadmin",
        adminLabel: "Super Admin",
        allowedMenus: ["dashboard", "user_management", "reports", "activity_logs", "settings", "blogs", "events", "banners"],
      },
      {
        name: "First Sub Admin",
        email: subadminEmail1,
        role: "subadmin",
        adminLabel: "Admin1",
        allowedMenus: ["dashboard", "user_management", "activity_logs", "settings", "blogs", "events", "banners"],
      },
      {
        name: "Second Sub Admin",
        email: subadminEmail2,
        role: "subadmin",
        adminLabel: "Admin2",
        allowedMenus: ["dashboard", "user_management", "reports", "blogs", "events", "banners"],
      },
      // Legacy emails support
      {
        name: "Sub Admin One Legacy",
        email: "subadmin1@example.com",
        role: "subadmin",
        adminLabel: "Admin1",
        allowedMenus: ["dashboard", "user_management", "activity_logs", "settings", "blogs", "events", "banners"],
      },
      {
        name: "Sub Admin Two Legacy",
        email: "subadmin2@example.com",
        role: "subadmin",
        adminLabel: "Admin2",
        allowedMenus: ["dashboard", "user_management", "reports", "blogs", "events", "banners"],
      },
      {
        name: "Primary Admin Legacy",
        email: "admin@example.com",
        role: "superadmin",
        adminLabel: "Super Admin",
        allowedMenus: ["dashboard", "user_management", "reports", "activity_logs", "settings", "blogs", "events", "banners"],
      },
    ];

    const defaultPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    for (const item of rolesConfig) {
      let user = await User.findOne({ email: item.email });

      if (user) {
        user.role = item.role;
        user.adminLabel = item.adminLabel;
        user.allowedMenus = item.allowedMenus;
        user.password = hashedPassword;
        await user.save();
        console.log(`[UPDATED] ${item.email} → role: ${item.role}, label: ${item.adminLabel}, allowedMenus: [${item.allowedMenus.join(", ")}]`);
      } else {
        user = await User.create({
          name: item.name,
          email: item.email,
          password: hashedPassword,
          role: item.role,
          adminLabel: item.adminLabel,
          allowedMenus: item.allowedMenus,
        });
        console.log(`[CREATED] ${item.email} → role: ${item.role}, label: ${item.adminLabel}, allowedMenus: [${item.allowedMenus.join(", ")}]`);
      }
    }

    console.log("\nRole, AdminLabel, and allowedMenus seeding completed successfully.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error running role seed script:", error);
    process.exit(1);
  }
};

seedRoles();
