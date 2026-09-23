const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const connectDB = require("./config/db");

const seedUsers = async () => {
  try {
    await connectDB();

    // Salt and Hash Passwords
    const salt = await bcrypt.genSalt(10);
    const alumniPassword = await bcrypt.hash("Alumni@123", salt);
    const studentPassword = await bcrypt.hash("Student@123", salt);

    // Test Accounts Definition
    const usersToSeed = [
      {
        name: "Test Alumni",
        email: "alumni.test@gradconnect.com",
        password: alumniPassword,
        role: "user",
        userType: "Alumni",
        department: "Computer Science & Engineering",
        degree: "Bachelor of Technology",
        batch: "2022",
        graduationYear: 2022,
        jobTitle: "Senior Software Engineer",
        company: "Google",
        industry: "Technology",
        skills: ["React", "Node.js", "System Design", "MongoDB", "Python"],
        phone: "+1 (555) 123-4567",
        city: "San Francisco",
        country: "USA",
        linkedIn: "https://linkedin.com/in/testalumni",
        portfolio: "https://github.com/testalumni",
        willingToMentor: true,
        openToReferrals: true,
      },
      {
        name: "Test Student",
        email: "student.test@gradconnect.com",
        password: studentPassword,
        role: "user",
        userType: "Current Student",
        department: "Information Technology",
        degree: "Bachelor of Science",
        batch: "2025",
        graduationYear: 2025,
        jobTitle: "Software Engineer Intern",
        company: "GradConnect Campus",
        industry: "Education & Tech",
        skills: ["JavaScript", "Python", "Data Structures", "Algorithms", "React"],
        phone: "+1 (555) 987-6543",
        city: "Boston",
        country: "USA",
        linkedIn: "https://linkedin.com/in/teststudent",
        portfolio: "https://github.com/teststudent",
        willingToMentor: false,
        openToReferrals: true,
      },
    ];

    console.log("Seeding test users into MongoDB...");

    for (const userData of usersToSeed) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists. Skipping.`);
      } else {
        await User.create(userData);
        console.log(`Created ${userData.userType} account: ${userData.email}`);
      }
    }

    console.log("Seed users task completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed users:", error);
    process.exit(1);
  }
};

seedUsers();
