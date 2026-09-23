import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Calendar,
  Eye,
  User,
  Users,
  ArrowLeft,
  Share2,
  Bookmark,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import API from "../api/axios";
import { getCategoryStyle } from "../utils/categoryColors";
import { getImageUrl } from "../utils/getImageUrl";
import BlogCard from "../components/BlogCard";
import Footer from "../components/Footer";

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const viewRecordedRef = useRef(null);

  // Reading progress indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Track scroll position for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch Blog Article Detail
  useEffect(() => {
    const fetchBlogDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await API.get(`/blogs/${slug}`);
        setBlog(response.data.blog);
        setRelatedArticles(response.data.relatedArticles || []);
      } catch (err) {
        console.error("Failed to load article detail:", err);
        setError(
          err.response?.data?.message ||
            "This article is no longer available or may have been removed."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetail();
    window.scrollTo(0, 0);
  }, [slug]);

  // Record Authentic View Event Once
  useEffect(() => {
    if (!blog || !blog._id || viewRecordedRef.current === blog._id) return;
    viewRecordedRef.current = blog._id;

    const recordView = async () => {
      try {
        const res = await API.post(`/blogs/${blog._id}/view`);
        if (res.data.success) {
          setBlog((prev) => ({
            ...prev,
            views: res.data.totalViews,
            uniqueViewers: res.data.uniqueViewers,
          }));
        }
      } catch (err) {
        console.error("View tracking error:", err);
      }
    };

    recordView();
  }, [blog?._id]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="blog-detail-loading-container">
        <div className="spinner"></div>
        <p>Loading Article...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="blog-detail-not-found">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="not-found-card"
        >
          <AlertCircle size={56} className="not-found-icon" />
          <h2>Article Unavailable</h2>
          <p>{error || "The requested blog article could not be found."}</p>
          <Link to="/blogs" className="btn btn-primary mt-4">
            <ArrowLeft size={18} />
            <span>Back to All Articles</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const categoryStyle = getCategoryStyle(blog.category);
  const CategoryIcon = categoryStyle.icon;
  const bannerImageSrc = getImageUrl(blog.bannerImage);

  return (
    <div className="blog-detail-page">
      {/* Top Reading Progress Bar */}
      <motion.div className="reading-progress-bar" style={{ scaleX }} />

      {/* Back Navigation Bar */}
      <div className="detail-top-nav">
        <div className="section-container">
          <Link to="/blogs" className="back-link">
            <ArrowLeft size={18} />
            <span>Back to All Articles &amp; Insights</span>
          </Link>
        </div>
      </div>

      {/* Hero Header Section */}
      <header className="article-hero">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="article-header-content"
          >
            {/* Category Pill */}
            <div
              className="detail-category-badge"
              style={{
                backgroundColor: categoryStyle.bg,
                color: categoryStyle.color,
                borderColor: categoryStyle.border,
              }}
            >
              <CategoryIcon size={16} />
              <span>{blog.category}</span>
            </div>

            {/* Title */}
            <h1 className="article-title font-heading font-semibold tracking-tight">{blog.title}</h1>

            {/* Short Description */}
            <p className="article-excerpt">{blog.shortDescription}</p>

            {/* Article Meta Bar */}
            <div className="article-meta-bar">
              <div className="author-meta">
                <div className="author-avatar-large">
                  <User size={18} />
                </div>
                <div>
                  <span className="author-label">AUTHOR / CONTRIBUTOR</span>
                  <h4 className="author-full-name font-heading">
                    {blog.author?.name || "GradConnect Editorial"}
                    {blog.author?.adminLabel && (
                      <span className="author-tag"> ({blog.author.adminLabel})</span>
                    )}
                  </h4>
                </div>
              </div>

              <div className="meta-divider" />

              <div className="meta-stats">
                <span className="stat-pill">
                  <Calendar size={16} />
                  <span>{formatDate(blog.createdAt)}</span>
                </span>
                <span className="stat-pill">
                  <Eye size={16} />
                  <span>{blog.views} total views</span>
                </span>
                {blog.uniqueViewers !== undefined && (
                  <span className="stat-pill">
                    <Users size={16} />
                    <span>{blog.uniqueViewers} unique viewers</span>
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Banner Image */}
      <div className="article-banner-container">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="banner-image-wrapper"
          >
            <img
              src={bannerImageSrc}
              alt={blog.title}
              className="article-banner-image"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop";
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Article Content Section */}
      <main className="article-main-content">
        <div className="section-container content-grid">
          {/* Main Body */}
          <article className="article-body">
            <div
              className="formatted-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Community Guidance Box */}
            <div className="article-safety-box">
              <Sparkles size={28} className="safety-box-icon" />
              <div>
                <h4>GradConnect Community Article</h4>
                <p>
                  Experiences and insights shared here reflect individual alumni journeys and perspectives. For career guidance and verified mentorship, connect directly with alumni on GradConnect.
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <section className="section-related-articles">
          <div className="section-container">
            <div className="section-header">
              <h3 className="section-title">Related Articles</h3>
            </div>
            <div className="grid-3-col">
              {relatedArticles.map((relBlog, idx) => (
                <BlogCard key={relBlog._id} blog={relBlog} index={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back To Top Floating Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="back-to-top-btn"
          title="Back to Top"
        >
          <ChevronUp size={22} />
        </motion.button>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BlogDetail;
