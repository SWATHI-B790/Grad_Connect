import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Save,
  Eye,
  GraduationCap,
  ArrowRight,
  Calendar,
  Sparkles,
  Type,
  FileText,
  Link2,
  Clock,
  Monitor,
  Tablet,
  Smartphone,
  Check,
} from "lucide-react";
import API from "../../api/axios";
import { getImageUrl } from "../../utils/getImageUrl";

const CTA_PRESETS = [
  "Create Free Account",
  "Discover Alumni",
  "Explore Community Feed",
  "View Mentorship Programs",
  "Member Login",
];

const BannerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Device Preview Switcher: 'desktop', 'tablet', 'mobile'
  const [deviceView, setDeviceView] = useState("desktop");

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    ctaText: "Discover Alumni",
    ctaLink: "/people",
    isActive: true,
    displayOrder: 1,
    bannerImageUrl: "",
    startDate: "",
    endDate: "",
  });

  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch banner for editing
  useEffect(() => {
    if (!isEditMode) return;

    const fetchBannerForEdit = async () => {
      setFetching(true);
      setError("");

      try {
        const response = await API.get("/admin/banners");
        const allBanners = response.data.banners || [];
        const target = allBanners.find((b) => b._id === id);

        if (!target) {
          setError("Hero banner not found for editing");
          return;
        }

        const startStr = target.startDate
          ? new Date(target.startDate).toISOString().slice(0, 16)
          : "";
        const endStr = target.endDate
          ? new Date(target.endDate).toISOString().slice(0, 16)
          : "";

        setFormData({
          title: target.title || "",
          subtitle: target.subtitle || "",
          description: target.description || "",
          ctaText: target.ctaText || "Discover Alumni",
          ctaLink: target.ctaLink || "/people",

          isActive: target.isActive !== undefined ? target.isActive : true,
          displayOrder: target.displayOrder || 1,
          bannerImageUrl: target.bannerImage || "",
          startDate: startStr,
          endDate: endStr,
        });

        if (target.startDate || target.endDate) {
          setIsScheduled(true);
        }

        if (target.bannerImage) {
          setImagePreview(getImageUrl(target.bannerImage));
        }
      } catch (err) {
        setError("Failed to fetch banner details for editing");
      } finally {
        setFetching(false);
      }
    };

    fetchBannerForEdit();
  }, [id, isEditMode]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle File Upload Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size exceeds maximum limit of 5MB.");
      return;
    }

    setError("");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Image Web URL change
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, bannerImageUrl: url }));
    if (!selectedFile && url.trim()) {
      setImagePreview(getImageUrl(url.trim()));
    }
  };

  // Select CTA Preset
  const applyCtaPreset = (preset) => {
    setFormData((prev) => ({ ...prev, ctaText: preset }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Please enter a headline title for the banner.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter a description for the banner.");
      return;
    }

    if (!selectedFile && !imagePreview && !formData.bannerImageUrl.trim()) {
      setError("Please upload a banner background image or provide a valid image URL.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("subtitle", formData.subtitle.trim());
      data.append("description", formData.description.trim());
      data.append("ctaText", formData.ctaText.trim());
      data.append("ctaLink", formData.ctaLink.trim());
      data.append("isActive", formData.isActive);
      data.append("displayOrder", formData.displayOrder);

      if (isScheduled) {
        if (formData.startDate) data.append("startDate", formData.startDate);
        if (formData.endDate) data.append("endDate", formData.endDate);
      } else {
        data.append("startDate", "");
        data.append("endDate", "");
      }

      if (selectedFile) {
        data.append("bannerImage", selectedFile);
      } else if (formData.bannerImageUrl.trim()) {
        data.append("bannerImageUrl", formData.bannerImageUrl.trim());
      }

      if (isEditMode) {
        await API.put(`/admin/banners/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Hero banner updated successfully!");
      } else {
        await API.post("/admin/banners", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Hero banner created successfully!");
      }

      setTimeout(() => {
        navigate("/admin/banners");
      }, 1200);
    } catch (err) {
      console.error("Save Banner Error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to save hero banner. Please check inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="admin-page-container">
        <div className="table-loading">Loading hero banner details...</div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">
            {isEditMode ? "✏️ Edit Hero Banner" : "✍️ Create New Hero Banner"}
          </h1>
          <p className="page-subtitle">
            Design dynamic hero slide campaigns with multi-device live preview and scheduling.
          </p>
        </div>
        <Link to="/admin/banners" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Banners</span>
        </Link>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* REAL-TIME MULTI-DEVICE LIVE PREVIEW CARD */}
      <div className="form-card mb-4 hero-live-preview-card">
        <div className="flex-between mb-3 flex-wrap gap-2">
          <div className="flex-items-center gap-2">
            <span className="live-preview-badge">
              <Eye size={15} />
              <span>LIVE RESPONSIVE PREVIEW</span>
            </span>
            <span className="text-xs text-muted font-semibold">Updates on every keystroke</span>
          </div>

          {/* Device Switcher Controls */}
          <div className="device-switcher-pill">
            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`device-btn ${deviceView === "desktop" ? "active" : ""}`}
              title="Desktop View (Full Width)"
            >
              <Monitor size={15} />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("tablet")}
              className={`device-btn ${deviceView === "tablet" ? "active" : ""}`}
              title="Tablet View (768px)"
            >
              <Tablet size={15} />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`device-btn ${deviceView === "mobile" ? "active" : ""}`}
              title="Mobile View (380px)"
            >
              <Smartphone size={15} />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Scaled Multi-Device Container */}
        <div className="mini-hero-wrapper flex-center">
          <div className={`mini-hero-preview-container device-${deviceView}`}>
            {imagePreview ? (
              <img src={imagePreview} alt="Live Preview" className="mini-hero-bg-img" />
            ) : (
              <div className="mini-hero-bg-default" />
            )}

            <div className="mini-hero-content">
              <div className="mini-hero-pill">
                <GraduationCap size={12} />
                <span>{formData.subtitle || "OFFICIAL ALUMNI NETWORK"}</span>
              </div>

              <h2 className="mini-hero-title">
                {formData.title || "Connect With Your Alumni Network"}
              </h2>

              <p className="mini-hero-desc">
                {formData.description ||
                  "Join our thriving community of graduates and students to network, find career mentorship, and share opportunities."}
              </p>

              <div className="mini-hero-actions">
                <span className="mini-cta-btn">
                  <span>{formData.ctaText || "Create Free Account"}</span>
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Grid */}
      <form onSubmit={handleSubmit} className="blog-form-grid">
        {/* Main Content Fields */}
        <div className="form-main-col">
          {/* Banner Title */}
          <div className="form-group">
            <div className="flex-between">
              <label className="form-label required">
                <Type size={16} />
                <span>Headline Title</span>
              </label>
              <span className="text-xs text-muted font-mono">{formData.title.length}/80 chars</span>
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Annual GradConnect Global Alumni Summit 2026"
              className="form-input text-lg font-semibold"
              maxLength={80}
              required
            />
          </div>

          {/* Subtitle Pill */}
          <div className="form-group">
            <label className="form-label">
              <Sparkles size={16} />
              <span>Subtitle Tagline (Badge Pill text)</span>
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="e.g. OFFICIAL ALUMNI NETWORK"
              className="form-input"
            />
          </div>

          {/* Banner Description */}
          <div className="form-group">
            <div className="flex-between">
              <label className="form-label required">
                <FileText size={16} />
                <span>Banner Summary Description</span>
              </label>
              <span className="text-xs text-muted font-mono">{formData.description.length}/250 chars</span>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write concise, engaging banner description text explaining the community initiative or event..."
              rows={4}
              maxLength={250}
              className="form-input form-textarea"
              required
            />
          </div>

          {/* CTA Presets & Link Settings */}
          <div className="form-card mb-3">
            <label className="form-label mb-2">Quick CTA Button Presets:</label>
            <div className="cta-presets-group mb-3">
              {CTA_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyCtaPreset(preset)}
                  className={`preset-btn ${formData.ctaText === preset ? "active" : ""}`}
                >
                  {formData.ctaText === preset && <Check size={12} />}
                  <span>{preset}</span>
                </button>
              ))}
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">
                  <Type size={16} />
                  <span>CTA Button Text</span>
                </label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleChange}
                  placeholder="Explore Advisories"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Link2 size={16} />
                  <span>CTA Link Destination</span>
                </label>
                <input
                  type="text"
                  name="ctaLink"
                  value={formData.ctaLink}
                  onChange={handleChange}
                  placeholder="/#articles-section"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings & Image Upload */}
        <div className="form-sidebar-col">
          {/* Background Image Upload Box */}
          <div className="form-card">
            <h3 className="form-card-title flex-items-center gap-2">
              <ImageIcon size={18} />
              <span>Background Banner Image</span>
            </h3>

            <div className="image-preview-container">
              {imagePreview ? (
                <div className="preview-image-wrapper">
                  <img src={imagePreview} alt="Preview" className="preview-img" />
                  <div className="preview-overlay">
                    <span className="preview-label">Image Selected</span>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder-box">
                  <Upload size={32} className="upload-placeholder-icon" />
                  <p>Upload high-res banner image</p>
                </div>
              )}
            </div>

            <div className="form-group mt-3">
              <label className="upload-file-btn">
                <Upload size={16} />
                <span>Upload Local Image (.jpg, .png, .webp)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
              </label>
            </div>

            <div className="form-group mt-2">
              <label className="form-sublabel">OR Paste Image Web URL:</label>
              <input
                type="url"
                name="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={handleUrlChange}
                placeholder="https://images.unsplash.com/..."
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Scheduling & Activation Options */}
          <div className="form-card mt-3">
            <h3 className="form-card-title flex-items-center gap-2">
              <Clock size={18} />
              <span>Activation &amp; Scheduling</span>
            </h3>

            {/* Active Toggle */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span>Active in Carousel Rotation</span>
              </label>
            </div>

            {/* Display Order */}
            <div className="form-group">
              <label className="form-label">Sequence Position</label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                min={1}
                className="form-input"
              />
            </div>

            {/* Scheduling Toggle */}
            <div className="form-group checkbox-group pt-2 border-top">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="form-checkbox"
                />
                <Calendar size={16} className="text-amber" />
                <span>Schedule Banner Activation Window</span>
              </label>
            </div>

            {/* Date Pickers */}
            {isScheduled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="schedule-pickers-box mt-2"
              >
                <div className="form-group">
                  <label className="form-sublabel">Start Date &amp; Time (Optional)</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group">
                  <label className="form-sublabel">End Date &amp; Time (Optional)</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="form-input text-xs"
                  />
                </div>
              </motion.div>
            )}

            {/* Save Button */}
            <div className="form-actions mt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full btn-save-article"
              >
                {loading ? (
                  <span>Saving Banner...</span>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{isEditMode ? "Update Banner" : "Publish Banner"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BannerForm;
