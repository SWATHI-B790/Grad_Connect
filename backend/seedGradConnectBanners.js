const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Banner = require("./models/Banner");

dotenv.config();

const updateBanners = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/connect_in");
    console.log("Connected to MongoDB for banner update...");

    // Delete any old cybersecurity/phishing/security banners
    await Banner.deleteMany({});
    console.log("Cleared existing banners.");

    // Insert 4 new high-quality GradConnect alumni networking banners
    await Banner.insertMany([
      {
        title: "Connect With Verified Alumni Leaders",
        subtitle: "OFFICIAL ALUMNI NETWORK",
        description: "Build meaningful professional connections with graduates working in top companies worldwide like Google, Meta, Microsoft, and Uber.",
        ctaText: "Discover Alumni",
        ctaLink: "/people",
        bannerImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
        isActive: true,
        displayOrder: 1,
      },
      {
        title: "Exclusive Internships & Referral Opportunities",
        subtitle: "CAREER OPPORTUNITIES",
        description: "Explore curated executive job openings, internship calls, and internal referral positions posted by verified alumni.",
        ctaText: "Explore Jobs",
        ctaLink: "/jobs",
        bannerImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop",
        isActive: true,
        displayOrder: 2,
      },
      {
        title: "Global Tech Alumni Leadership Roundtable 2027",
        subtitle: "EXECUTIVE MASTERCLASSES",
        description: "Attend interactive masterclasses, panel discussions, and annual alumni mixers to accelerate your career growth.",
        ctaText: "Register For Events",
        ctaLink: "/events",
        bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
        isActive: true,
        displayOrder: 3,
      },
      {
        title: "Alumni Success Stories & Career Insights",
        subtitle: "GRADCONNECT INSIGHTS",
        description: "Read technical articles, system design guides, and inspiring career journey stories written by senior graduates.",
        ctaText: "Read Insights",
        ctaLink: "/blogs",
        bannerImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
        isActive: true,
        displayOrder: 4,
      },
    ]);

    console.log("Successfully seeded 4 new GradConnect alumni banners!");
    mongoose.connection.close();
  } catch (err) {
    console.error("Banner seeding error:", err);
    process.exit(1);
  }
};

updateBanners();
