import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  Briefcase,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  Compass,
  HeartHandshake,
  TrendingUp,
  UserCheck,
  Award,
  MapPin,
  Building,
  Code2,
  Cpu,
  Layers,
  Palette,
  Binary,
  Cloud,
  FileText,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

// Fallback Alumni if backend has fewer than 4 or is loading
const FALLBACK_ALUMNI = [
  {
    _id: "6aa392db8f604750e6e482c5",
    name: "Alex Rivera",
    jobTitle: "Staff Software Engineer",
    company: "Stripe",
    batch: "2022",
    department: "Computer Science & Engineering",
    skills: ["React", "Distributed Systems", "Node.js", "System Design"],
    willingToMentor: true,
    isVerifiedAlumni: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
    headline: "Staff Software Engineer @ Stripe • Ex-Amazon",
  },
  {
    _id: "alumni-priya-sharma",
    name: "Priya Sharma",
    jobTitle: "Senior Product Manager",
    company: "Uber",
    batch: "2021",
    department: "Information Technology",
    skills: ["Product Strategy", "Growth", "User Discovery", "Data Analytics"],
    willingToMentor: true,
    isVerifiedAlumni: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop",
    headline: "Senior PM @ Uber • Mentoring Future Product Leaders",
  },
  {
    _id: "alumni-yugendhran-d",
    name: "Yugendhran Doraiswamy",
    jobTitle: "Lead Software Architect",
    company: "Microsoft",
    batch: "2020",
    department: "Computer Science",
    skills: ["Azure", "Kubernetes", "Microservices", "Go", "C#"],
    willingToMentor: true,
    isVerifiedAlumni: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    headline: "Lead Software Architect @ Microsoft Azure Core",
  },
  {
    _id: "alumni-ananya-deshmukh",
    name: "Ananya Deshmukh",
    jobTitle: "AI Research Scientist",
    company: "DeepMind",
    batch: "2022",
    department: "Data Science & AI",
    skills: ["PyTorch", "Transformers", "NLP", "Python", "GenAI"],
    willingToMentor: true,
    isVerifiedAlumni: true,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop",
    headline: "AI Research Scientist @ Google DeepMind",
  },
];

// 8 Prominent Technical Domains
const FEATURED_DOMAINS = [
  {
    id: "mern-stack",
    name: "Software Development",
    stack: "MongoDB • Express • React • Node.js",
    description: "Production web applications, REST APIs, microservices, and modern frontend & backend architectures.",
    icon: Layers,
    color: "#2563eb",
    countText: "24+ Curated Guides",
  },
  {
    id: "ai-ml",
    name: "Artificial Intelligence",
    stack: "PyTorch • NLP • Computer Vision • GenAI",
    description: "Deep neural networks, LLMs, prompt engineering, computer vision, and machine learning models.",
    icon: Cpu,
    color: "#7c3aed",
    countText: "18+ Curated Guides",
  },
  {
    id: "data-science",
    name: "Data Science",
    stack: "Python • SQL • Statistics • Analytics",
    description: "Data pipelines, predictive modeling, statistical testing, and executive visualization dashboards.",
    icon: Binary,
    color: "#059669",
    countText: "16+ Curated Guides",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    stack: "Network Security • Penetration Testing • OWASP",
    description: "Threat modeling, application defense, cryptographic protocols, and secure cloud authentication.",
    icon: Code2,
    color: "#be123c",
    countText: "14+ Curated Guides",
  },
  {
    id: "cloud-computing",
    name: "Cloud Computing",
    stack: "AWS • Docker • Kubernetes • CI/CD",
    description: "Containerization, infrastructure as code, serverless cloud architectures, and automated pipelines.",
    icon: Cloud,
    color: "#0891b2",
    countText: "15+ Curated Guides",
  },
  {
    id: "product-management",
    name: "Product & Management",
    stack: "Strategy • Agile • User Research • Metrics",
    description: "Product discovery, roadmapping, agile sprints, user empathy interviews, and metric frameworks.",
    icon: Compass,
    color: "#d97706",
    countText: "12+ Curated Guides",
  },
  {
    id: "ui-ux-design",
    name: "Design & Creative Tech",
    stack: "Figma • Design Systems • Wireframing • UX",
    description: "Interactive prototyping, design system components, user journey mapping, and visual accessibility.",
    icon: Palette,
    color: "#9333ea",
    countText: "15+ Curated Guides",
  },
  {
    id: "dsa",
    name: "Data Structures & Algorithms",
    stack: "Trees • Graphs • Dynamic Programming • Big-O",
    description: "Core algorithmic problem-solving, complexity analysis, and FAANG technical interview patterns.",
    icon: Code2,
    color: "#e11d48",
    countText: "22+ Curated Guides",
  },
];

// Curated Career Opportunities Preview matching Jobs Hub
const FEATURED_JOBS = [
  {
    _id: "job-1",
    title: "Software Development Engineer Intern",
    company: "Google",
    location: "Mountain View, CA / Remote",
    type: "Internship",
    experience: "Current Student / 2025-2026 Batch",
    skills: ["React", "Python", "Data Structures", "Algorithms"],
    compensation: "$55 - $70 / hr",
    postedDate: "2 days ago",
  },
  {
    _id: "job-2",
    title: "Associate Product Manager (APM)",
    company: "Microsoft",
    location: "Redmond, WA / Remote",
    type: "Full-Time",
    experience: "0-2 Years Experience",
    skills: ["Product Strategy", "Agile", "User Research", "Metrics"],
    compensation: "$115,000 - $135,000 / yr",
    postedDate: "3 days ago",
  },
  {
    _id: "job-3",
    title: "Full Stack Engineer (Payments & Cloud)",
    company: "Stripe",
    location: "San Francisco, CA / Remote",
    type: "Full-Time",
    experience: "1-3 Years Experience",
    skills: ["Node.js", "TypeScript", "React", "PostgreSQL", "APIs"],
    compensation: "$130,000 - $160,000 / yr",
    postedDate: "5 days ago",
  },
];

// Fallback Blogs if API is loading or offline
const FALLBACK_BLOGS = [
  {
    _id: "blog-1",
    title: "How I Landed a Staff Engineer Role in 4 Years: Lessons & Mindset",
    slug: "how-i-landed-a-staff-engineer-role",
    shortDescription: "Focusing on systems impact, domain expertise, and cross-functional leadership over raw coding output.",
    category: "Career Development",
    domain: "Engineering Leadership",
    bannerImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
    author: { name: "Alex Rivera", jobTitle: "Staff Engineer @ Stripe" },
  },
  {
    _id: "blog-2",
    title: "The Ultimate Guide to Networking as a College Student",
    slug: "the-ultimate-guide-to-networking",
    shortDescription: "How cold messages, informational interviews, and alumni platform conversations actually yield high response rates.",
    category: "Mentorship",
    domain: "Networking",
    bannerImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
    author: { name: "Priya Sharma", jobTitle: "Senior PM @ Uber" },
  },
  {
    _id: "blog-3",
    title: "Demystifying System Design Interviews: Cache, Sharding & Load Balancing",
    slug: "demystifying-system-design-interviews",
    shortDescription: "Core building blocks of high-throughput distributed systems explained simply for software engineering interviews.",
    category: "Technical Guide",
    domain: "System Design",
    bannerImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
    author: { name: "Yugendhran D.", jobTitle: "Lead Architect @ Microsoft" },
  },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dynamic Statistics
  const [stats, setStats] = useState({
    alumniCount: 22,
    studentCount: 4,
    mentorCount: 1,
    jobCount: 32,
    resourceCount: 33,
  });

  const [featuredAlumni, setFeaturedAlumni] = useState([]);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Authenticated user details
  const userName = user?.name || user?.email?.split("@")[0] || "Member";
  const isStudent = Boolean(
    user && (user.userType === "Current Student" || user.userType === "student")
  );
  const isAlumni = Boolean(
    user && (user.userType === "Alumni" || user.userType === "alumni")
  );
  const isAdmin = Boolean(
    user && (user.role === "admin" || user.role === "superadmin" || user.role === "subadmin")
  );

  useEffect(() => {
    // 1. Fetch Real Statistics
    const fetchStats = async () => {
      try {
        const res = await API.get("/stats/summary");
        if (res.data) {
          setStats({
            alumniCount: res.data.alumniCount ?? 22,
            studentCount: res.data.studentCount ?? 4,
            mentorCount: res.data.mentorCount ?? 1,
            jobCount: res.data.jobCount ?? 32,
            resourceCount: res.data.resourceCount ?? 33,
          });
        }
      } catch (err) {
        console.error("Failed to fetch live stats summary:", err);
      }
    };

    // 2. Fetch Featured Alumni
    const fetchFeaturedAlumni = async () => {
      try {
        const res = await API.get("/users/public/featured");
        if (res.data && res.data.alumni && res.data.alumni.length > 0) {
          const mapped = res.data.alumni.map((a, idx) => {
            const fallback = FALLBACK_ALUMNI[idx % FALLBACK_ALUMNI.length];
            return {
              _id: a._id,
              name: a.name || fallback.name,
              jobTitle: a.jobTitle || fallback.jobTitle,
              company: a.company || fallback.company,
              batch: a.batch || a.graduationYear || fallback.batch,
              department: a.department || fallback.department,
              skills: a.skills && a.skills.length > 0 ? a.skills : fallback.skills,
              willingToMentor: typeof a.willingToMentor === "boolean" ? a.willingToMentor : true,
              isVerifiedAlumni: typeof a.isVerifiedAlumni === "boolean" ? a.isVerifiedAlumni : true,
              avatar: a.avatar && a.avatar.trim() !== "" ? a.avatar : fallback.avatar,
              headline: a.headline || `${a.jobTitle || fallback.jobTitle} ${a.company ? `@ ${a.company}` : ""}`,
            };
          });
          setFeaturedAlumni(mapped);
        } else {
          setFeaturedAlumni(FALLBACK_ALUMNI);
        }
      } catch (err) {
        console.error("Failed to fetch featured alumni:", err);
        setFeaturedAlumni(FALLBACK_ALUMNI);
      } finally {
        setLoadingAlumni(false);
      }
    };

    // 3. Fetch Latest Articles & Insights
    const fetchBlogs = async () => {
      try {
        const res = await API.get("/blogs?limit=3");
        if (res.data && res.data.blogs && res.data.blogs.length > 0) {
          setLatestBlogs(res.data.blogs.slice(0, 3));
        } else {
          setLatestBlogs(FALLBACK_BLOGS);
        }
      } catch (err) {
        console.error("Failed to fetch latest blogs:", err);
        setLatestBlogs(FALLBACK_BLOGS);
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchStats();
    fetchFeaturedAlumni();
    fetchBlogs();
  }, []);

  return (
    <div className="home-page">
      {/* ============================================================
         1. HERO SECTION (DEEP EXECUTIVE NAVY + ULTRA CRISP TEXT)
         ============================================================ */}
      <section className="home-hero">
        <div className="home-hero-glow-1" />
        <div className="home-hero-glow-2" />

        <div className="home-container" style={{ position: "relative", zIndex: 10 }}>
          <div className="home-hero-grid">
            
            {/* Left Column: Hero Content & Auth-Aware CTAs */}
            <div className="home-hero-left">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="home-hero-eyebrow"
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: "#34d399", display: "inline-block" }} />
                <GraduationCap size={15} style={{ color: "#fbbf24" }} />
                <span>THE ALUMNI CONNECTION PLATFORM</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="home-hero-title"
              >
                Connect with the people who can{" "}
                <span className="home-hero-title-accent">
                  shape your future.
                </span>
              </motion.h1>

              {/* Dynamic Authenticated Greeting or Logged-Out Description */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ marginBottom: "1.75rem" }}
                >
                  <div className="home-hero-welcome-badge">
                    <div className="home-welcome-avatar">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.925rem", fontWeight: 700, color: "#ffffff" }}>
                        Welcome back, {userName}.
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                        Continue your journey with the GradConnect community.
                      </div>
                    </div>
                    <span className="home-welcome-tag">
                      {isAdmin ? "Administrator" : isAlumni ? "Alumni" : "Student"}
                    </span>
                  </div>

                  {/* Personalized Quick Actions */}
                  <div className="home-hero-cta-group">
                    <Link
                      to="/people"
                      className="home-btn-primary home-btn-primary-gradient"
                    >
                      <Users size={16} />
                      <span>Explore Alumni</span>
                    </Link>

                    <Link
                      to="/jobs"
                      className="home-btn-secondary"
                    >
                      <Briefcase size={16} style={{ color: "#34d399" }} />
                      <span>Find Jobs</span>
                    </Link>

                    <Link
                      to="/domains"
                      className="home-btn-secondary"
                    >
                      <BookOpen size={16} style={{ color: "#c084fc" }} />
                      <span>Explore Domains</span>
                    </Link>

                    <Link
                      to="/blogs"
                      className="home-btn-secondary"
                    >
                      <FileText size={16} style={{ color: "#fbbf24" }} />
                      <span>View Blogs</span>
                    </Link>

                    <Link
                      to="/profile"
                      className="home-btn-secondary"
                    >
                      <UserCheck size={16} style={{ color: "#38bdf8" }} />
                      <span>My Profile</span>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                /* Logged Out Supporting Text & CTAs */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="home-hero-subtitle">
                    GradConnect brings students and alumni together to discover mentors, explore career paths, share opportunities, and grow through meaningful connections.
                  </p>

                  <div className="home-hero-cta-group">
                    <Link
                      to="/register"
                      className="home-btn-primary"
                    >
                      <span>Get Started</span>
                      <ArrowRight size={17} />
                    </Link>

                    <Link
                      to="/people"
                      className="home-btn-secondary"
                    >
                      <Users size={16} style={{ color: "#60a5fa" }} />
                      <span>Explore Alumni</span>
                    </Link>
                  </div>

                  {/* Secondary Clean Member Login Links */}
                  <div className="home-hero-login-strip">
                    <span>Already a member?</span>
                    <Link
                      to="/student-login"
                      className="home-hero-login-link-student"
                    >
                      Student Login
                    </Link>
                    <span>•</span>
                    <Link
                      to="/alumni-login"
                      className="home-hero-login-link-alumni"
                    >
                      Alumni Login
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column: High-Impact Networking Visual */}
            <div className="home-hero-right">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="hero-visual-card"
              >
                {/* Header Strip inside Card */}
                <div className="hero-visual-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: "#34d399" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Active Network Pulse
                    </span>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#cbd5e1", padding: "0.2rem 0.6rem", borderRadius: "6px", background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    1-on-1 Mentoring
                  </span>
                </div>

                {/* Node 1: Alumni Mentor Profile */}
                <div className="hero-node-item">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
                    alt="Priya Sharma"
                    className="hero-node-avatar"
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                        Priya Sharma
                      </h4>
                      <CheckCircle size={14} style={{ color: "#60a5fa" }} />
                    </div>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#60a5fa", margin: "0.15rem 0" }}>
                      Senior Product Manager @ Uber
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: 0 }}>
                      Class of 2021 • Information Technology
                    </p>
                  </div>
                </div>

                {/* Connection Arrow indicator */}
                <div className="hero-node-match-pill">
                  <span className="hero-node-divider" />
                  <span className="hero-node-badge">
                    <HeartHandshake size={14} />
                    <span>Mentorship &amp; Referral Match</span>
                  </span>
                  <span className="hero-node-divider" />
                </div>

                {/* Node 2: Career Opportunity Match */}
                <div className="hero-node-item">
                  <div className="hero-node-icon-box">
                    <Briefcase size={22} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <h5 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                        Software Engineer Intern
                      </h5>
                      <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(52, 211, 153, 0.2)", color: "#6ee7b7" }}>
                        Referral Active
                      </span>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "#cbd5e1", fontWeight: 500, margin: "0 0 0.1rem 0" }}>
                      Google • Mountain View / Remote
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: 0 }}>
                      96% Skill Match with your coursework
                    </p>
                  </div>
                </div>

                {/* Bottom CTA on Visual Card */}
                <Link
                  to="/people"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>Explore 2,000+ Verified Alumni</span>
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
         2. TRUST / STATISTICS STRIP (BOUND TO REAL API DATA)
         ============================================================ */}
      <section className="home-stats-strip">
        <div className="home-container">
          <div className="home-stats-box">
            
            {/* Stat 1: Verified Alumni */}
            <div className="home-stat-unit">
              <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                <Users size={24} />
              </div>
              <div>
                <div className="home-stat-number">
                  {stats.alumniCount ? `${stats.alumniCount}+` : "22+"}
                </div>
                <div className="home-stat-label">Verified Alumni</div>
              </div>
            </div>

            {/* Stat 2: Enrolled Students */}
            <div className="home-stat-unit">
              <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="home-stat-number">
                  {stats.studentCount ? `${stats.studentCount}+` : "4+"}
                </div>
                <div className="home-stat-label">Enrolled Students</div>
              </div>
            </div>

            {/* Stat 3: Career Domains */}
            <div className="home-stat-unit">
              <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
                <Layers size={24} />
              </div>
              <div>
                <div className="home-stat-number">15+</div>
                <div className="home-stat-label">Career Domains</div>
              </div>
            </div>

            {/* Stat 4: Opportunities & Mentorship */}
            <div className="home-stat-unit">
              <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(5, 150, 105, 0.1)", color: "#059669", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                <Briefcase size={24} />
              </div>
              <div>
                <div className="home-stat-number">
                  {stats.jobCount ? `${stats.jobCount}+` : "32+"}
                </div>
                <div className="home-stat-label">Opportunities &amp; Mentorship</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
         3. "WHY GRADCONNECT?" SECTION (6 PREMIUM BENEFIT CARDS)
         ============================================================ */}
      <section className="home-section-white">
        <div className="home-container">
          
          <div className="home-section-header">
            <div className="home-section-eyebrow" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
              <Sparkles size={14} />
              <span>PLATFORM ADVANTAGES</span>
            </div>
            <h2 className="home-section-title">
              Everything you need to grow beyond the classroom.
            </h2>
            <p className="home-section-desc">
              GradConnect creates a bridge between academic learning and real-world career growth.
            </p>
          </div>

          {/* 6 Benefit Cards */}
          <div className="home-grid-3">
            
            {/* Card 1: Connect with Alumni */}
            <div className="home-card">
              <div>
                <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)", marginBottom: "1.25rem" }}>
                  <Users size={24} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Connect with Alumni
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Discover experienced alumni and learn from their academic and professional journeys.
                </p>
              </div>
              <Link
                to="/people"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, color: "#2563eb", textDecoration: "none" }}
              >
                <span>Explore Alumni Network</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Card 2: Career Guidance */}
            <div className="home-card">
              <div>
                <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.2)", marginBottom: "1.25rem" }}>
                  <Compass size={24} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Career Guidance
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Understand career paths, skills and opportunities through real-world insights.
                </p>
              </div>
              <Link
                to="/domains"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}
              >
                <span>Explore Technical Roadmaps</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Card 3: Mentorship */}
            <div className="home-card">
              <div>
                <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)", marginBottom: "1.25rem" }}>
                  <HeartHandshake size={24} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Mentorship
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Build meaningful connections with alumni who can guide your next step.
                </p>
              </div>
              <Link
                to="/people"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, color: "#dc2626", textDecoration: "none" }}
              >
                <span>Find an Alumni Mentor</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Card 4: Job Opportunities */}
            <div className="home-card">
              <div>
                <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(5, 150, 105, 0.1)", color: "#059669", border: "1px solid rgba(5, 150, 105, 0.2)", marginBottom: "1.25rem" }}>
                  <Briefcase size={24} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Job Opportunities
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Discover relevant opportunities shared by alumni and the GradConnect community.
                </p>
              </div>
              <Link
                to="/jobs"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, color: "#059669", textDecoration: "none" }}
              >
                <span>Browse Opportunities</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Card 5: Knowledge Sharing */}
            <div className="home-card">
              <div>
                <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.2)", marginBottom: "1.25rem" }}>
                  <BookOpen size={24} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Knowledge Sharing
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Explore blogs, experiences, technical insights and career advice.
                </p>
              </div>
              <Link
                to="/blogs"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, color: "#d97706", textDecoration: "none" }}
              >
                <span>Read Articles &amp; Insights</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Card 6: Professional Profiles */}
            <div className="home-card">
              <div>
                <div className="home-stat-icon-wrap" style={{ backgroundColor: "rgba(79, 70, 229, 0.1)", color: "#4f46e5", border: "1px solid rgba(79, 70, 229, 0.2)", marginBottom: "1.25rem" }}>
                  <UserCheck size={24} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Professional Profiles
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Showcase your education, skills, projects, experience, certifications and career interests.
                </p>
              </div>
              <Link
                to="/profile"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}
              >
                <span>Manage Your Profile</span>
                <ArrowRight size={14} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
         4. HOW GRADCONNECT WORKS (3–4 STEP JOURNEY)
         ============================================================ */}
      <section className="home-section-alt">
        <div className="home-container">
          
          <div className="home-section-header">
            <div className="home-section-eyebrow" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
              <TrendingUp size={14} />
              <span>THE PATHWAY</span>
            </div>
            <h2 className="home-section-title">
              Your journey starts here.
            </h2>
            <p className="home-section-desc">
              A structured roadmap to build meaningful connections, master engineering skills, and land your target role.
            </p>
          </div>

          {/* 4 Step Cards */}
          <div className="home-grid-4">
            
            {/* Step 01 */}
            <div className="home-step-card">
              <div>
                <div className="home-step-num">01</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Create your profile
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Build a professional profile highlighting your education, skills, projects, certifications and career interests.
                </p>
              </div>
              <Link
                to={user ? "/profile" : "/register"}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 700, color: "#dc2626", textDecoration: "none" }}
              >
                <span>{user ? "View Profile" : "Register Now"}</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Step 02 */}
            <div className="home-step-card">
              <div>
                <div className="home-step-num">02</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Discover your community
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Explore alumni, students, career domains and people who match your interests.
                </p>
              </div>
              <Link
                to="/people"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 700, color: "#2563eb", textDecoration: "none" }}
              >
                <span>Find Members</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Step 03 */}
            <div className="home-step-card">
              <div>
                <div className="home-step-num">03</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Learn and connect
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Discover mentors, insights, opportunities and meaningful professional connections.
                </p>
              </div>
              <Link
                to="/domains"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}
              >
                <span>Explore Knowledge</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Step 04 */}
            <div className="home-step-card">
              <div>
                <div className="home-step-num">04</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Grow your career
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Turn connections and knowledge into real opportunities.
                </p>
              </div>
              <Link
                to="/jobs"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 700, color: "#059669", textDecoration: "none" }}
              >
                <span>Explore Jobs</span>
                <ChevronRight size={13} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
         5. FEATURED ALUMNI SECTION (REAL BACKEND DATA PREVIEW)
         * STRICT RULE: LINKS TO /profile/:id (VIEW-ONLY PUBLIC PROFILE)
         ============================================================ */}
      <section className="home-section-white">
        <div className="home-container">
          
          <div className="home-section-header-row">
            <div>
              <div className="home-section-eyebrow" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                <Award size={14} />
                <span>ALUMNI PREVIEWS</span>
              </div>
              <h2 className="home-section-title" style={{ margin: 0 }}>
                Learn from those who came before you.
              </h2>
              <p className="home-section-desc" style={{ margin: "0.4rem 0 0 0" }}>
                Explore alumni profiles, career journeys, expertise and professional experiences.
              </p>
            </div>
            <Link
              to="/people"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem", fontWeight: 700, color: "#2563eb", textDecoration: "none" }}
            >
              <span>Explore All Alumni →</span>
            </Link>
          </div>

          {/* Alumni Grid */}
          {loadingAlumni ? (
            <div className="home-grid-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="home-card" style={{ opacity: 0.6 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#e2e8f0" }} />
                      <div style={{ width: "48px", height: "20px", borderRadius: "999px", backgroundColor: "#e2e8f0" }} />
                    </div>
                    <div style={{ width: "75%", height: "18px", borderRadius: "6px", backgroundColor: "#e2e8f0", marginBottom: "0.5rem" }} />
                    <div style={{ width: "50%", height: "14px", borderRadius: "6px", backgroundColor: "#e2e8f0", marginBottom: "0.5rem" }} />
                    <div style={{ width: "65%", height: "12px", borderRadius: "6px", backgroundColor: "#e2e8f0", marginBottom: "1rem" }} />
                  </div>
                  <div className="home-card-footer">
                    <div style={{ width: "100%", height: "34px", borderRadius: "10px", backgroundColor: "#e2e8f0" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredAlumni.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", borderRadius: "20px", border: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-color, #f8fafc)", marginBottom: "2.5rem" }}>
              <Users size={36} style={{ margin: "0 auto 0.5rem auto", color: "var(--text-muted, #64748b)" }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted, #64748b)", margin: 0 }}>
                No alumni profiles available yet.
              </p>
            </div>
          ) : (
            <div className="home-grid-4">
              {featuredAlumni.slice(0, 4).map((person) => (
                <div key={person._id} className="home-card">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div className="home-alumni-avatar-wrap">
                        <img
                          src={person.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"}
                          alt={person.name}
                          className="home-alumni-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop";
                          }}
                        />
                        {person.isVerifiedAlumni && (
                          <div className="home-alumni-badge">
                            <CheckCircle size={13} style={{ fill: "#2563eb", color: "#ffffff" }} />
                          </div>
                        )}
                      </div>
                      {person.willingToMentor && (
                        <span className="home-mentor-tag">
                          Mentor
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 0.2rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Link to={`/profile/${person._id}`} style={{ color: "inherit", textDecoration: "none" }}>{person.name}</Link>
                    </h4>
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2563eb", margin: "0 0 0.25rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {person.jobTitle} {person.company ? `@ ${person.company}` : ""}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted, #64748b)", margin: "0 0 0.85rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {person.department || "Engineering"} • Class of {person.batch || "2021"}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.75rem" }}>
                      {person.skills &&
                        person.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="home-skill-pill"
                          >
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* View Profile Action strictly linking to /profile/:id */}
                  <div className="home-card-footer">
                    <Link
                      to={`/profile/${person._id}`}
                      className="home-view-profile-btn"
                    >
                      <span>View Profile</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <Link
              to="/people"
              className="home-btn-primary"
              style={{ background: "linear-gradient(135deg, #0f172a, #1e3a8a)", padding: "0.85rem 2rem" }}
            >
              <span>Explore All {stats.alumniCount}+ Alumni Members</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
         6. CAREER DOMAINS SECTION (CURATED TECHNICAL SPECIALIZATIONS)
         ============================================================ */}
      <section className="home-section-alt">
        <div className="home-container">
          
          <div className="home-section-header-row">
            <div>
              <div className="home-section-eyebrow" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
                <Code2 size={14} />
                <span>DOMAIN HUBS</span>
              </div>
              <h2 className="home-section-title" style={{ margin: 0 }}>
                Explore the paths that interest you.
              </h2>
              <p className="home-section-desc" style={{ margin: "0.4rem 0 0 0" }}>
                Master curated technical roadmaps, production architectures, and interview preparation guides.
              </p>
            </div>
            <Link
              to="/domains"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem", fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}
            >
              <span>Explore All Domains →</span>
            </Link>
          </div>

          {/* 8 Domain Cards */}
          <div className="home-grid-4">
            {FEATURED_DOMAINS.map((dom) => {
              const IconComp = dom.icon;
              return (
                <div key={dom.id} className="home-card">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div
                        className="home-domain-icon-box"
                        style={{ backgroundColor: dom.color }}
                      >
                        <IconComp size={24} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted, #64748b)" }}>
                        {dom.countText}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                      {dom.name}
                    </h3>
                    <div className="home-domain-stack">
                      {dom.stack}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)", lineHeight: 1.55, marginBottom: "1rem" }}>
                      {dom.description}
                    </p>
                  </div>

                  <div className="home-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted, #94a3b8)" }}>Roadmap Ready</span>
                    <Link
                      to={`/domains?domain=${encodeURIComponent(dom.name)}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 700, color: dom.color, textDecoration: "none" }}
                    >
                      <span>Explore</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link
              to="/domains"
              className="home-btn-primary"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", padding: "0.85rem 2rem" }}
            >
              <span>Explore All Technical Domains</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
         7. JOB OPPORTUNITIES SECTION (RECENT POSTINGS PREVIEW)
         ============================================================ */}
      <section className="home-section-white">
        <div className="home-container">
          
          <div className="home-section-header-row">
            <div>
              <div className="home-section-eyebrow" style={{ backgroundColor: "rgba(5, 150, 105, 0.1)", color: "#059669", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                <Briefcase size={14} />
                <span>HIRING OPPORTUNITIES</span>
              </div>
              <h2 className="home-section-title" style={{ margin: 0 }}>
                Opportunities that move you forward.
              </h2>
              <p className="home-section-desc" style={{ margin: "0.4rem 0 0 0" }}>
                Discover relevant opportunities shared by alumni and the GradConnect community.
              </p>
            </div>
            <Link
              to="/jobs"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem", fontWeight: 700, color: "#059669", textDecoration: "none" }}
            >
              <span>Explore Jobs →</span>
            </Link>
          </div>

          {/* 3 Job Cards */}
          <div className="home-grid-3">
            {FEATURED_JOBS.map((job) => (
              <div key={job._id} className="home-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span className="home-job-type-badge">
                      {job.type}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted, #94a3b8)" }}>
                      {job.postedDate}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                    <Link to="/jobs" style={{ color: "inherit", textDecoration: "none" }}>{job.title}</Link>
                  </h3>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-main, #334155)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Building size={15} style={{ color: "var(--text-muted, #94a3b8)" }} />
                    <span>{job.company}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--text-muted, #64748b)", marginBottom: "0.85rem" }}>
                    <MapPin size={13} style={{ color: "var(--text-muted, #94a3b8)", flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.location}</span>
                  </div>

                  <div className="home-job-comp-box">
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-main, #0f172a)" }}>{job.compensation}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #64748b)" }}>{job.experience}</div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.85rem" }}>
                    {job.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="home-skill-pill"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="home-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>
                    <CheckCircle size={13} />
                    <span>Referral Available</span>
                  </div>
                  <Link
                    to="/jobs"
                    className="home-job-btn"
                  >
                    <span>View Opportunity</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link
              to="/jobs"
              className="home-btn-primary"
              style={{ background: "linear-gradient(135deg, #059669, #0d9488)", padding: "0.85rem 2rem" }}
            >
              <span>View All {stats.jobCount}+ Active Openings</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
         8. BLOG / KNOWLEDGE SECTION (COMMUNITY INSIGHTS)
         ============================================================ */}
      <section className="home-section-alt">
        <div className="home-container">
          
          <div className="home-section-header-row">
            <div>
              <div className="home-section-eyebrow" style={{ backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.2)" }}>
                <FileText size={14} />
                <span>KNOWLEDGE HUB</span>
              </div>
              <h2 className="home-section-title" style={{ margin: 0 }}>
                Insights from the GradConnect community.
              </h2>
              <p className="home-section-desc" style={{ margin: "0.4rem 0 0 0" }}>
                Explore blogs, experiences, technical insights and career advice.
              </p>
            </div>
            <Link
              to="/blogs"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.875rem", fontWeight: 700, color: "#d97706", textDecoration: "none" }}
            >
              <span>Explore Blogs →</span>
            </Link>
          </div>

          {/* 3 Blog Cards */}
          {loadingBlogs ? (
            <div className="home-grid-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="home-card" style={{ padding: 0, overflow: "hidden", opacity: 0.6 }}>
                  <div style={{ height: "180px", backgroundColor: "#e2e8f0" }} />
                  <div style={{ padding: "1.5rem" }}>
                    <div style={{ width: "75%", height: "18px", borderRadius: "6px", backgroundColor: "#e2e8f0", marginBottom: "0.5rem" }} />
                    <div style={{ width: "100%", height: "14px", borderRadius: "6px", backgroundColor: "#e2e8f0", marginBottom: "0.5rem" }} />
                    <div style={{ width: "60%", height: "14px", borderRadius: "6px", backgroundColor: "#e2e8f0" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : latestBlogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", borderRadius: "20px", border: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-color, #f8fafc)", marginBottom: "2.5rem" }}>
              <FileText size={36} style={{ margin: "0 auto 0.5rem auto", color: "var(--text-muted, #64748b)" }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted, #64748b)", margin: 0 }}>
                No articles available yet.
              </p>
            </div>
          ) : (
            <div className="home-grid-3">
              {latestBlogs.map((b) => {
                const defaultCover = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop";
                const coverSrc = b.bannerImage && b.bannerImage.startsWith("http") ? b.bannerImage : defaultCover;
                const articleLink = b.slug ? `/blog/${b.slug}` : `/blogs/${b._id}`;

                return (
                  <div key={b._id} className="home-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div>
                      <div className="home-blog-image-wrap">
                        <img
                          src={coverSrc}
                          alt={b.title}
                          className="home-blog-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultCover;
                          }}
                        />
                        <span className="home-blog-tag">
                          {b.domain || b.category || "Engineering"}
                        </span>
                      </div>

                      <div className="home-blog-content">
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.5rem", lineHeight: 1.35 }}>
                          <Link to={articleLink} style={{ color: "inherit", textDecoration: "none" }}>{b.title}</Link>
                        </h3>
                        <p style={{ fontSize: "0.825rem", color: "var(--text-muted, #64748b)", lineHeight: 1.6, margin: 0 }}>
                          {b.shortDescription || "Read practical takeaways, architectural insights, and interview lessons on GradConnect."}
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: "0 1.5rem 1.25rem 1.5rem", marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "0.85rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted, #64748b)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        By {b.author?.name || "GradConnect Alumni"}
                      </span>
                      <Link
                        to={articleLink}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontWeight: 700, color: "#dc2626", textDecoration: "none", flexShrink: 0 }}
                      >
                        <span>Read Article</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <Link
              to="/blogs"
              className="home-btn-primary"
              style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)", padding: "0.85rem 2rem" }}
            >
              <span>Explore All {stats.resourceCount || 30}+ Career Articles</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
         9. CAREER JOURNEY / VALUE PROGRESSION SECTION
         ============================================================ */}
      <section className="home-section-white">
        <div className="home-container">
          
          <div className="home-section-header">
            <div className="home-section-eyebrow" style={{ backgroundColor: "rgba(79, 70, 229, 0.1)", color: "#4f46e5", border: "1px solid rgba(79, 70, 229, 0.2)" }}>
              <Compass size={14} />
              <span>THE ECOSYSTEM</span>
            </div>
            <h2 className="home-section-title">
              From classroom learning to career confidence.
            </h2>
            <p className="home-section-desc">
              GradConnect unites students, verified graduates, domain knowledge, and career opportunities into an interconnected ecosystem.
            </p>
          </div>

          {/* Visual Progression: Learn → Connect → Mentor → Discover → Grow */}
          <div className="home-journey-track">
            
            {/* 1. Learn */}
            <div className="home-journey-node">
              <div className="home-journey-icon" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                <BookOpen size={22} />
              </div>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.25rem" }}>Learn</h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)", lineHeight: 1.5, margin: 0 }}>
                Access curated technical roadmaps and project blueprints.
              </p>
            </div>

            {/* 2. Connect */}
            <div className="home-journey-node">
              <div className="home-journey-icon" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
                <Users size={22} />
              </div>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.25rem" }}>Connect</h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)", lineHeight: 1.5, margin: 0 }}>
                Discover alumni across batches, companies, and departments.
              </p>
            </div>

            {/* 3. Mentor */}
            <div className="home-journey-node">
              <div className="home-journey-icon" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                <HeartHandshake size={22} />
              </div>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.25rem" }}>Mentor</h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)", lineHeight: 1.5, margin: 0 }}>
                Receive 1-on-1 portfolio reviews and mock interview guidance.
              </p>
            </div>

            {/* 4. Discover */}
            <div className="home-journey-node">
              <div className="home-journey-icon" style={{ backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.2)" }}>
                <Sparkles size={22} />
              </div>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.25rem" }}>Discover</h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)", lineHeight: 1.5, margin: 0 }}>
                Unlock exclusive job openings and alumni referral pipelines.
              </p>
            </div>

            {/* 5. Grow */}
            <div className="home-journey-node">
              <div className="home-journey-icon" style={{ backgroundColor: "rgba(5, 150, 105, 0.1)", color: "#059669", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                <TrendingUp size={22} />
              </div>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.25rem" }}>Grow</h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)", lineHeight: 1.5, margin: 0 }}>
                Advance into senior roles and mentor the next cohort of graduates.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
         10. CALL-TO-ACTION SECTION (AUTHENTICATION-AWARE)
         ============================================================ */}
      <section className="home-cta-section">
        <div className="home-hero-glow-1" />
        <div className="home-hero-glow-2" />

        <div className="home-cta-inner">
          <GraduationCap size={56} style={{ margin: "0 auto 1rem auto", color: "#fbbf24" }} />
          
          <h2
            style={{
              fontFamily: 'var(--font-heading, "Fraunces", serif)',
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              color: "#ffffff",
              marginBottom: "1rem",
              lineHeight: 1.2,
            }}
          >
            {user
              ? "Keep growing with GradConnect."
              : "Ready to build connections that matter?"}
          </h2>

          <p style={{ fontSize: "clamp(1rem, 1.8vw, 1.15rem)", color: "#cbd5e1", maxWidth: "600px", margin: "0 auto 2rem auto", lineHeight: 1.7 }}>
            {user
              ? "Explore new connections, opportunities and knowledge."
              : "Join GradConnect and discover a community built around learning, mentorship and career growth."}
          </p>

          <div className="home-cta-btn-group">
            {user ? (
              <>
                <Link
                  to="/people"
                  className="home-btn-primary home-btn-primary-gradient"
                  style={{ padding: "0.95rem 2rem", fontSize: "1rem" }}
                >
                  <Users size={18} />
                  <span>Discover Alumni</span>
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/jobs"
                  className="home-btn-secondary"
                  style={{ padding: "0.95rem 1.85rem", fontSize: "1rem" }}
                >
                  <Briefcase size={17} style={{ color: "#34d399" }} />
                  <span>Explore Jobs</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="home-btn-primary home-btn-primary-gradient"
                  style={{ padding: "0.95rem 2rem", fontSize: "1rem" }}
                >
                  <span>Create Your Profile</span>
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/people"
                  className="home-btn-secondary"
                  style={{ padding: "0.95rem 1.85rem", fontSize: "1rem" }}
                >
                  <Users size={17} style={{ color: "#60a5fa" }} />
                  <span>Discover Alumni</span>
                </Link>

                <Link
                  to="/jobs"
                  className="home-btn-secondary"
                  style={{ padding: "0.95rem 1.85rem", fontSize: "1rem" }}
                >
                  <Briefcase size={17} style={{ color: "#34d399" }} />
                  <span>Explore Jobs</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
         11. FOOTER (GLOBAL COMPONENT PINNED TO BOTTOM)
         ============================================================ */}
      <Footer />
    </div>
  );
};

export default Home;
