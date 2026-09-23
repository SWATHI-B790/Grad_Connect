import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenLine,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  X,
  FileText,
  Globe,
  FileEdit,
  Sparkles,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/getImageUrl";
import Footer from "../components/Footer";

const MyBlogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'published' | 'draft'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'views' | 'title'

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fallback image error state map
  const [imgErrors, setImgErrors] = useState({});

  // Redirect if not logged in or not alumni/admin
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: "/my-blogs", message: "Please log in to view your submitted experiences." },
      });
      return;
    }
    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      user.role?.toLowerCase()
    );
    const isAlumni = user.role?.toLowerCase() === "alumni" || user.userType === "Alumni";
    if (!isAdmin && !isAlumni) {
      navigate("/blogs", {
        replace: true,
        state: { error: "Only verified alumni have access to personal experience articles." },
      });
    }
  }, [user, navigate]);

  const fetchMyBlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/blogs/my");
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error("Failed to fetch alumni experiences:", err);
      setError("Failed to load your experiences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyBlogs();
    }
  }, [user]);

  // Dynamic statistics
  const totalExperiences = blogs.length;
  const publishedCount = useMemo(() => {
    return blogs.filter((b) => (b.status || "").toLowerCase() === "published").length;
  }, [blogs]);
  const draftsCount = useMemo(() => {
    return blogs.filter((b) => (b.status || "").toLowerCase() !== "published").length;
  }, [blogs]);
  const totalViews = useMemo(() => {
    return blogs.reduce((sum, b) => sum + (Number(b.views) || 0), 0);
  }, [blogs]);

  // Filtered & Sorted blogs
  const filteredBlogs = useMemo(() => {
    let list = [...blogs];

    // Status tab filter
    if (statusFilter === "published") {
      list = list.filter((b) => (b.status || "").toLowerCase() === "published");
    } else if (statusFilter === "draft") {
      list = list.filter((b) => (b.status || "").toLowerCase() !== "published");
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => {
        const title = (b.title || "").toLowerCase();
        const category = (b.category || "").toLowerCase();
        const domain = (b.domain || "").toLowerCase();
        const company = (b.company || "").toLowerCase();
        const role = (b.jobRole || "").toLowerCase();
        const desc = (b.shortDescription || b.description || "").toLowerCase();
        return (
          title.includes(q) ||
          category.includes(q) ||
          domain.includes(q) ||
          company.includes(q) ||
          role.includes(q) ||
          desc.includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "views") {
        return (Number(b.views) || 0) - (Number(a.views) || 0);
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

    return list;
  }, [blogs, statusFilter, searchQuery, sortBy]);

  const handleDeleteClick = (blog) => {
    setBlogToDelete(blog);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/blogs/${blogToDelete._id}`);
      setSuccess(`"${blogToDelete.title}" was deleted successfully.`);
      setDeleteModalOpen(false);
      setBlogToDelete(null);
      fetchMyBlogs();
    } catch (err) {
      console.error("Delete experience error:", err);
      setError(err.response?.data?.message || "Failed to delete experience.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleImageError = (blogId) => {
    setImgErrors((prev) => ({ ...prev, [blogId]: true }));
  };

  return (
    <div className="my-experiences-page">
      <div className="my-experiences-container">
        {/* 1. Page Hero */}
        <div className="my-experiences-hero">
          <div className="my-experiences-hero__left">
            <div className="my-experiences-eyebrow">
              <span className="my-experiences-eyebrow__dot"></span>
              ALUMNI STORIES
            </div>
            <h1 className="my-experiences-hero__title">My Experiences</h1>
            <p className="my-experiences-hero__subtitle">
              Share your career journey, interview experiences, technical knowledge, placement
              lessons, and insights with the GradConnect community.
            </p>
          </div>

          <div className="my-experiences-hero__actions">
            <button
              type="button"
              onClick={fetchMyBlogs}
              className="my-experiences-btn-secondary"
              title="Refresh your experiences"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <Link to="/blogs/create" className="my-experiences-btn-primary">
              <PenLine size={16} strokeWidth={2.4} />
              <span>+ Share Your Experience</span>
            </Link>
          </div>
        </div>

        {/* 2. Professional Introduction Area */}
        <div className="my-experiences-intro">
          <div className="my-experiences-intro__icon-box">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="my-experiences-intro__text-lead">
              Your experience can help the next graduate.
            </div>
            <p className="my-experiences-intro__text-sub">
              Turn your interview lessons, workplace experiences, placement journey, technical knowledge,
              and career advice into practical guidance for the GradConnect community.
            </p>
          </div>
        </div>

        {/* 3. Redesigned Statistics (Metrics Row) */}
        <div className="my-experiences-metrics-grid">
          {/* Metric 1: ARTICLES */}
          <div className="my-experiences-metric-card">
            <div className="my-experiences-metric-card__header">
              <span className="my-experiences-metric-card__label">ARTICLES</span>
              <div
                className="my-experiences-metric-card__icon-wrap"
                style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
              >
                <FileText size={17} />
              </div>
            </div>
            <div className="my-experiences-metric-card__value">{totalExperiences}</div>
            <div className="my-experiences-metric-card__subtext">Experiences shared</div>
          </div>

          {/* Metric 2: PUBLISHED */}
          <div className="my-experiences-metric-card">
            <div className="my-experiences-metric-card__header">
              <span className="my-experiences-metric-card__label">PUBLISHED</span>
              <div
                className="my-experiences-metric-card__icon-wrap"
                style={{ backgroundColor: "#ecfdf5", color: "#16a34a" }}
              >
                <Globe size={17} />
              </div>
            </div>
            <div className="my-experiences-metric-card__value">{publishedCount}</div>
            <div className="my-experiences-metric-card__subtext">Live on GradConnect</div>
          </div>

          {/* Metric 3: READS */}
          <div className="my-experiences-metric-card">
            <div className="my-experiences-metric-card__header">
              <span className="my-experiences-metric-card__label">READS</span>
              <div
                className="my-experiences-metric-card__icon-wrap"
                style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
              >
                <Eye size={17} />
              </div>
            </div>
            <div className="my-experiences-metric-card__value">{totalViews.toLocaleString()}</div>
            <div className="my-experiences-metric-card__subtext">Community views</div>
          </div>

          {/* Metric 4: DRAFTS */}
          <div className="my-experiences-metric-card">
            <div className="my-experiences-metric-card__header">
              <span className="my-experiences-metric-card__label">DRAFTS</span>
              <div
                className="my-experiences-metric-card__icon-wrap"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
              >
                <FileEdit size={17} />
              </div>
            </div>
            <div className="my-experiences-metric-card__value">{draftsCount}</div>
            <div className="my-experiences-metric-card__subtext">Work in progress</div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "1.5rem",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "1.5rem",
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* 4. Toolbar: Search, Segmented Control & Sort */}
        <div className="my-experiences-toolbar">
          {/* Search Field */}
          <div className="my-experiences-search-wrap">
            <Search size={16} className="my-experiences-search-icon" />
            <input
              type="text"
              className="my-experiences-search-input"
              placeholder="Search your experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="my-experiences-search-clear"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Segmented Filter Control & Sort */}
          <div className="my-experiences-toolbar__right">
            <div className="my-experiences-segmented-ctrl">
              <button
                type="button"
                className={`my-experiences-seg-btn ${
                  statusFilter === "all" ? "my-experiences-seg-btn--active" : ""
                }`}
                onClick={() => setStatusFilter("all")}
              >
                <span>All</span>
                <span className="my-experiences-seg-badge">{blogs.length}</span>
              </button>
              <button
                type="button"
                className={`my-experiences-seg-btn ${
                  statusFilter === "published" ? "my-experiences-seg-btn--active" : ""
                }`}
                onClick={() => setStatusFilter("published")}
              >
                <span>Published</span>
                <span className="my-experiences-seg-badge">{publishedCount}</span>
              </button>
              <button
                type="button"
                className={`my-experiences-seg-btn ${
                  statusFilter === "draft" ? "my-experiences-seg-btn--active" : ""
                }`}
                onClick={() => setStatusFilter("draft")}
              >
                <span>Drafts</span>
                <span className="my-experiences-seg-badge">{draftsCount}</span>
              </button>
            </div>

            <div className="my-experiences-sort-wrap">
              <label htmlFor="exp-sort-select" className="my-experiences-sort-label">
                Sort:
              </label>
              <select
                id="exp-sort-select"
                className="my-experiences-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="views">Most Viewed</option>
                <option value="title">Title (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Experience List / Empty States */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "72px 0", color: "#64748b" }}>
            <RefreshCw size={36} className="animate-spin text-red-600 mx-auto mb-3" />
            <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>Loading your experiences...</p>
          </div>
        ) : blogs.length === 0 ? (
          /* Empty State: No experiences yet */
          <div className="my-experiences-empty">
            <div className="my-experiences-empty__icon-wrap">
              <BookOpen size={28} />
            </div>
            <h3 className="my-experiences-empty__title">No experiences yet</h3>
            <p className="my-experiences-empty__desc">
              Share your first career story, interview experience, or professional insight with the
              GradConnect community.
            </p>
            <Link
              to="/blogs/create"
              className="my-experiences-btn-primary"
              style={{ margin: "0 auto" }}
            >
              <PenLine size={16} strokeWidth={2.4} />
              <span>+ Share Your Experience</span>
            </Link>
          </div>
        ) : filteredBlogs.length === 0 ? (
          /* Empty State: Filter/search yield no match */
          <div className="my-experiences-empty" style={{ padding: "48px 24px" }}>
            <div
              className="my-experiences-empty__icon-wrap"
              style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
            >
              <Search size={26} />
            </div>
            <h3 className="my-experiences-empty__title" style={{ fontSize: "1.25rem" }}>
              No matching experiences found
            </h3>
            <p className="my-experiences-empty__desc" style={{ maxWidth: "420px" }}>
              {searchQuery
                ? `No articles match "${searchQuery}" in the selected filter.`
                : "No articles match the selected filter."}
            </p>
            <button
              type="button"
              className="my-experiences-btn-secondary"
              style={{ margin: "0 auto" }}
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Editorial Article Rows */
          <div className="my-experiences-list">
            {filteredBlogs.map((b) => {
              const hasImg = b.bannerImage && !imgErrors[b._id];
              const isPublished = (b.status || "").toLowerCase() === "published";

              return (
                <div key={b._id} className="my-experience-row">
                  {/* Column 1: Left Thumbnail */}
                  <Link to={`/blog/${b.slug}`} className="my-experience-row__thumb-link">
                    {hasImg ? (
                      <img
                        src={getImageUrl(b.bannerImage)}
                        alt={b.title}
                        className="my-experience-row__thumb"
                        onError={() => handleImageError(b._id)}
                      />
                    ) : (
                      <div className="my-experience-row__thumb-placeholder">
                        <BookOpen size={24} />
                      </div>
                    )}
                  </Link>

                  {/* Column 2: Article Information */}
                  <div className="my-experience-row__info">
                    <h3 className="my-experience-row__title">
                      <Link to={`/blog/${b.slug}`} className="my-experience-row__title-link">
                        {b.title}
                      </Link>
                    </h3>

                    {/* Metadata line: Category · Domain · Company */}
                    <div className="my-experience-row__meta">
                      {b.category && (
                        <span className="my-experience-row__cat-pill">{b.category}</span>
                      )}
                      {b.domain && (
                        <span className="my-experience-row__domain">· {b.domain}</span>
                      )}
                      {b.company && (
                        <span className="my-experience-row__company">
                          · {b.jobRole ? `${b.jobRole} @ ` : ""}{b.company}
                        </span>
                      )}
                    </div>

                    {/* Sub-info: Created/Updated Date · Views */}
                    <div className="my-experience-row__sub-info">
                      <span className="my-experience-row__sub-item">
                        <Calendar size={13} style={{ color: "#94a3b8" }} />
                        <span>Created {formatDate(b.createdAt)}</span>
                        {b.updatedAt && b.updatedAt !== b.createdAt && (
                          <span style={{ color: "#94a3b8" }}>
                            · Updated {formatDate(b.updatedAt)}
                          </span>
                        )}
                      </span>

                      <span className="my-experience-row__sub-item">
                        <Eye size={13} style={{ color: "#94a3b8" }} />
                        <span>{(Number(b.views) || 0).toLocaleString()} views</span>
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Status Indicator */}
                  <div className="my-experience-row__status">
                    <span
                      className={`exp-status-pill ${
                        isPublished ? "exp-status-pill--published" : "exp-status-pill--draft"
                      }`}
                    >
                      <span className="exp-status-pill__dot"></span>
                      <span>{isPublished ? "Published" : "Draft"}</span>
                    </span>
                  </div>

                  {/* Column 4: Consistent Action Buttons */}
                  <div className="my-experience-row__actions">
                    <Link
                      to={`/blog/${b.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="my-exp-action-btn my-exp-action-btn--view"
                      title="View Experience"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => navigate(`/blogs/edit/${b._id}`)}
                      className="my-exp-action-btn my-exp-action-btn--edit"
                      title="Edit Experience"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClick(b)}
                      className="my-exp-action-btn my-exp-action-btn--delete"
                      title="Delete Experience"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModalOpen && blogToDelete && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "16px",
              }}
              onClick={() => setDeleteModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  maxWidth: "440px",
                  width: "100%",
                  padding: "26px",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "#fef2f2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px auto",
                  }}
                >
                  <Trash2 size={24} />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading, 'Fraunces', Georgia, serif)",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    textAlign: "center",
                    marginBottom: "8px",
                  }}
                >
                  Delete Experience?
                </h3>
                <p
                  style={{
                    fontSize: "0.885rem",
                    color: "#64748b",
                    textAlign: "center",
                    lineHeight: 1.55,
                    marginBottom: "22px",
                  }}
                >
                  Are you sure you want to permanently delete{" "}
                  <strong style={{ color: "#0f172a" }}>"{blogToDelete.title}"</strong>? This action
                  cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={handleDeleteConfirm}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#dc2626",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: deleteLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                    }}
                  >
                    {deleteLoading ? "Deleting..." : "Delete Permanently"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default MyBlogs;
