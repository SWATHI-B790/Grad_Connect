const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const adminSeedList = [
  {
    name: "Primary Administrator",
    email: "admin@example.com",
    password: process.env.ADMIN_PASSWORD || "AdminPassword123!",
  },
  {
    name: "Admin Two",
    email: "admin2@example.com",
    password: "AdminPassword123!",
  },
  {
    name: "Admin Three",
    email: "admin3@example.com",
    password: "AdminPassword123!",
  },
];

const seedMultipleAdmins = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mern_auth_db";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Multi-Admin Seeding...");

    for (const adminData of adminSeedList) {
      const email = adminData.email.toLowerCase().trim();
      let user = await User.findOne({ email });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      if (user) {
        user.name = adminData.name;
        user.role = "admin";
        user.password = hashedPassword;
        await user.save();
        console.log(`[UPDATED] Promoted user to Admin: ${email}`);
      } else {
        user = await User.create({
          name: adminData.name,
          email: email,
          password: hashedPassword,
          role: "admin",
        });
        console.log(`[CREATED] New Admin created: ${email}`);
      }
    }

    console.log("\n=== Multi-Admin Seeding Completed Successfully! ===");
    console.log("Admins configured:");
    adminSeedList.forEach((a) => console.log(` - ${a.name} (${a.email})`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding multi-admins:", error);
    process.exit(1);
  }
};

seedMultipleAdmins();
