const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Event = require("./models/Event");
const Blog = require("./models/Blog");
const User = require("./models/User");

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/connect_in");
    console.log("Connected to MongoDB for seeding...");

    const sampleAlumni = await User.findOne({ userType: "Alumni" });

    // Seed Events if empty
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      await Event.insertMany([
        {
          title: "Global Tech Alumni Leadership Roundtable 2027",
          description: "Connect with tech leads, VP of Engineering, and founders from Silicon Valley and India discussing AI, cloud architectures, and tech hiring trends.",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          time: "6:00 PM - 7:30 PM IST",
          mode: "Online",
          location: "Zoom Virtual Summit",
          category: "Roundtable & Leadership",
          bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
          createdBy: sampleAlumni ? sampleAlumni._id : undefined,
          attendees: sampleAlumni ? [sampleAlumni._id] : [],
        },
        {
          title: "Product Management Masterclass: Zero to One",
          description: "Exclusive interactive session on product strategy, user discovery, metrics, and cracking PM interviews at top tech product companies.",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          time: "5:00 PM - 6:30 PM IST",
          mode: "Online",
          location: "Google Meet",
          category: "Masterclass",
          bannerImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop",
          createdBy: sampleAlumni ? sampleAlumni._id : undefined,
          attendees: sampleAlumni ? [sampleAlumni._id] : [],
        },
        {
          title: "Annual GradConnect Alumni Networking Mixer",
          description: "Meet fellow graduates, share industry referrals, and catch up with old batchmates over evening networking and career discussions.",
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          time: "7:00 PM - 9:30 PM IST",
          mode: "In-person",
          location: "Grand Convention Center, Tech Park",
          category: "Alumni Meetup",
          bannerImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
          createdBy: sampleAlumni ? sampleAlumni._id : undefined,
          attendees: sampleAlumni ? [sampleAlumni._id] : [],
        },
      ]);
      console.log("Seeded sample events successfully!");
    }

    // Seed Blogs if empty
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0 && sampleAlumni) {
      await Blog.insertMany([
        {
          title: "How I Landed a Staff Engineer Role in 4 Years: Lessons & Mindset",
          excerpt: "Focusing on systems impact, domain expertise, and cross-functional leadership over raw coding output.",
          content: "Navigating early software engineering career paths can feel overwhelming...",
          category: "CAREER DEVELOPMENT",
          coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
          author: sampleAlumni._id,
          status: "published",
          tags: ["Career", "Engineering", "Mentorship"],
        },
        {
          title: "The Ultimate Guide to Networking as a College Student",
          excerpt: "How cold emails, LinkedIn outreach, and alumni platform messages actually get high response rates.",
          content: "Reaching out to senior professionals can be nerve-wracking...",
          category: "NETWORKING & MENTORSHIP",
          coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
          author: sampleAlumni._id,
          status: "published",
          tags: ["Networking", "Students", "Advice"],
        },
        {
          title: "Demystifying System Design Interviews for 2027",
          excerpt: "Core building blocks: Caching, Database sharding, Load balancing, and Rate limiting explained simply.",
          content: "System design interviews evaluate your architectural maturity...",
          category: "TECH & INTERVIEWS",
          coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
          author: sampleAlumni._id,
          status: "published",
          tags: ["Tech", "Interview", "System Design"],
        },
      ]);
      console.log("Seeded sample blogs successfully!");
    }

    mongoose.connection.close();
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedData();
