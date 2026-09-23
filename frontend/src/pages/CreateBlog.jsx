import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  PenTool,
  CheckCircle,
  AlertTriangle,
  Tag,
  User,
  Save,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
  Code,
  Building,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/getImageUrl";
import Footer from "../components/Footer";

const ALUMNI_CATEGORIES = [
  "Placement Journey",
  "Internship Experience",
  "Interview Preparation",
  "Career Journey",
  "Technical Article",
  "Project Experience",
  "Career Advice",
  "Industry Insights",
  "Mentorship",
  "Alumni Achievement",
  "Job Opportunity",
  "Announcement",
  "Technical Roadmap",
  "Guide & Tutorial",
  "Software Development",
];

const CreateBlog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    content: "",
    category: "Placement Journey",
    domain: "Software Development",
    experienceType: "Placement Journey",
    company: "",
    jobRole: "",
    batch: "",
    tags: "",
    bannerImageUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("write"); // 'write' | 'preview'

  // Prepopulate company, jobRole, batch from alumni profile
  useEffect(() => {
    if (user && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        company: prev.company || user.company || "",
        jobRole: prev.jobRole || user.jobTitle || "",
        batch: prev.batch || (user.graduationYear ? String(user.graduationYear) : ""),
      }));
    }
  }, [user, isEditMode]);

  // Strict role check: Alumni or Admin only
  useEffect(() => {
    if (!user) return;
    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      user.role?.toLowerCase()
    );
    const isAlumni = user.role?.toLowerCase() === "alumni" || user.userType === "Alumni";
    if (!isAdmin && !isAlumni) {
      navigate("/blogs", {
        replace: true,
        state: { error: "Only verified alumni can author experience articles." },
      });
    }
  }, [user, navigate]);

  // Load blog for editing if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchBlog = async () => {
      setFetching(true);
      setError("");
      try {
        const res = await API.get(`/blogs/id/${id}`);
        const b = res.data.blog;
        if (!b) {
          setError("Experience article not found.");
          return;
        }

        setFormData({
          title: b.title || "",
          shortDescription: b.shortDescription || "",
          content: b.content || "",
          category: b.category || "Placement Journey",
          domain: b.domain || "Software Development",
          experienceType: b.experienceType || b.category || "Placement Journey",
          company: b.company || "",
          jobRole: b.jobRole || "",
          batch: b.batch || "",
          tags: Array.isArray(b.tags) ? b.tags.join(", ") : "",
          bannerImageUrl: b.bannerImage?.startsWith("http") ? b.bannerImage : "",
        });

        if (b.bannerImage) {
          setImagePreview(getImageUrl(b.bannerImage));
        }
      } catch (err) {
        console.error("Fetch blog for edit error:", err);
        setError("Failed to load article details for editing.");
      } finally {
        setFetching(false);
      }
    };

    fetchBlog();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size exceeds 5MB limit.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    if (error) setError("");
  };

  // Helper to insert markdown formatting into content textarea
  const insertFormat = (prefix, suffix = "") => {
    const textarea = document.getElementById("content-textarea");
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

  const handleSave = async (targetStatus = "published") => {
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Please provide an article title.");
      return;
    }

    if (targetStatus === "published") {
      if (!formData.shortDescription.trim()) {
        setError("Please write a brief summary before publishing.");
        return;
      }
      if (!formData.content.trim()) {
        setError("Please write your article content before publishing.");
        return;
      }
    }

    if (formData.shortDescription && formData.shortDescription.trim().length > 200) {
      setError("Short summary cannot exceed 200 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("shortDescription", formData.shortDescription.trim());
      data.append("content", formData.content.trim());
      data.append("category", formData.category);
      data.append("domain", formData.domain || "Software Development");
      data.append("experienceType", formData.experienceType || formData.category);
      data.append("company", formData.company.trim());
      data.append("jobRole", formData.jobRole.trim());
      data.append("batch", formData.batch.trim());
      data.append("tags", formData.tags);
      data.append("status", targetStatus);

      if (selectedFile) {
        data.append("bannerImage", selectedFile);
      } else if (formData.bannerImageUrl.trim()) {
        data.append("bannerImageUrl", formData.bannerImageUrl.trim());
      } else if (!isEditMode) {
        data.append(
          "bannerImageUrl",
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80"
        );
      }

      if (isEditMode) {
        await API.put(`/blogs/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess(
          targetStatus === "published"
            ? "Article published successfully!"
            : "Draft updated successfully."
        );
      } else {
        await API.post("/blogs", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess(
          targetStatus === "published"
            ? "Your experience has been published successfully!"
            : "Draft saved successfully. You can continue editing anytime from My Experiences."
        );
      }

      setTimeout(() => {
        const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
          user?.role?.toLowerCase()
        );
        if (isAdmin) {
          navigate("/admin/blogs");
        } else {
          navigate("/my-blogs");
        }
      }, 1200);
    } catch (err) {
      console.error("Blog submission error:", err);
      setError(err.response?.data?.message || "Failed to submit article. Please verify inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-blog-page" style={{ background: "#f8fafc", minHeight: "100vh", paddingTop: "2rem" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 1.5rem 3rem 1.5rem" }}>
        {/* Navigation Breadcrumbs */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link
            to="/blogs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#64748b",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Alumni Experiences</span>
          </Link>

          <Link
            to="/my-blogs"
            style={{
              fontSize: "0.85rem",
              color: "#dc2626",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View My Experiences →
          </Link>
        </div>

        {/* Page Header Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                padding: "8px",
                borderRadius: "10px",
                background: "#fef2f2",
                color: "#dc2626",
              }}
            >
              <PenTool size={20} />
            </span>
            <h1
              style={{
                fontFamily: "'Fraunces', serif, Georgia",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              {isEditMode ? "Edit Alumni Experience" : "Share Your Experience"}
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.925rem", margin: 0 }}>
            Share your journey, technical knowledge, interview experience, or career advice with the GradConnect community.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Form Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Author Attribution Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  overflow: "hidden",
                }}
              >
                {user?.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={user.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  user?.name?.[0] || <User size={20} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                  Author: {user?.name || "Verified Alumni"}
                </div>
                <div style={{ fontSize: "0.825rem", color: "#64748b" }}>
                  {formData.company || user?.company
                    ? `${formData.jobRole || user?.jobTitle || "Alumni"} at ${formData.company || user?.company}`
                    : user?.role?.toUpperCase() || "Alumni"}
                  {" • Auto-bound to your verified account"}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.75rem",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "#f1f5f9",
                color: "#475569",
                fontWeight: 600,
              }}
            >
              Verified Alumni Author
            </span>
          </div>

          {/* Main Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Article Title <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. My Placement Journey: From Campus to Software Engineer at Microsoft"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>

            {/* Category and Domain Selection */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Category <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  {ALUMNI_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Technical Domain Track
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g. Frontend, Backend, AI/ML, Cloud"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Experience Details: Company, Role, Batch */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  <Building size={14} className="text-slate-500" />
                  <span>Company / Organization</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Google, Amazon, Infosys"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  <Briefcase size={14} className="text-slate-500" />
                  <span>Role / Designation</span>
                </label>
                <input
                  type="text"
                  name="jobRole"
                  value={formData.jobRole}
                  onChange={handleChange}
                  placeholder="e.g. SDE-1, Cloud Architect"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  <GraduationCap size={14} className="text-slate-500" />
                  <span>Graduating Batch</span>
                </label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  placeholder="e.g. Class of 2023"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Short Summary (Max 200 Chars) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                  Short Summary / Excerpt <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: formData.shortDescription.length > 190 ? "#dc2626" : "#94a3b8",
                  }}
                >
                  {formData.shortDescription.length} / 200 characters
                </span>
              </div>
              <textarea
                name="shortDescription"
                rows={3}
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="A concise summary highlighting the most impactful lessons, preparation timeline, or advice (max 200 characters)..."
                maxLength={200}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>

            {/* Banner Image Upload or URL */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Cover Banner Image
              </label>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <input
                    type="file"
                    id="bannerImageInput"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="bannerImageInput"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "18px",
                      borderRadius: "10px",
                      border: "2px dashed #cbd5e1",
                      background: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Upload size={22} className="text-blue-600 mb-1" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                      Click to upload cover photo
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      PNG, JPG, or WebP up to 5MB
                    </span>
                  </label>
                  <div style={{ marginTop: "8px" }}>
                    <input
                      type="url"
                      name="bannerImageUrl"
                      value={formData.bannerImageUrl}
                      onChange={handleChange}
                      placeholder="Or paste an image URL (e.g. Unsplash)..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div style={{ width: "160px", height: "100px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>
            </div>

            {/* Optional Tags */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Tags (Comma-separated)
              </label>
              <div style={{ position: "relative" }}>
                <Tag size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g. Placement, Interview Prep, Resume Tips, DSA, Microsoft"
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 36px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Article Content with Formatting Toolbar + Write / Preview Tabs */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                  Article Content <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("write")}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: activeTab === "write" ? "#ffffff" : "transparent",
                      color: activeTab === "write" ? "#0f172a" : "#64748b",
                      boxShadow: activeTab === "write" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: activeTab === "preview" ? "#ffffff" : "transparent",
                      color: activeTab === "preview" ? "#0f172a" : "#64748b",
                      boxShadow: activeTab === "preview" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    Live Preview
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
                    border: "1px solid #e2e8f0",
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
                    style={{ padding: "5px 7px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                  >
                    <Bold size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("*", "*")}
                    title="Italic"
                    style={{ padding: "5px 7px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                  >
                    <Italic size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("## ", "")}
                    title="Heading 2"
                    style={{ padding: "5px 7px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                  >
                    <Heading2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("### ", "")}
                    title="Heading 3"
                    style={{ padding: "5px 7px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                  >
                    <Heading3 size={15} />
                  </button>
                  <span style={{ width: "1px", height: "18px", background: "#cbd5e1", margin: "0 4px" }} />
                  <button
                    type="button"
                    onClick={() => insertFormat("- ", "")}
                    title="Bullet List"
                    style={{ padding: "5px 7px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                  >
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("> ", "")}
                    title="Quote"
                    style={{ padding: "5px 7px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                  >
                    <Quote size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("```\n", "\n```")}
                    title="Code Block"
                    style={{ padding: "5px 7px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                  >
                    <Code size={15} />
                  </button>
                </div>
              )}

              {activeTab === "write" ? (
                <textarea
                  id="content-textarea"
                  name="content"
                  rows={14}
                  value={formData.content}
                  onChange={handleChange}
                  placeholder={`Write your detailed experience here. Suggested structure:
1. Introduction & Background (Degree, branch, preparation timeline)
2. Application & Online Assessment (Platform, coding challenges, aptitude)
3. Technical & System Design Interviews (Questions asked, problem-solving flow)
4. HR & Cultural Fit Discussion
5. Key Takeaways & Recommendations for Juniors`}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderTopLeftRadius: "0",
                    borderTopRightRadius: "0",
                    borderBottomLeftRadius: "10px",
                    borderBottomRightRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.925rem",
                    lineHeight: 1.6,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                  required
                />
              ) : (
                <div
                  style={{
                    minHeight: "320px",
                    padding: "20px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    color: "#1e293b",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {formData.content ? (
                    formData.content
                  ) : (
                    <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                      Nothing to preview yet. Switch to "Write" tab to author your experience.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row with Save Draft and Submit Experience */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: "11px 20px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#64748b",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Save Draft Button */}
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "11px 22px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <Save size={16} />
                <span>{loading ? "Saving..." : "Save Draft"}</span>
              </button>

              {/* Submit / Publish Experience Button */}
              <button
                type="button"
                onClick={() => handleSave("published")}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 28px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                  transition: "all 0.2s ease",
                }}
              >
                <Sparkles size={16} />
                <span>
                  {loading
                    ? "Submitting..."
                    : isEditMode
                    ? "Update & Publish"
                    : "Submit Experience"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateBlog;
