import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Save,
  Eye,
  Type,
  FileText,
  Tag,
  Star,
  PenTool,
  Send,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
  Code,
  User,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { CATEGORIES } from "../../utils/categoryColors";
import { getImageUrl } from "../../utils/getImageUrl";

const GRADCONNECT_CATEGORIES = [
  "Career Journey",
  "Interview Preparation",
  "Internship",
  "Placement Journey",
  "Career Advice",
  "Technical Article",
  "Guide & Tutorial",
  "Project Experience",
  "Architecture & System",
  "Job Opportunity",
  "Alumni Achievement",
  "Mentorship",
  "Industry Insights",
  "Workplace Experience",
  "Announcement",
];

const BlogForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    content: "",
    category: "Career Journey",
    visibility: "Public",
    status: "published",
    isFeatured: false,
    bannerImageUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("write"); // 'write' | 'preview'

  // Fetch initial blog details if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchBlogForEdit = async () => {
      setFetching(true);
      setError("");

      try {
        let targetBlog = null;

        // Try direct fetch by ID first
        try {
          const res = await API.get(`/blogs/id/${id}`);
          if (res.data?.blog) {
            targetBlog = res.data.blog;
          }
        } catch {
          // Fallback to admin blog list
          const response = await API.get("/admin/blogs?limit=100");
          const allBlogs = response.data?.blogs || [];
          targetBlog = allBlogs.find((b) => b._id === id);
        }

        if (!targetBlog) {
          setError("Blog article not found for editing");
          return;
        }

        setFormData({
          title: targetBlog.title || "",
          shortDescription: targetBlog.shortDescription || "",
          content: targetBlog.content || "",
          category: targetBlog.category || "Career Journey",
          visibility: targetBlog.visibility || "Public",
          status: targetBlog.status || "published",
          isFeatured: targetBlog.isFeatured || false,
          bannerImageUrl: targetBlog.bannerImage?.startsWith("http") ? targetBlog.bannerImage : "",
        });

        if (targetBlog.bannerImage) {
          setImagePreview(getImageUrl(targetBlog.bannerImage));
        }
      } catch (err) {
        console.error("Fetch blog for edit error:", err);
        setError("Failed to fetch blog details");
      } finally {
        setFetching(false);
      }
    };

    fetchBlogForEdit();
  }, [id, isEditMode]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  // Helper to insert markdown formatting into content textarea
  const insertFormat = (prefix, suffix = "") => {
    const textarea = document.getElementById("admin-content-textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = formData.content;
    const selected = currentVal.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const newContent = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setFormData((prev) => ({ ...prev, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
      );
    }, 50);
  };

  // Format markdown or HTML content safely for preview
  const formatPreviewHtml = (raw) => {
    if (!raw || !raw.trim()) {
      return "<p style='color: #94a3b8; font-style: italic;'>No content written yet...</p>";
    }
    // If raw contains basic HTML tags, render directly
    if (/<[a-z][\s\S]*>/i.test(raw)) {
      return raw;
    }
    // Otherwise convert basic markdown syntax
    const formatted = raw
      .replace(/^### (.*$)/gim, "<h3 style='margin: 16px 0 8px 0; font-size: 1.15rem; font-weight: 700; color: #1e293b;'>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2 style='margin: 20px 0 10px 0; font-size: 1.35rem; font-weight: 700; color: #0f172a;'>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1 style='margin: 24px 0 12px 0; font-size: 1.6rem; font-weight: 800; color: #0f172a;'>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/^> (.*$)/gim, "<blockquote style='border-left: 4px solid #cbd5e1; padding-left: 12px; margin: 12px 0; color: #64748b; font-style: italic;'>$1</blockquote>")
      .replace(/```([\s\S]*?)```/gim, "<pre style='background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 0.875rem;'><code>$1</code></pre>")
      .replace(/^- (.*$)/gim, "<li style='margin-left: 20px; list-style-type: disc;'>$1</li>")
      .replace(/\n\n+/g, "</p><p style='margin: 10px 0; line-height: 1.7;'>")
      .replace(/\n/g, "<br/>");
    return `<p style='margin: 10px 0; line-height: 1.7;'>${formatted}</p>`;
  };

  // Handle Image File Selection with Instant Preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size exceeds maximum limit of 5MB.");
      return;
    }

    // Validate extension
    const validExtensions = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validExtensions.includes(file.mimetype) && !validExtensions.includes(file.type)) {
      setError("Invalid image format. Please select a .jpg, .png, or .webp image.");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Instant local image preview using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle URL Preview fallback
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, bannerImageUrl: url }));
    if (!selectedFile && url.trim()) {
      setImagePreview(getImageUrl(url.trim()));
    }
  };

  // Form Submission Handler with target status (published or draft)
  const handleSubmitWithStatus = async (targetStatus) => {
    if (!formData.title.trim()) {
      setError("Please provide a blog title.");
      return;
    }

    if (targetStatus === "published") {
      if (!formData.shortDescription.trim()) {
        setError("Please provide a short summary description before publishing.");
        return;
      }

      if (!formData.content.trim()) {
        setError("Please write article content before publishing.");
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Build FormData payload for multipart upload
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("shortDescription", formData.shortDescription.trim());
      data.append("content", formData.content.trim());
      data.append("category", formData.category);
      data.append("status", targetStatus);
      data.append("visibility", formData.visibility);
      data.append("isFeatured", formData.isFeatured);

      if (selectedFile) {
        data.append("bannerImage", selectedFile);
      } else if (formData.bannerImageUrl.trim()) {
        data.append("bannerImageUrl", formData.bannerImageUrl.trim());
      }

      if (isEditMode) {
        await API.put(`/admin/blogs/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess(
          targetStatus === "draft"
            ? "Draft saved successfully!"
            : "Blog article updated successfully!"
        );
      } else {
        await API.post("/admin/blogs", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess(
          targetStatus === "draft"
            ? "Draft saved successfully!"
            : "Blog article published successfully!"
        );
      }

      setTimeout(() => {
        navigate("/admin/blogs");
      }, 1200);
    } catch (err) {
      console.error("Submit Blog Error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to save article. Please verify inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmitWithStatus(formData.status || "published");
  };

  const charCount = formData.shortDescription.length;

  if (fetching) {
    return (
      <div className="admin-page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div className="table-loading" style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
          Loading article details...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.75rem 1.5rem" }}>
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PenTool size={22} style={{ color: "#dc2626" }} />
          </div>
          <div>
            <h1
              className="page-title"
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 4px 0",
                letterSpacing: "-0.02em",
              }}
            >
              {isEditMode ? "Edit Blog Article" : "Create New Blog"}
            </h1>
            <p
              className="page-subtitle"
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Share career experiences, interview journeys, workplace insights, technical knowledge, and advice with the GradConnect community.
            </p>
          </div>
        </div>

        <Link
          to="/admin/blogs"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#334155",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#94a3b8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
        >
          <ArrowLeft size={16} />
          <span>← Back to Articles</span>
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            color: "#b91c1c",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            marginBottom: "1.5rem",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            color: "#15803d",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Two-Column Form */}
      <form onSubmit={handleFormSubmit} className="blog-form-grid">
        {/* Left Column: Main Editorial Content */}
        <div className="form-main-col">
          {/* Article Title */}
          <div className="form-group">
            <label className="form-label required">
              <Type size={16} />
              <span>Blog Title</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. My Journey From College to My First Software Engineering Job"
              className="form-input text-lg font-semibold"
              style={{
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "1rem",
                fontWeight: 600,
              }}
              required
            />
          </div>

          {/* Short Summary Description */}
          <div className="form-group">
            <div className="flex-between mb-1">
              <label className="form-label required">
                <FileText size={16} />
                <span>Short Summary</span>
              </label>
              <span className={`char-counter ${charCount > 200 ? "over-limit" : ""}`}>
                {charCount} / 200 characters
              </span>
            </div>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Briefly describe your experience or article in 1–2 sentences..."
              rows={3}
              className="form-input form-textarea"
              maxLength={250}
              style={{ borderRadius: "10px", padding: "12px" }}
              required
            />
          </div>

          {/* Article Content with Markdown Toolbar + Write/Preview Tabs */}
          <div className="form-group">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <label className="form-label required" style={{ margin: 0 }}>
                <span>Article Content</span>
              </label>

              <div className="tab-switch-group">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`tab-switch-btn ${activeTab === "write" ? "active" : ""}`}
                >
                  Write Content
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`tab-switch-btn ${activeTab === "preview" ? "active" : ""}`}
                >
                  <Eye size={14} />
                  <span>Live Preview</span>
                </button>
              </div>
            </div>

            {/* Formatting Toolbar (Active when writing) */}
            {activeTab === "write" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 8px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderBottom: "none",
                  borderTopLeftRadius: "10px",
                  borderTopRightRadius: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => insertFormat("**", "**")}
                  title="Bold"
                  style={{
                    padding: "5px 7px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("*", "*")}
                  title="Italic"
                  style={{
                    padding: "5px 7px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <Italic size={15} />
                </button>
                <span style={{ width: "1px", height: "18px", background: "#cbd5e1", margin: "0 4px" }} />
                <button
                  type="button"
                  onClick={() => insertFormat("## ", "")}
                  title="Heading 2"
                  style={{
                    padding: "5px 7px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <Heading2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("### ", "")}
                  title="Heading 3"
                  style={{
                    padding: "5px 7px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <Heading3 size={15} />
                </button>
                <span style={{ width: "1px", height: "18px", background: "#cbd5e1", margin: "0 4px" }} />
                <button
                  type="button"
                  onClick={() => insertFormat("- ", "")}
                  title="Bullet List"
                  style={{
                    padding: "5px 7px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("> ", "")}
                  title="Quote"
                  style={{
                    padding: "5px 7px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <Quote size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("```\n", "\n```")}
                  title="Code Block"
                  style={{
                    padding: "5px 7px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  <Code size={15} />
                </button>
              </div>
            )}

            {activeTab === "write" ? (
              <textarea
                id="admin-content-textarea"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Share your experience, knowledge, lessons learned, interview journey, workplace experience, or technical insights..."
                rows={16}
                className="form-input form-textarea content-textarea"
                style={{
                  borderTopLeftRadius: "0",
                  borderTopRightRadius: "0",
                  borderBottomLeftRadius: "10px",
                  borderBottomRightRadius: "10px",
                  borderColor: "#cbd5e1",
                  padding: "14px",
                  fontFamily: "inherit",
                  fontSize: "0.925rem",
                  lineHeight: 1.6,
                }}
                required
              />
            ) : (
              <div
                className="article-preview-box"
                style={{
                  minHeight: "360px",
                  padding: "20px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                }}
              >
                <div
                  className="formatted-content"
                  dangerouslySetInnerHTML={{
                    __html: formatPreviewHtml(formData.content),
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar (Cover Image, Publishing, Actions) */}
        <div className="form-sidebar-col">
          {/* Cover Image Card */}
          <div className="form-card" style={{ borderRadius: "12px" }}>
            <h3 className="form-card-title flex-items-center gap-2" style={{ margin: "0 0 6px 0" }}>
              <ImageIcon size={18} style={{ color: "#dc2626" }} />
              <span>Cover Image</span>
            </h3>
            <p
              style={{
                fontSize: "0.775rem",
                color: "#64748b",
                margin: "0 0 14px 0",
              }}
            >
              Upload an image that represents your article.
            </p>

            {/* Image Preview Box */}
            <div className="image-preview-container" style={{ borderRadius: "10px", height: "160px" }}>
              {imagePreview ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="preview-image-wrapper"
                >
                  <img
                    src={imagePreview}
                    alt="Cover Preview"
                    className="preview-img"
                    onError={() => setError("Unable to load preview image URL")}
                  />
                  <div className="preview-overlay">
                    <span className="preview-label">Image Ready</span>
                  </div>
                </motion.div>
              ) : (
                <div className="image-placeholder-box">
                  <Upload size={30} className="upload-placeholder-icon" style={{ color: "#94a3b8" }} />
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                    Select image file or paste URL
                  </p>
                </div>
              )}
            </div>

            {/* File Upload Input */}
            <div className="form-group mt-3" style={{ marginBottom: "10px" }}>
              <label className="upload-file-btn" style={{ borderRadius: "8px" }}>
                <Upload size={16} />
                <span>Upload Local File (.jpg, .png, .webp)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
              </label>
            </div>

            {/* Image URL fallback */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-sublabel">OR Paste Image Web URL:</label>
              <input
                type="url"
                name="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={handleUrlChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="form-input text-xs"
                style={{ borderRadius: "8px" }}
              />
            </div>
          </div>

          {/* Publishing & Visibility Settings Card */}
          <div className="form-card" style={{ borderRadius: "12px" }}>
            <h3 className="form-card-title flex-items-center gap-2">
              <Tag size={18} style={{ color: "#dc2626" }} />
              <span>Publishing &amp; Visibility</span>
            </h3>

            {/* Category Select */}
            <div className="form-group">
              <label className="form-label required">Blog Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
                style={{ borderRadius: "8px", fontWeight: 600 }}
              >
                {GRADCONNECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Author Attribution (Auto-populated from logged-in admin) */}
            <div className="form-group">
              <label className="form-label">
                <User size={15} />
                <span>Author</span>
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#fee2e2",
                    color: "#dc2626",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#1e293b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user?.name || "Super Administrator"}
                  </div>
                  <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                    {user?.adminLabel || "Super Administrator"}
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility Select */}
            <div className="form-group">
              <label className="form-label">
                <Globe size={15} />
                <span>Audience Visibility</span>
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="form-select"
                style={{ borderRadius: "8px" }}
              >
                <option value="Public">Public (Visible to everyone)</option>
                <option value="Members">GradConnect Members (Students & Alumni)</option>
              </select>
            </div>

            {/* Publication Status Select */}
            <div className="form-group">
              <label className="form-label required">Publication Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
                style={{ borderRadius: "8px" }}
              >
                <option value="published">Published (Live on GradConnect)</option>
                <option value="draft">Draft (Admin Only)</option>
              </select>
            </div>

            {/* Featured Checkbox */}
            <div className="form-group checkbox-group" style={{ marginBottom: "18px" }}>
              <label className="checkbox-label" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <Star
                  size={16}
                  fill={formData.isFeatured ? "#F59E0B" : "none"}
                  color={formData.isFeatured ? "#F59E0B" : "#64748b"}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Mark as Featured Article
                </span>
              </label>
            </div>

            {/* Dual Action Buttons: Save Draft & Publish */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "1.25rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              {/* Primary Action Button: Publish / Update */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmitWithStatus("published")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  height: "44px",
                  borderRadius: "10px",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.15s ease",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#b91c1c";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#dc2626";
                }}
              >
                {loading ? (
                  <span>Saving Article...</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{isEditMode ? "Update Blog Article" : "Publish Blog"}</span>
                  </>
                )}
              </button>

              {/* Secondary Action Button: Save Draft */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmitWithStatus("draft")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  border: "1px solid #cbd5e1",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#94a3b8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }
                }}
              >
                <Save size={15} />
                <span>Save Draft</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;
