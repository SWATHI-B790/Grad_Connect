const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, ".env") });

const Blog = require("./models/Blog");
const User = require("./models/User");

const seedBlogs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mern_auth_db";
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected for seeding GradConnect Community Feed & Opportunities...");

    // Find Superadmin account specifically
    let superadmin = await User.findOne({ email: "superadmin@example.com" });
    if (!superadmin) {
      superadmin = await User.findOne({ role: "superadmin" });
    }
    if (!superadmin) {
      superadmin = await User.findOne({ role: "subadmin" });
    }

    if (!superadmin) {
      console.error("No admin user found. Please run seed script first.");
      process.exit(1);
    }

    console.log(`Seeding initial GradConnect posts authored by Admin: ${superadmin.name} (${superadmin.email})`);

    const initialGradConnectPosts = [
      {
        title: "Navigating Tech Careers in 2026: From Campus to Senior Software Engineer",
        slug: "navigating-tech-careers-2026-campus-to-engineer",
        shortDescription: "Essential roadmap, skill prioritization, and networking strategies shared by senior alumni engineers.",
        content: `
          <h3>Building a Resilient Engineering Career</h3>
          <p>Transitioning from university coursework to full-time software engineering requires continuous skill iteration, system design fundamentals, and active community engagement.</p>
          <h4>Key Career Takeaways for Graduates:</h4>
          <ul>
            <li><strong>Core Fundamentals Matter:</strong> Master data structures, distributed systems design, and database optimization.</li>
            <li><strong>Build Real Projects:</strong> Production-ready open source contributions set candidates apart during interviews.</li>
            <li><strong>Connect with Alumni Mentors:</strong> Don't hesitate to reach out to alumni working in your target companies for referral advice and mock interviews.</li>
          </ul>
        `,
        category: "Career Advice",
        bannerImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
        author: superadmin._id,
        isFeatured: true,
        status: "published",
        views: 1840,
      },
      {
        title: "Senior Full Stack Engineer (Remote / Hybrid) — Posted by TechAlumni Network",
        slug: "job-opportunity-senior-full-stack-engineer-2026",
        shortDescription: "Exciting career opening for alumni with 2+ years experience in React, Node.js, and cloud infrastructure.",
        content: `
          <h3>Career Opportunity: Full Stack Engineer</h3>
          <p>Our partner technology firm is hiring full stack engineers to build high-scale web platforms. Candidates from our alumni network are strongly encouraged to apply directly.</p>
          <h4>Role Requirements:</h4>
          <ul>
            <li>Strong background in JavaScript/TypeScript, React, Node.js, and Express.</li>
            <li>Experience with MongoDB, PostgreSQL, and AWS deployment.</li>
            <li>Collaborative mindset and passion for mentoring junior team members.</li>
          </ul>
        `,
        category: "Job Opportunity",
        bannerImage: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1200&auto=format&fit=crop",
        author: superadmin._id,
        isFeatured: true,
        status: "published",
        views: 1290,
      },
      {
        title: "Summer 2026 Software & Data Science Internships Open for Final Year Students",
        slug: "summer-2026-internships-open-final-year-students",
        shortDescription: "Paid 12-week internship opportunities in software engineering, data analytics, and UI design.",
        content: `
          <h3>Kickstart Your Professional Journey</h3>
          <p>Applications are now open for the Summer 2026 Internship Program. Interns will work alongside senior engineers and alumni mentors on production features.</p>
          <h4>Application Guidance:</h4>
          <p>Submit your updated resume, GitHub profile, and portfolio link through GradConnect before the application deadline.</p>
        `,
        category: "Internship",
        bannerImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
        author: superadmin._id,
        isFeatured: true,
        status: "published",
        views: 2410,
      },
      {
        title: "Celebrating Our 2023 Batch Alumnus Recognized in 30 Under 30 Tech Innovators",
        slug: "alumni-achievement-2023-batch-30-under-30",
        shortDescription: "Congratulations to our department graduate for groundbreaking work in AI-driven health tech solutions.",
        content: `
          <h3>Alumni Excellence Spotlight</h3>
          <p>We are thrilled to celebrate the outstanding achievements of our alumni community. Their dedication to innovation continues to inspire current students and fellow graduates.</p>
        `,
        category: "Alumni Achievement",
        bannerImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
        author: superadmin._id,
        isFeatured: false,
        status: "published",
        views: 950,
      },
      {
        title: "How Graduating in 2022 Taught Me the Value of Lifelong Alumni Mentorship",
        slug: "career-journey-value-of-lifelong-alumni-mentorship",
        shortDescription: "A personal reflection on how peer guidance, mock interviews, and referral networks transformed a graduate's path.",
        content: `
          <h3>My Graduation Story</h3>
          <p>When I graduated, I felt uncertain about industry expectations. Reaching out to alumni who had walked the same halls gave me clarity, confidence, and crucial career direction.</p>
        `,
        category: "Career Journey",
        bannerImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
        author: superadmin._id,
        isFeatured: false,
        status: "published",
        views: 1120,
      },
      {
        title: "Annual Alumni & Student Career Guidance Workshop 2026 Announced",
        slug: "announcement-annual-alumni-career-workshop-2026",
        shortDescription: "Join us for virtual panel discussions, interactive resume reviews, and 1-on-1 alumni networking sessions.",
        content: `
          <h3>Connect. Discover. Grow.</h3>
          <p>Mark your calendars for our flagship annual networking event! Connect with over 50 industry mentors across software, finance, core engineering, and research.</p>
        `,
        category: "Announcement",
        bannerImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1200&auto=format&fit=crop",
        author: superadmin._id,
        isFeatured: false,
        status: "published",
        views: 1680,
      },
    ];

    for (const item of initialGradConnectPosts) {
      await Blog.findOneAndUpdate(
        { slug: item.slug },
        item,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`\n✅ Successfully seeded ${initialGradConnectPosts.length} initial GradConnect posts!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding initial superadmin blogs:", error);
    process.exit(1);
  }
};

seedBlogs();
