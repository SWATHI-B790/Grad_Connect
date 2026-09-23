const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const createAdminAccount = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mern_auth_db";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for admin creation...");

    const name = process.env.ADMIN_NAME || "Administrator";
    const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || "AdminPassword123!";

    if (password.length < 6) {
      console.error("Error: ADMIN_PASSWORD must be at least 6 characters long.");
      process.exit(1);
    }

    let admin = await User.findOne({ email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (admin) {
      admin.name = name;
      admin.password = hashedPassword;
      admin.role = "admin";
      await admin.save();
      console.log(`Admin account updated successfully for email: ${email}`);
    } else {
      admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });
      console.log(`Admin account created successfully for email: ${email}`);
    }

    console.log("Admin details:");
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin account:", error);
    process.exit(1);
  }
};

createAdminAccount();
