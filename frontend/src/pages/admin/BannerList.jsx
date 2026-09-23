import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MousePointer,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Calendar,
  Sparkles,
  Info,
  Search,
  Copy,
  TrendingUp,
  Award,
  Layers,
  Zap,
} from "lucide-react";
import API from "../../api/axios";
import { getImageUrl } from "../../utils/getImageUrl";

const BannerList = () => {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'scheduled', 'inactive'

  // Reorder dragging state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [reordering, setReordering] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBanners = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/admin/banners");
      setBanners(response.data.banners || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to load hero banner records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Calculate Analytics Metrics
  const metrics = useMemo(() => {
    const totalCount = banners.length;
    const activeCount = banners.filter((b) => b.isActive).length;
    const totalImpressions = banners.reduce((acc, b) => acc + (b.impressionCount || 0), 0);
    const totalClicks = banners.reduce((acc, b) => acc + (b.clickCount || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

    const topBanner = [...banners].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];

    return {
      totalCount,
      activeCount,
      totalImpressions,
      totalClicks,
      ctr,
      topBannerTitle: topBanner?.clickCount > 0 ? topBanner.title : "None yet",
    };
  }, [banners]);

  // Save updated order to backend
  const persistReorder = async (updatedList) => {
    setReordering(true);
    try {
      const payload = updatedList.map((b, idx) => ({
        id: b._id,
        displayOrder: idx + 1,
      }));

      const response = await API.patch("/admin/banners/reorder", { banners: payload });
      if (response.data.banners) {
        setBanners(response.data.banners);
      }
      setSuccess("Carousel order updated & saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Reorder failed:", err);
      setError("Failed to persist banner order.");
    } finally {
      setReordering(false);
    }
  };

  // Move banner item up or down
  const moveItem = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const updated = [...banners];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);

    setBanners(updated);
    persistReorder(updated);
  };

  // Move banner to Top (#1 Priority)
  const moveToTop = (index) => {
    if (index === 0) return;

    const updated = [...banners];
    const [moved] = updated.splice(index, 1);
    updated.unshift(moved);

    setBanners(updated);
    persistReorder(updated);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const updated = [...banners];
    const [draggedItem] = updated.splice(draggedIdx, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIdx(index);
    setBanners(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    persistReorder(banners);
  };

  // Toggle Active Status
  const handleToggleActive = async (id) => {
    try {
      const response = await API.patch(`/admin/banners/${id}/toggle`);
      const updated = response.data.banner;

      setBanners((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isActive: updated.isActive } : b))
      );

      setSuccess(
        `Banner "${updated.title}" ${updated.isActive ? "activated" : "deactivated"}!`
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle banner status.");
    }
  };

  // Duplicate Banner
  const handleDuplicate = async (banner) => {
    try {
      const data = new FormData();
      data.append("title", `${banner.title} (Copy)`);
      data.append("subtitle", banner.subtitle || "");
      data.append("description", banner.description);
      data.append("ctaText", banner.ctaText || "Explore Advisories");
      data.append("ctaLink", banner.ctaLink || "/#articles-section");
      data.append("isActive", true);
      data.append("displayOrder", 1);
      data.append("bannerImageUrl", banner.bannerImage);

      const response = await API.post("/admin/banners", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.banner) {
        setBanners((prev) => [response.data.banner, ...prev]);
        setSuccess(`Banner "${banner.title}" duplicated successfully!`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Failed to duplicate banner.");
    }
  };

  // Execute Delete
  const handleDeleteExecute = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget._id);
    setError("");

    try {
      await API.delete(`/admin/banners/${deleteTarget._id}`);
      setBanners((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setSuccess("Hero banner deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete hero banner.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered List Computation
  const filteredBanners = useMemo(() => {
    const now = new Date();

    return banners.filter((banner) => {
      // Search Query Filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        banner.title.toLowerCase().includes(query) ||
        (banner.subtitle && banner.subtitle.toLowerCase().includes(query)) ||
        banner.description.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Status Tab Filter
      if (activeTab === "active") return banner.isActive;
      if (activeTab === "inactive") return !banner.isActive;
      if (activeTab === "scheduled") return Boolean(banner.startDate || banner.endDate);

      return true;
    });
  }, [banners, searchQuery, activeTab]);

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">⚡ Interactive Hero Carousel Studio</h1>
          <p className="page-subtitle">
            Manage live slide sequences, time-based scheduling, real-time analytics, and instant reordering.
          </p>
        </div>
        <div className="flex-items-center gap-3">
          <button onClick={fetchBanners} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={15} className={loading ? "spinner-icon" : ""} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/banners/create" className="btn btn-primary btn-add-blog">
            <Plus size={18} />
            <span>Create New Banner</span>
          </Link>
        </div>
      </div>

      {/* DYNAMIC ANALYTICS SUMMARY CARDS */}
      <div className="banner-analytics-grid mb-4">
        <div className="analytics-stat-card">
          <div className="stat-card-header flex-between">
            <span className="stat-title">Total Active Banners</span>
            <div className="stat-icon-wrapper red">
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-number">{metrics.activeCount} <span className="text-xs text-muted">/ {metrics.totalCount} total</span></div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-card-header flex-between">
            <span className="stat-title">Slide Impressions</span>
            <div className="stat-icon-wrapper blue">
              <Eye size={18} />
            </div>
          </div>
          <div className="stat-number">{metrics.totalImpressions.toLocaleString()}</div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-card-header flex-between">
            <span className="stat-title">CTA Button Clicks</span>
            <div className="stat-icon-wrapper amber">
              <MousePointer size={18} />
            </div>
          </div>
          <div className="stat-number">{metrics.totalClicks.toLocaleString()}</div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-card-header flex-between">
            <span className="stat-title">Click-Through Rate (CTR)</span>
            <div className="stat-icon-wrapper green">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-number">{metrics.ctr}%</div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Empty State Banner Note */}
      {!loading && metrics.activeCount === 0 && (
        <div className="banner-empty-note">
          <Info size={20} className="info-icon" />
          <span>
            <strong>No active custom banners:</strong> Visitors are currently seeing the default GradConnect alumni portal hero banner. Activate or add a banner to customize the Home page carousel.
          </span>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="table-controls-bar flex-between mb-3">
        {/* Status Filter Tabs */}
        <div className="filter-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          >
            All Banners ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
          >
            Active ({banners.filter((b) => b.isActive).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scheduled")}
            className={`tab-btn ${activeTab === "scheduled" ? "active" : ""}`}
          >
            Scheduled ({banners.filter((b) => b.startDate || b.endDate).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inactive")}
            className={`tab-btn ${activeTab === "inactive" ? "active" : ""}`}
          >
            Inactive ({banners.filter((b) => !b.isActive).length})
          </button>
        </div>

        {/* Live Search Input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search banners by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="table-search-input"
          />
        </div>
      </div>

      {/* Banners List Card */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading">Loading hero banners...</div>
        ) : filteredBanners.length === 0 ? (
          <div className="table-empty-container">
            <ImageIcon size={44} className="empty-icon" />
            <h3>No Banners Found</h3>
            <p>No hero banners matched your filter or search query.</p>
            <Link to="/admin/banners/create" className="btn btn-primary btn-sm mt-3">
              + Create New Hero Banner
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="user-table blog-admin-table">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Sequence</th>
                  <th>Preview</th>
                  <th>Title &amp; Subtitle</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Analytics (Impressions / Clicks)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredBanners.map((banner, index) => {
                    const originalIndex = banners.findIndex((b) => b._id === banner._id);
                    const imageSrc = getImageUrl(banner.bannerImage);
                    const isFirst = originalIndex === 0;
                    const isLast = originalIndex === banners.length - 1;

                    return (
                      <motion.tr
                        key={banner._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, originalIndex)}
                        onDragOver={(e) => handleDragOver(e, originalIndex)}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.25 }}
                        className={`draggable-banner-row ${
                          draggedIdx === originalIndex ? "is-dragging" : ""
                        } ${deletingId === banner._id ? "deleting-row" : ""}`}
                      >
                        {/* Drag Handle & Order Controls */}
                        <td className="reorder-cell">
                          <div className="flex-items-center gap-1">
                            <span className="drag-handle-icon" title="Drag to reorder">
                              <GripVertical size={16} />
                            </span>
                            <div className="order-arrow-buttons">
                              <button
                                type="button"
                                onClick={() => moveItem(originalIndex, "up")}
                                disabled={isFirst || reordering}
                                className="arrow-btn"
                                title="Move Up"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveItem(originalIndex, "down")}
                                disabled={isLast || reordering}
                                className="arrow-btn"
                                title="Move Down"
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>
                            <span className="order-number-badge">#{originalIndex + 1}</span>
                          </div>
                        </td>

                        {/* Image Thumbnail */}
                        <td className="thumbnail-cell">
                          <img
                            src={imageSrc}
                            alt={banner.title}
                            className="admin-banner-thumbnail"
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=200&auto=format&fit=crop";
                            }}
                          />
                        </td>

                        {/* Title & Subtitle */}
                        <td className="blog-title-cell">
                          <div className="admin-blog-title-link">{banner.title}</div>
                          {banner.subtitle && (
                            <div className="admin-author-sub text-amber font-semibold">
                              {banner.subtitle}
                            </div>
                          )}
                          <div className="banner-desc-snippet">{banner.description}</div>
                        </td>

                        {/* Schedule Window */}
                        <td className="schedule-cell">
                          {banner.startDate || banner.endDate ? (
                            <div className="schedule-pill">
                              <Calendar size={13} />
                              <span>
                                {banner.startDate ? formatDate(banner.startDate) : "Start"} →{" "}
                                {banner.endDate ? formatDate(banner.endDate) : "Indefinite"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted text-xs font-medium">Always Active</span>
                          )}
                        </td>

                        {/* Status Toggle Badge */}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(banner._id)}
                            className={`status-toggle-btn ${
                              banner.isActive ? "status-published" : "status-draft"
                            }`}
                            title="Click to toggle active status"
                          >
                            {banner.isActive ? "● Active" : "○ Inactive"}
                          </button>
                        </td>

                        {/* Analytics Badges */}
                        <td className="views-cell">
                          <div className="analytics-pill-group">
                            <span className="views-pill" title="Total Slide Impressions">
                              <Eye size={14} />
                              <span>{banner.impressionCount || 0}</span>
                            </span>
                            <span className="unique-pill" title="CTA Button Clicks">
                              <MousePointer size={13} />
                              <span>{banner.clickCount || 0} clicks</span>
                            </span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="actions-cell">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => moveToTop(originalIndex)}
                            disabled={isFirst}
                            className="action-btn action-top"
                            title="Move to Top (#1 Priority)"
                          >
                            <Zap size={13} />
                            <span>Top</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleDuplicate(banner)}
                            className="action-btn action-duplicate"
                            title="Duplicate Banner"
                          >
                            <Copy size={13} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => navigate(`/admin/banners/edit/${banner._id}`)}
                            className="action-btn action-edit"
                            title="Edit Banner"
                          >
                            <Edit size={14} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setDeleteTarget(banner)}
                            className="action-btn action-delete"
                            title="Delete Banner"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="modal-card modal-delete"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon-header danger">
                <AlertCircle size={42} />
              </div>
              <h3 className="modal-title">Delete Hero Banner?</h3>
              <p className="modal-text">
                Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This will permanently remove it from the Home page hero rotation.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn btn-secondary"
                  disabled={deletingId}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteExecute}
                  className="btn btn-danger"
                  disabled={deletingId}
                >
                  {deletingId ? "Deleting..." : "Yes, Delete Banner"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BannerList;
