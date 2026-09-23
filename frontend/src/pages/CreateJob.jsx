import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building,
  Globe,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Save,
  Link as LinkIcon,
  Mail,
  FileText,
  DollarSign,
  Users,
  Layers,
  X,
  Plus,
  ShieldCheck,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

const JOB_TYPES = ["Full-Time", "Part-Time", "Internship", "Contract"];
const WORK_MODES = ["On-site", "Hybrid", "Remote"];

const CreateJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Form State
  const [formData, setFormData] = useState({
    // Company Information
    company: "",
    companyLogo: "",
    companyWebsite: "",
    companyDescription: "",

    // Opportunity Details
    title: "",
    type: "Full-Time",
    workMode: "Remote",
    location: "Remote",
    experience: "0-2 Years",
    openings: 1,

    // Job Description & Qualifications
    description: "",
    responsibilities: "",
    qualifications: "",
    preferredQualifications: "",
    skills: [],
    preferredSkills: [],

    // Compensation & Application
    salary: "",
    deadline: "",
    applyUrl: "",
    contactEmail: "",
    instructions: "",
    status: "PUBLISHED",
  });

  // Tag chip input states
  const [skillInput, setSkillInput] = useState("");
  const [preferredSkillInput, setPreferredSkillInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");

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

  // Strict RBAC Guard
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          from: "/jobs/create",
          message: "Please log in with an alumni or admin account to post jobs.",
        },
      });
      return;
    }
    if (!isAdmin && !isAlumni) {
      navigate("/jobs", {
        replace: true,
        state: {
          error: "Access denied. Only verified alumni and administrators can post jobs.",
        },
      });
    }
  }, [user, isAdmin, isAlumni, navigate]);

  // Pre-fill company & contact from profile on new job
  useEffect(() => {
    if (user && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        company: prev.company || user.company || "",
        contactEmail: prev.contactEmail || user.email || "",
      }));
    }
  }, [user, isEditMode]);

  // Fetch existing job in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchJob = async () => {
      setFetching(true);
      setError("");
      try {
        const res = await API.get(`/jobs/${id}`);
        const j = res.data.job;
        if (!j) {
          setError("Job opportunity not found.");
          return;
        }

        const parsedSkills = Array.isArray(j.skills)
          ? j.skills
          : Array.isArray(j.requirements)
          ? j.requirements
          : [];

        const parsedPrefSkills = Array.isArray(j.preferredSkills)
          ? j.preferredSkills
          : [];

        setFormData({
          company: j.company || "",
          companyLogo: j.companyLogo || "",
          companyWebsite: j.companyWebsite || "",
          companyDescription: j.companyDescription || "",
          title: j.title || "",
          type: j.type || j.jobType || "Full-Time",
          workMode: j.workMode || "Remote",
          location: j.location || "Remote",
          experience: j.experience || j.experienceLevel || "0-2 Years",
          openings: j.openings || 1,
          description: j.description || "",
          responsibilities: j.responsibilities || "",
          qualifications: j.qualifications || "",
          preferredQualifications: j.preferredQualifications || "",
          skills: parsedSkills,
          preferredSkills: parsedPrefSkills,
          salary: j.salary || j.salaryRange || "",
          deadline: j.deadline ? j.deadline.substring(0, 10) : "",
          applyUrl: j.applyUrl || j.applicationUrl || "",
          contactEmail: j.contactEmail || "",
          instructions: j.instructions || "",
          status: j.status || "PUBLISHED",
        });
      } catch (err) {
        console.error("Fetch job for edit error:", err);
        setError(err.response?.data?.message || "Failed to load job details for editing.");
      } finally {
        setFetching(false);
      }
    };

    fetchJob();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError("");
  };

  // Skill Chip Handlers
  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (!formData.skills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
    }
    setSkillInput("");
    if (fieldErrors.skills) {
      setFieldErrors((prev) => ({ ...prev, skills: "" }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddPreferredSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = preferredSkillInput.trim();
    if (!trimmed) return;
    if (!formData.preferredSkills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        preferredSkills: [...prev.preferredSkills, trimmed],
      }));
    }
    setPreferredSkillInput("");
  };

  const handleRemovePreferredSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      preferredSkills: prev.preferredSkills.filter((s) => s !== skillToRemove),
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.company.trim()) errs.company = "Company name is required.";
    if (!formData.title.trim()) errs.title = "Job title is required.";
    if (!formData.type) errs.type = "Please select a job type.";
    if (!formData.workMode) errs.workMode = "Please select a work mode.";
    if (!formData.description.trim()) errs.description = "Job description is required.";
    if (!formData.skills || formData.skills.length === 0) {
      errs.skills = "Please add at least one required skill tag.";
    }

    if (!formData.applyUrl.trim()) {
      errs.applyUrl = "Application URL is required.";
    } else if (
      !formData.applyUrl.startsWith("http://") &&
      !formData.applyUrl.startsWith("https://")
    ) {
      errs.applyUrl = "Application URL must start with http:// or https://";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (targetStatus = "PUBLISHED") => {
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setError("Please fill in all required fields highlighted below.");
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
        openings: Number(formData.openings) || 1,
      };

      if (isEditMode) {
        await API.put(`/jobs/${id}`, payload);
        setSuccess(
          targetStatus === "PUBLISHED"
            ? "Job opportunity updated and published successfully!"
            : "Job draft updated successfully."
        );
      } else {
        await API.post("/jobs", payload);
        setSuccess(
          targetStatus === "PUBLISHED"
            ? "Job opportunity posted successfully! It is now live in the career portal."
            : "Job saved as draft."
        );
      }

      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin/jobs");
        } else {
          navigate("/jobs");
        }
      }, 1100);
    } catch (err) {
      console.error("Job submit error:", err);
      setError(err.response?.data?.message || "Failed to save job opportunity.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b", fontWeight: 600 }}>Loading opportunity details...</p>
      </div>
    );
  }

  return (
    <div className="create-job-page" style={{ background: "#f8fafc", minHeight: "100vh", padding: "2rem 0 4rem" }}>
      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 1.5rem" }}>
        {/* Back Navigation */}
        <div style={{ marginBottom: "1.25rem" }}>
          <Link
            to={isAdmin ? "/admin/jobs" : "/jobs"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#64748b",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "color 0.15s ease",
            }}
          >
            <ArrowLeft size={16} />
            <span>← Back to Jobs</span>
          </Link>
        </div>

        {/* Page Header */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px 32px",
            marginBottom: "1.75rem",
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
              <Briefcase size={22} />
            </span>
            <h1
              style={{
                fontFamily: "'Fraunces', serif, Georgia",
                fontSize: "1.85rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              {isEditMode ? "Edit Job Opportunity" : "Post a Job Opportunity"}
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "0 0 0 46px" }}>
            Share a verified career opportunity with the GradConnect community.
          </p>
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
            <AlertTriangle size={18} />
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
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit("PUBLISHED"); }}>
          {/* TWO-COLUMN DESKTOP LAYOUT: COMPANY INFO & OPPORTUNITY DETAILS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
              gap: "1.75rem",
              marginBottom: "1.75rem",
            }}
          >
            {/* COLUMN 1: Company Information */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "24px 26px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <Building size={18} className="text-slate-500" />
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Company Information
                </h2>
              </div>

              {/* Company Name * */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Company Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Google, Stripe, Microsoft"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${fieldErrors.company ? "#ef4444" : "#cbd5e1"}`,
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {fieldErrors.company && <span style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{fieldErrors.company}</span>}
              </div>

              {/* Company Logo URL */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Company Logo URL
                </label>
                <input
                  type="url"
                  name="companyLogo"
                  value={formData.companyLogo}
                  onChange={handleChange}
                  placeholder="https://..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Company Website */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Company Website
                </label>
                <div style={{ position: "relative" }}>
                  <Globe size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="url"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    placeholder="https://company.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 36px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Company Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Company Description
                </label>
                <textarea
                  name="companyDescription"
                  rows={3}
                  value={formData.companyDescription}
                  onChange={handleChange}
                  placeholder="Short summary about the company, mission, and work culture..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* COLUMN 2: Opportunity Details */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "24px 26px",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <Layers size={18} className="text-slate-500" />
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Opportunity Details
                </h2>
              </div>

              {/* Job Title * */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Job Title <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Frontend Engineer"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${fieldErrors.title ? "#ef4444" : "#cbd5e1"}`,
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {fieldErrors.title && <span style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{fieldErrors.title}</span>}
              </div>

              {/* Job Type * & Work Mode * */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    Job Type <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      background: "#ffffff",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    Work Mode <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      background: "#ffffff",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {WORK_MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Experience Level */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. San Francisco, CA / Remote"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    Experience Level
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 0-2 Years, Entry-Level"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Number of Openings */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Number of Openings
                </label>
                <input
                  type="number"
                  min="1"
                  name="openings"
                  value={formData.openings}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: JOB DESCRIPTION & QUALIFICATIONS */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              marginBottom: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <FileText size={18} className="text-slate-500" />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Job Description &amp; Qualifications
              </h2>
            </div>

            {/* Job Description * */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Job Description <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Comprehensive summary of the role, key impact, and team expectations..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${fieldErrors.description ? "#ef4444" : "#cbd5e1"}`,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              {fieldErrors.description && <span style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>{fieldErrors.description}</span>}
            </div>

            {/* Responsibilities */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Responsibilities
              </label>
              <textarea
                name="responsibilities"
                rows={3}
                value={formData.responsibilities}
                onChange={handleChange}
                placeholder="Core day-to-day deliverables and execution expectations..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Required & Preferred Qualifications */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Required Qualifications
                </label>
                <textarea
                  name="qualifications"
                  rows={3}
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech / B.S. in Computer Science or equivalent practical experience..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Preferred Qualifications
                </label>
                <textarea
                  name="preferredQualifications"
                  rows={3}
                  value={formData.preferredQualifications}
                  onChange={handleChange}
                  placeholder="e.g. Previous internship experience with cloud micro-services or distributed systems..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* REQUIRED SKILLS WITH REMOVABLE TAGS/CHIPS */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Required Skills <span style={{ color: "#dc2626" }}>*</span>
              </label>

              {/* Tag input row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter (e.g. React, Node.js)"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${fieldErrors.skills ? "#ef4444" : "#cbd5e1"}`,
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f1f5f9",
                    color: "#334155",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={15} />
                  <span>Add</span>
                </button>
              </div>

              {fieldErrors.skills && (
                <span style={{ color: "#dc2626", fontSize: "0.75rem", marginBottom: "8px", display: "block" }}>
                  {fieldErrors.skills}
                </span>
              )}

              {/* Rendered Removable Tag Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "36px", padding: "8px", borderRadius: "8px", background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                {formData.skills.length === 0 ? (
                  <span style={{ fontSize: "0.825rem", color: "#94a3b8", fontStyle: "italic", alignSelf: "center" }}>
                    No skills added yet. Type a skill above and press Add.
                  </span>
                ) : (
                  formData.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#3b82f6",
                          cursor: "pointer",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          lineHeight: 1,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* PREFERRED SKILLS WITH REMOVABLE TAGS/CHIPS */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Preferred Skills
              </label>

              {/* Preferred Tag input row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  value={preferredSkillInput}
                  onChange={(e) => setPreferredSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddPreferredSkill();
                    }
                  }}
                  placeholder="Type an optional skill (e.g. AWS, Docker, GraphQL)"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPreferredSkill}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f1f5f9",
                    color: "#334155",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={15} />
                  <span>Add</span>
                </button>
              </div>

              {/* Rendered Preferred Removable Tag Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "36px", padding: "8px", borderRadius: "8px", background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                {formData.preferredSkills.length === 0 ? (
                  <span style={{ fontSize: "0.825rem", color: "#94a3b8", fontStyle: "italic", alignSelf: "center" }}>
                    No preferred skills added.
                  </span>
                ) : (
                  formData.preferredSkills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        background: "#f1f5f9",
                        color: "#475569",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreferredSkill(skill)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          lineHeight: 1,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: COMPENSATION & APPLICATION */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              marginBottom: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <DollarSign size={18} className="text-slate-500" />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Compensation &amp; Application
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              {/* Salary Range / Stipend */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Salary Range / Stipend
                </label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g. $100k - $130k / yr or ₹12 - ₹18 LPA"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Application Deadline */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              {/* Application URL * */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Application URL <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <LinkIcon size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="url"
                    name="applyUrl"
                    value={formData.applyUrl}
                    onChange={handleChange}
                    placeholder="https://careers.company.com/job/123"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 36px",
                      borderRadius: "8px",
                      border: `1px solid ${fieldErrors.applyUrl ? "#ef4444" : "#cbd5e1"}`,
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                {fieldErrors.applyUrl && (
                  <span style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                    {fieldErrors.applyUrl}
                  </span>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Contact Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="referrals@company.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 36px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Additional Instructions */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Additional Application Instructions
              </label>
              <textarea
                name="instructions"
                rows={2}
                value={formData.instructions}
                onChange={handleChange}
                placeholder="e.g. Mention that you found this posting through GradConnect in your cover letter or note."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* SECTION 4: POSTING CONTROLS & AUTHOR ATTRIBUTION */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            {/* Professional Summary Section: Posting as */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: isAdmin ? "#eff6ff" : "#fef2f2",
                  color: isAdmin ? "#2563eb" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  border: `2px solid ${isAdmin ? "#bfdbfe" : "#fecaca"}`,
                  overflow: "hidden",
                }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user?.name?.[0] || "U"
                )}
              </div>

              <div>
                <div style={{ fontSize: "0.775rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Posting as
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                  {isAdmin ? "GradConnect Admin" : user?.name || "Verified Alumni"}
                </div>
                <div style={{ fontSize: "0.8rem", color: isAdmin ? "#2563eb" : "#16a34a", fontWeight: 600 }}>
                  {isAdmin ? "Administrator" : "Verified Alumni"}
                </div>
              </div>
            </div>

            {/* Actions: Save Draft & Publish */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleSubmit("DRAFT")}
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
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                <Save size={16} />
                <span>{loading ? "Saving..." : "Save as Draft"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("PUBLISHED")}
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
                  transition: "all 0.15s ease",
                }}
              >
                <Sparkles size={16} />
                <span>
                  {loading
                    ? "Publishing..."
                    : isEditMode
                    ? "Update Opportunity"
                    : "Publish Job"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default CreateJob;
