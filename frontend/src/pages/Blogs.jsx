import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  FolderSearch,
  PenTool,
  Sparkles,
  BookOpen,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BlogCard from "../components/BlogCard";
import CategoryFilter from "../components/CategoryFilter";
import SkeletonCard from "../components/SkeletonCard";
import Footer from "../components/Footer";

const Blogs = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const isAdmin = Boolean(
    user &&
      ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
        user.role?.toLowerCase()
      )
  );
  const isAlumni = Boolean(
    user &&
      (user.role?.toLowerCase() === "alumni" || user.userType === "Alumni") &&
      !isAdmin
  );
  const isStudent = Boolean(
    user &&
      (user.role?.toLowerCase() === "student" || user.userType === "Student") &&
      !isAdmin
  );

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        let url = `/blogs?limit=12`;
        if (activeCategory !== "All") {
          url += `&category=${encodeURIComponent(activeCategory)}`;
        }
        const response = await API.get(url);
        setBlogs(response.data.blogs || []);
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [activeCategory]);

  const filteredBlogs = blogs.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.title?.toLowerCase().includes(query) ||
      b.shortDescription?.toLowerCase().includes(query) ||
      b.category?.toLowerCase().includes(query) ||
      b.author?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="blogs-page">
      <div className="blogs-container">
        {/* Editorial Alumni Hub Hero Header */}
        <div className="blogs-hero-wrapper">
          <div className="blogs-eyebrow-pill">
            <GraduationCap size={14} />
            <span>ALUMNI EXPERIENCE HUB</span>
          </div>

          <h1 className="blogs-main-title">
            Learn From Our Alumni Experiences
          </h1>

          <div className="blogs-accent-bar" />

          <p className="blogs-main-subtitle">
            Real-world career reflections, interview preparation guides, internship journeys, and mentorship advice shared by verified alumni.
          </p>

          {/* Search Input */}
          <div className="blogs-search-wrapper">
            <Search size={18} className="blogs-search-icon" />
            <input
              type="text"
              placeholder="Search alumni experiences, interviews, internships..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="blogs-search-input"
            />
          </div>

          {/* Share Experience Action Bar */}
          {!user ? (
            <div className="blogs-action-row">
              <Link
                to="/login"
                state={{
                  from: "/blogs/create",
                  message: "Please log in with your alumni account to share your experience.",
                }}
                className="btn-share-experience"
              >
                <PenTool size={14} />
                <span>Share Your Experience</span>
              </Link>
            </div>
          ) : isAlumni ? (
            <div className="blogs-action-row" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/blogs/create" className="btn-share-experience">
                <PenTool size={14} />
                <span>Share Your Experience</span>
              </Link>
              <Link
                to="/my-blogs"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <BookOpen size={14} />
                <span>My Experiences</span>
              </Link>
            </div>
          ) : isAdmin ? (
            <div className="blogs-action-row">
              <Link to="/admin/blogs/create" className="btn-share-experience">
                <PenTool size={14} />
                <span>Create Admin Article</span>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Compact Professional Category Filters */}
        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
        />

        {/* Feed Section Header */}
        <div className="blogs-feed-header">
          <div>
            <h2 className="blogs-feed-title">
              {activeCategory === "All"
                ? "Latest Alumni Experiences"
                : `${activeCategory} Stories`}
            </h2>
            <p className="blogs-feed-sub">
              Articles and guidance published by alumni who have been there
            </p>
          </div>
          <span className="blogs-count-badge">
            {filteredBlogs.length} {filteredBlogs.length === 1 ? "Experience" : "Experiences"}
          </span>
        </div>

        {/* Blogs Grid */}
        {loading ? (
          <div className="blogs-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="blogs-empty-state">
            <FolderSearch size={44} className="text-slate-400 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-semibold text-slate-800 mb-1">
              No Alumni Experiences Found
            </h3>
            <p className="font-body text-sm text-slate-500 max-w-md mx-auto mb-4">
              {searchQuery
                ? `No stories matched "${searchQuery}". Try a different keyword or browse other categories.`
                : "No articles published in this category yet."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="btn btn-primary btn-sm"
            >
              View All Categories
            </button>
          </div>
        ) : (
          <div className="blogs-grid">
            <AnimatePresence>
              {filteredBlogs.map((blog, idx) => (
                <BlogCard key={blog._id} blog={blog} index={idx} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Blogs;
