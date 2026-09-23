import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Star,
  Edit,
  Trash2,
  Eye,
  Calendar,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Sparkles,
  FileEdit,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import API from "../../api/axios";
import { CATEGORIES, getCategoryStyle } from "../../utils/categoryColors";
import { getImageUrl } from "../../utils/getImageUrl";

const BlogList = () => {
  const navigate = useNavigate();

  // Data & Loading States
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Statistics State
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    featured: 0,
    totalViews: 0,
  });

  // Pagination State
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFeatured, setSelectedFeatured] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [shakingId, setShakingId] = useState(null);

  // Fetch blogs with current filters & pagination
  const fetchAdminBlogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", 10);

      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedFeatured !== "all") params.append("featured", selectedFeatured);
      if (selectedSort !== "newest") params.append("sort", selectedSort);

      const response = await API.get(`/admin/blogs?${params.toString()}`);

      setBlogs(response.data.blogs || []);

      if (response.data.stats) {
        setStats(response.data.stats);
      } else {
        const list = response.data.blogs || [];
        setStats({
          total: list.length,
          published: list.filter((b) => b.status === "published").length,
          drafts: list.filter((b) => b.status === "draft").length,
          featured: list.filter((b) => b.isFeatured).length,
          totalViews: list.reduce((acc, b) => acc + (b.views || 0), 0),
        });
      }

      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Fetch admin blogs error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to load blog records. Please check your network connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedStatus, selectedFeatured, selectedSort]);

  // Debounced fetch on search or immediate on filter/page change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAdminBlogs();
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchAdminBlogs]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedStatus("all");
    setSelectedFeatured("all");
    setSelectedSort("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedStatus !== "all" ||
    selectedFeatured !== "all" ||
    selectedSort !== "newest";

  // Toggle Featured Status
  const handleToggleFeatured = async (id) => {
    try {
      const response = await API.patch(`/admin/blogs/${id}/feature`);
      const updated = response.data.blog;

      setBlogs((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isFeatured: updated.isFeatured } : b))
      );

      setStats((prev) => ({
        ...prev,
        featured: updated.isFeatured ? prev.featured + 1 : Math.max(0, prev.featured - 1),
      }));

      setSuccess(
        `Article "${updated.title ? updated.title.slice(0, 32) : "Blog"}..." ${
          updated.isFeatured ? "is now Featured on Homepage" : "removed from Featured"
        }.`
      );
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update featured status");
    }
  };

  // Open Delete Confirmation Modal
  const confirmDelete = (blog) => {
    setShakingId(blog._id);
    setTimeout(() => setShakingId(null), 500);
    setDeleteTarget(blog);
  };

  // Execute Delete Article
  const handleDeleteExecute = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget._id);
    setError("");
    setSuccess("");

    try {
      await API.delete(`/admin/blogs/${deleteTarget._id}`);

      setBlogs((prev) => prev.filter((b) => b._id !== deleteTarget._id));

      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        published:
          deleteTarget.status === "published"
            ? Math.max(0, prev.published - 1)
            : prev.published,
        drafts:
          deleteTarget.status === "draft"
            ? Math.max(0, prev.drafts - 1)
            : prev.drafts,
        featured: deleteTarget.isFeatured
          ? Math.max(0, prev.featured - 1)
          : prev.featured,
      }));

      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      setSuccess(`Article "${deleteTarget.title}" permanently deleted.`);
      setTimeout(() => setSuccess(""), 3500);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete blog error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to delete blog article. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="admin-page-container">
      {/* ============================================================
          1. PAGE HEADER BAR
          ============================================================ */}
      <header className="blog-admin-header">
        <div className="blog-admin-title-group">
          <div className="blog-admin-icon-circle">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="blog-admin-title">Blog Management</h1>
            <p className="blog-admin-subtitle">
              Oversee community publications, review editorial drafts, highlight featured articles, and monitor real reader views.
            </p>
          </div>
        </div>

        <div className="blog-admin-header-actions">
          <button
            type="button"
            onClick={fetchAdminBlogs}
            className="btn-blog-refresh"
            disabled={loading}
            title="Refresh list from database"
          >
            <RefreshCw size={15} className={loading ? "spinner-icon" : ""} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/blogs/create" className="btn-blog-create-primary">
            <Plus size={18} strokeWidth={2.2} />
            <span>Create Blog</span>
          </Link>
        </div>
      </header>

      {/* ============================================================
          2. ANALYTICS KPI CARDS (5 EQUAL COLUMNS)
          ============================================================ */}
      <section className="blog-analytics-grid" aria-label="Blog statistics">
        {/* Total Blogs */}
        <div className="blog-analytics-card">
          <div className="blog-stat-header">
            <span className="blog-stat-label">Total Articles</span>
            <div className="blog-stat-icon-wrap neutral">
              <BookOpen size={16} />
            </div>
          </div>
          <h3 className="blog-stat-value">{stats.total}</h3>
          <p className="blog-stat-subtext">All articles in platform</p>
        </div>

        {/* Published */}
        <div className="blog-analytics-card">
          <div className="blog-stat-header">
            <span className="blog-stat-label">Published</span>
            <div className="blog-stat-icon-wrap green">
              <Sparkles size={16} />
            </div>
          </div>
          <h3 className="blog-stat-value">{stats.published}</h3>
          <p className="blog-stat-subtext">Live on community feed</p>
        </div>

        {/* Drafts */}
        <div className="blog-analytics-card">
          <div className="blog-stat-header">
            <span className="blog-stat-label">Drafts</span>
            <div className="blog-stat-icon-wrap amber">
              <FileEdit size={16} />
            </div>
          </div>
          <h3 className="blog-stat-value">{stats.drafts}</h3>
          <p className="blog-stat-subtext">Unpublished drafts</p>
        </div>

        {/* Featured */}
        <div className="blog-analytics-card">
          <div className="blog-stat-header">
            <span className="blog-stat-label">Featured</span>
            <div className="blog-stat-icon-wrap gold">
              <Star size={16} />
            </div>
          </div>
          <h3 className="blog-stat-value">{stats.featured}</h3>
          <p className="blog-stat-subtext">Pinned on home spotlight</p>
        </div>

        {/* Total Views */}
        <div className="blog-analytics-card">
          <div className="blog-stat-header">
            <span className="blog-stat-label">Total Views</span>
            <div className="blog-stat-icon-wrap blue">
              <Eye size={16} />
            </div>
          </div>
          <h3 className="blog-stat-value">{stats.totalViews.toLocaleString()}</h3>
          <p className="blog-stat-subtext">Cumulative reader impressions</p>
        </div>
      </section>

      {/* ============================================================
          ALERTS & NOTIFICATIONS
          ============================================================ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="blog-alert-box error"
            role="alert"
          >
            <div className="blog-alert-content">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="blog-alert-close"
              aria-label="Close error message"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="blog-alert-box success"
            role="alert"
          >
            <div className="blog-alert-content">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="blog-alert-close"
              aria-label="Close success message"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          3. MANAGEMENT TOOLBAR (SEARCH & FILTERS)
          ============================================================ */}
      <div className="blog-management-toolbar">
        {/* Search Input with Guaranteed No-Overlap Icon */}
        <div className="blog-search-wrapper">
          <Search size={18} className="blog-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by title, author, or keyword..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="blog-search-input"
            aria-label="Search articles"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="blog-search-clear"
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category / Domain Filter */}
        <div className="blog-filter-select-wrapper">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="blog-filter-select"
            aria-label="Filter by category"
          >
            <option value="All">All Domains</option>
            {CATEGORIES.filter((cat) => cat !== "All").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="blog-select-chevron" aria-hidden="true" />
        </div>

        {/* Status Filter */}
        <div className="blog-filter-select-wrapper">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="blog-filter-select"
            aria-label="Filter by publication status"
          >
            <option value="all">Status: All</option>
            <option value="published">● Published Only</option>
            <option value="draft">● Drafts Only</option>
          </select>
          <ChevronDown size={14} className="blog-select-chevron" aria-hidden="true" />
        </div>

        {/* Featured Filter */}
        <div className="blog-filter-select-wrapper">
          <select
            value={selectedFeatured}
            onChange={(e) => {
              setSelectedFeatured(e.target.value);
              setCurrentPage(1);
            }}
            className="blog-filter-select"
            aria-label="Filter by featured status"
          >
            <option value="all">Featured: All</option>
            <option value="featured">★ Featured Only</option>
            <option value="standard">Standard Only</option>
          </select>
          <ChevronDown size={14} className="blog-select-chevron" aria-hidden="true" />
        </div>

        {/* Sort Options */}
        <div className="blog-filter-select-wrapper">
          <select
            value={selectedSort}
            onChange={(e) => {
              setSelectedSort(e.target.value);
              setCurrentPage(1);
            }}
            className="blog-filter-select"
            aria-label="Sort articles"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="views">Sort: Most Views</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
          <ChevronDown size={14} className="blog-select-chevron" aria-hidden="true" />
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-blog-reset-filter"
            title="Reset all search queries and dropdown filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ============================================================
          4. BLOG DATA TABLE & SKELETON LOADERS
          ============================================================ */}
      <div className="blog-table-card">
        <div className="blog-table-responsive">
          <table className="blog-data-table">
            <thead>
              <tr>
                <th className="col-thumbnail">Thumbnail</th>
                <th className="col-article">Article Title</th>
                <th className="col-category">Category</th>
                <th className="col-status">Status</th>
                <th className="col-featured">Featured</th>
                <th className="col-views">Views</th>
                <th className="col-created">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Multi-Column Skeleton Loading State */}
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="blog-skeleton-row">
                    <td className="col-thumbnail">
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "72px", height: "48px", borderRadius: "8px" }}
                      />
                    </td>
                    <td className="col-article">
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "80%", height: "16px", marginBottom: "8px" }}
                      />
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "40%", height: "12px" }}
                      />
                    </td>
                    <td className="col-category">
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "85px", height: "24px", borderRadius: "6px" }}
                      />
                    </td>
                    <td className="col-status">
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "90px", height: "24px", borderRadius: "20px" }}
                      />
                    </td>
                    <td className="col-featured" style={{ textAlign: "center" }}>
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "24px", height: "24px", borderRadius: "50%", margin: "0 auto" }}
                      />
                    </td>
                    <td className="col-views">
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "55px", height: "18px" }}
                      />
                    </td>
                    <td className="col-created">
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "80px", height: "16px" }}
                      />
                    </td>
                    <td className="col-actions">
                      <div
                        className="blog-skeleton-cell"
                        style={{ width: "80px", height: "30px", marginLeft: "auto", borderRadius: "6px" }}
                      />
                    </td>
                  </tr>
                ))
              ) : blogs.length === 0 ? (
                /* Contained Empty State inside table */
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div className="blog-empty-container">
                      <div className="blog-empty-icon-wrap">
                        <BookOpen size={30} />
                      </div>
                      <h3 className="blog-empty-title">No Blog Articles Found</h3>
                      <p className="blog-empty-desc">
                        {hasActiveFilters
                          ? "No articles matched your active search query or filter options. Try adjusting or clearing your filters."
                          : "You have not created any blog posts yet. Start publishing inspiring stories, technical blogs, and community announcements."}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="btn-blog-reset-filter"
                        >
                          <RotateCcw size={14} />
                          <span>Clear All Filters</span>
                        </button>
                      ) : (
                        <Link to="/admin/blogs/create" className="btn-blog-create-primary">
                          <Plus size={16} />
                          <span>Create First Article</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => {
                  const catStyle = getCategoryStyle(blog.category);
                  const isShaking = shakingId === blog._id;
                  const thumbnailSrc = getImageUrl(blog.bannerImage);
                  const isPublished = blog.status === "published";
                  const authorName = blog.author?.name || blog.createdBy?.name || "Admin Editorial";
                  const authorSubtitle = blog.author?.adminLabel ? ` (${blog.author.adminLabel})` : "";

                  return (
                    <motion.tr
                      key={blog._id}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        x: isShaking ? [-6, 6, -6, 6, 0] : 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={deletingId === blog._id ? "deleting-row" : ""}
                    >
                      {/* Column 1: Thumbnail (72x48) */}
                      <td className="col-thumbnail">
                        <div className="blog-thumb-box">
                          <img
                            src={thumbnailSrc}
                            alt={blog.title}
                            className="blog-thumb-img"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300&auto=format&fit=crop";
                            }}
                          />
                        </div>
                      </td>

                      {/* Column 2: Article Title & Author */}
                      <td className="col-article">
                        <Link
                          to={`/blog/${blog.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="blog-title-link"
                          title={blog.title}
                        >
                          {blog.title}
                        </Link>
                        <div className="blog-author-meta">
                          By {authorName}
                          {authorSubtitle}
                          {blog.readingTime ? ` • ${blog.readingTime} min read` : ""}
                        </div>
                      </td>

                      {/* Column 3: Category Pill */}
                      <td className="col-category">
                        <span
                          className="blog-category-badge"
                          style={{
                            backgroundColor: catStyle.bg,
                            color: catStyle.color,
                            borderColor: catStyle.border,
                          }}
                        >
                          {blog.category}
                        </span>
                      </td>

                      {/* Column 4: Dot Status Pill */}
                      <td className="col-status">
                        <span
                          className={`blog-status-pill ${
                            isPublished ? "blog-status-published" : "blog-status-draft"
                          }`}
                        >
                          ● {blog.status ? blog.status.toUpperCase() : "DRAFT"}
                        </span>
                      </td>

                      {/* Column 5: Featured Clickable Star */}
                      <td className="col-featured" style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(blog._id)}
                          className="blog-star-btn"
                          title={
                            blog.isFeatured
                              ? "Click to remove from homepage spotlight"
                              : "Click to feature on homepage spotlight"
                          }
                          aria-label={blog.isFeatured ? "Unfeature article" : "Feature article"}
                        >
                          <Star
                            size={19}
                            fill={blog.isFeatured ? "#F59E0B" : "none"}
                            color={blog.isFeatured ? "#F59E0B" : "#94a3b8"}
                          />
                        </button>
                      </td>

                      {/* Column 6: View Analytics */}
                      <td className="col-views">
                        <div className="blog-views-item" title={`${blog.views || 0} total views`}>
                          <Eye size={15} />
                          <span>{(blog.views || 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Column 7: Created Date */}
                      <td className="col-created">
                        <span className="blog-date-text">{formatDate(blog.createdAt)}</span>
                      </td>

                      {/* Column 8: Action Buttons (Edit & Delete) */}
                      <td className="col-actions">
                        <div className="blog-row-actions">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/blogs/edit/${blog._id}`)}
                            className="btn-blog-action-edit"
                            title="Edit Article Content & Metadata"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(blog)}
                            className="btn-blog-action-delete"
                            title="Delete Article"
                            aria-label="Delete Article"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================
            5. PAGINATION BAR
            ============================================================ */}
        {!loading && pagination.total > 0 && (
          <div className="blog-pagination-bar">
            <div className="blog-pagination-info">
              Showing{" "}
              <strong>
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              of <strong>{pagination.total}</strong> articles
            </div>

            <div className="blog-pagination-controls">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={pagination.page <= 1}
                className="btn-page-nav"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`btn-page-num ${pagination.page === pageNum ? "active" : ""}`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={pagination.page === pageNum ? "page" : undefined}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
                disabled={pagination.page >= pagination.pages}
                className="btn-page-nav"
                aria-label="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          DELETE CONFIRMATION MODAL
          ============================================================ */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => !deletingId && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="modal-card modal-delete"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon-header danger">
                <AlertCircle size={40} />
              </div>
              <h3 className="modal-title">Delete Article Permanently?</h3>
              <p className="modal-text">
                Are you sure you want to permanently delete{" "}
                <strong>"{deleteTarget.title}"</strong>? This will immediately remove the article
                from the database, blog search indices, and the public community feed.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn btn-secondary"
                  disabled={Boolean(deletingId)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteExecute}
                  className="btn btn-danger"
                  disabled={Boolean(deletingId)}
                >
                  {deletingId ? "Deleting..." : "Yes, Delete Article"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogList;
