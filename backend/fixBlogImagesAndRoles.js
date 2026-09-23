const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Blog = require("./models/Blog");
const User = require("./models/User");

dotenv.config();

const fixDatabaseData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/connect_in");
    console.log("Connected to MongoDB for data cleanup & fix...");

    // 1. Remove old invalid cybersecurity blogs
    const validCategories = [
      "Career Advice",
      "Job Opportunity",
      "Internship",
      "Alumni Achievement",
      "Career Journey",
      "Announcement",
      "Mentorship",
      "Industry Insights",
    ];

    await Blog.deleteMany({ category: { $nin: validCategories } });
    console.log("Purged invalid non-conforming blogs from DB.");

    // Sample high-quality images
    const sampleImages = [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop",
    ];

    const blogs = await Blog.find({});
    console.log(`Found ${blogs.length} valid blogs in MongoDB.`);

    for (let i = 0; i < blogs.length; i++) {
      const blog = blogs[i];
      let updated = false;
      const img = sampleImages[i % sampleImages.length];
      
      if (!blog.bannerImage || !blog.bannerImage.startsWith("http")) {
        blog.bannerImage = img;
        updated = true;
      }
      if (!blog.coverImage || !blog.coverImage.startsWith("http")) {
        blog.coverImage = img;
        updated = true;
      }
      if (updated) {
        await blog.save();
        console.log(`Updated blog '${blog.title}' bannerImage & coverImage.`);
      }
    }

    // 2. Sync user roles and userType for regular users
    const users = await User.find({});
    console.log(`Found ${users.length} users in MongoDB.`);

    for (const user of users) {
      let modified = false;
      if (!user.userType) {
        user.userType = "Alumni";
        modified = true;
      }
      if (!user.role || user.role === "user") {
        user.role = user.userType === "Current Student" ? "student" : "alumni";
        modified = true;
      }
      if (modified) {
        await user.save();
        console.log(`Synced role (${user.role}) and userType (${user.userType}) for user '${user.name}'.`);
      }
    }

    console.log("Data cleanup and fix completed successfully.");
    mongoose.connection.close();
  } catch (err) {
    console.error("Database fix error:", err);
    process.exit(1);
  }
};

fixDatabaseData();
