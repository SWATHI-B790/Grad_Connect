import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Layers,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Award,
  Briefcase,
  Wrench,
  TrendingUp,
  Cpu,
  GraduationCap,
  Save,
  Clock,
  Tag,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CATEGORIES = [
  "Development",
  "AI & Data",
  "Cloud & DevOps",
  "Cybersecurity",
  "Design",
  "Mobile",
  "Emerging Technology",
  "Software Engineering",
  "Other",
];

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const DEMAND_LEVELS = ["Very High", "High", "Moderate", "Emerging"];

const DEFAULT_TIERS = [
  {
    tier: 1,
    title: "Foundations & Core Principles",
    duration: "4 - 6 Weeks",
    description: "Master the foundational syntax, fundamental computer science concepts, and core toolchain.",
    topics: ["Syntax & Standard Libraries", "Data Structures & Algorithms", "Version Control (Git/GitHub)", "Environment Setup & CLI"],
  },
  {
    tier: 2,
    title: "Core Architecture & Engineering",
    duration: "6 - 8 Weeks",
    description: "Build robust, real-world applications with modern industry frameworks, databases, and APIs.",
    topics: ["API Design & REST/GraphQL", "State Management & Component Architecture", "Database Schema & Indexing", "Authentication & Security Best Practices"],
  },
  {
    tier: 3,
    title: "Production Scaling & Systems Specialization",
    duration: "8 - 12 Weeks",
    description: "Design for scale, fault tolerance, continuous deployment, and high-load production environments.",
    topics: ["Microservices & Distributed Systems", "CI/CD Pipelines & Docker Containers", "Observability & Performance Profiling", "Cloud Architecture & High Availability"],
  },
];

const CreateDomain = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Basic Details State
  const [formData, setFormData] = useState({
    name: "",
    category: "Development",
    difficultyLevel: "Intermediate",
    shortDescription: "",
    description: "",
    marketDemand: "High",
    salaryRange: "₹8 - ₹24 LPA",
    industry: "Information Technology & Software Services",
  });

  // Array fields with interactive tag inputs
  const [technologies, setTechnologies] = useState(["React", "Node.js", "TypeScript", "PostgreSQL"]);
  const [currentTechInput, setCurrentTechInput] = useState("");

  const [jobRoles, setJobRoles] = useState(["Full Stack Engineer", "Backend Developer", "Cloud Architect"]);
  const [currentRoleInput, setCurrentRoleInput] = useState("");

  const [tools, setTools] = useState(["Git", "Docker", "VS Code", "Postman"]);
  const [currentToolInput, setCurrentToolInput] = useState("");

  const [certifications, setCertifications] = useState(["AWS Certified Solutions Architect", "CKA: Certified Kubernetes Administrator"]);
  const [currentCertInput, setCurrentCertInput] = useState("");

  // Roadmap Tiers (Dynamic array of tiers)
  const [roadmapTiers, setRoadmapTiers] = useState(DEFAULT_TIERS);
  const [tierTopicInputs, setTierTopicInputs] = useState({});

  // UI status
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check user permissions
  const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(user?.role?.toLowerCase());
  const isAlumni = user?.role?.toLowerCase() === "alumni" || user?.userType === "Alumni";

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          from: isEditMode ? `/domains/edit/${id}` : "/domains/create",
          message: "Please log in to curate a domain track.",
        },
      });
      return;
    }

    if (!isAlumni && !isAdmin) {
      navigate("/domains");
      return;
    }

    if (isEditMode) {
      fetchDomainDetails();
    }
  }, [user, isEditMode, id]);

  const fetchDomainDetails = async () => {
    setInitialLoading(true);
    try {
      const res = await API.get(`/domains/id/${id}`);
      if (res.data && res.data.domain) {
        const d = res.data.domain;
        setFormData({
          name: d.name || "",
          category: d.category || "Development",
          difficultyLevel: d.difficultyLevel || "Intermediate",
          shortDescription: d.shortDescription || "",
          description: d.description || "",
          marketDemand: d.marketDemand || "High",
          salaryRange: d.salaryRange || "₹8 - ₹24 LPA",
          industry: d.industry || "Information Technology & Software Services",
        });

        if (Array.isArray(d.technologies) && d.technologies.length > 0) setTechnologies(d.technologies);
        if (Array.isArray(d.jobRoles || d.careerRoles) && (d.jobRoles || d.careerRoles).length > 0) {
          setJobRoles(d.jobRoles || d.careerRoles);
        }
        if (Array.isArray(d.tools) && d.tools.length > 0) setTools(d.tools);
        if (Array.isArray(d.certifications) && d.certifications.length > 0) setCertifications(d.certifications);

        if (Array.isArray(d.roadmap) && d.roadmap.length > 0) {
          setRoadmapTiers(d.roadmap);
        }
      }
    } catch (err) {
      console.error("Failed to load domain for edit:", err);
      setErrorMsg("Failed to load domain details. Please try again.");
    } finally {
      setInitialLoading(false);
    }
  };

  // Helper handlers for tag arrays
  const handleAddTag = (list, setList, inputVal, setInputVal) => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInputVal("");
  };

  const handleRemoveTag = (list, setList, itemToRemove) => {
    setList(list.filter((item) => item !== itemToRemove));
  };

  // Roadmap Tier Handlers
  const handleTierChange = (index, field, value) => {
    const updated = [...roadmapTiers];
    updated[index] = { ...updated[index], [field]: value };
    setRoadmapTiers(updated);
  };

  const handleAddTopicToTier = (tierIndex) => {
    const topicText = (tierTopicInputs[tierIndex] || "").trim();
    if (!topicText) return;

    const updated = [...roadmapTiers];
    const currentTopics = Array.isArray(updated[tierIndex].topics) ? updated[tierIndex].topics : [];
    if (!currentTopics.includes(topicText)) {
      updated[tierIndex] = {
        ...updated[tierIndex],
        topics: [...currentTopics, topicText],
      };
      setRoadmapTiers(updated);
    }
    setTierTopicInputs({ ...tierTopicInputs, [tierIndex]: "" });
  };

  const handleRemoveTopicFromTier = (tierIndex, topicToRemove) => {
    const updated = [...roadmapTiers];
    const currentTopics = Array.isArray(updated[tierIndex].topics) ? updated[tierIndex].topics : [];
    updated[tierIndex] = {
      ...updated[tierIndex],
      topics: currentTopics.filter((t) => t !== topicToRemove),
    };
    setRoadmapTiers(updated);
  };

  const handleAddNewTier = () => {
    const newTierNumber = roadmapTiers.length + 1;
    setRoadmapTiers([
      ...roadmapTiers,
      {
        tier: newTierNumber,
        title: `Tier ${newTierNumber}: Advanced Competencies`,
        duration: "6 - 8 Weeks",
        description: "Specialized mastery and deep-dive production engineering.",
        topics: [],
      },
    ]);
  };

  const handleRemoveTier = (tierIndex) => {
    if (roadmapTiers.length <= 1) {
      alert("A domain roadmap must contain at least one tier.");
      return;
    }
    const filtered = roadmapTiers.filter((_, idx) => idx !== tierIndex);
    // Re-index tier numbers
    const reindexed = filtered.map((tier, idx) => ({
      ...tier,
      tier: idx + 1,
    }));
    setRoadmapTiers(reindexed);
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate
    if (!formData.name.trim()) {
      setErrorMsg("Domain Name is required.");
      return;
    }
    if (!formData.shortDescription.trim()) {
      setErrorMsg("Short description is required.");
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg("Full overview description is required.");
      return;
    }
    if (technologies.length === 0) {
      setErrorMsg("Please add at least one core technology/skill.");
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      difficultyLevel: formData.difficultyLevel,
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      marketDemand: formData.marketDemand,
      salaryRange: formData.salaryRange.trim(),
      industry: formData.industry.trim(),
      technologies,
      skills: technologies,
      jobRoles,
      careerRoles: jobRoles,
      tools,
      certifications,
      roadmap: roadmapTiers,
    };

    try {
      if (isEditMode) {
        await API.put(`/domains/${id}`, payload);
        setSuccessMsg("Domain roadmap updated successfully!");
      } else {
        await API.post("/domains/suggest", payload);
        setSuccessMsg("Domain roadmap curated and published successfully!");
      }

      setTimeout(() => {
        navigate("/domains");
      }, 1200);
    } catch (err) {
      console.error("Save Domain Error:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to save domain track. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px auto" }} />
            <p style={{ color: "#64748b", fontWeight: 600 }}>Loading domain editor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: "1040px", margin: "0 auto", padding: "2.5rem 1.25rem 4rem", width: "100%" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/domains"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#64748b",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#0f172a")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ArrowLeft size={16} />
            <span>Back to Engineering Domains</span>
          </Link>
        </div>

        {/* Page Header */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "2rem",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Layers size={26} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {isEditMode ? "Edit Technical Domain Roadmap" : "Curate Technical Engineering Track"}
              </h1>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.925rem" }}>
                Share your real-world technical expertise, structured learning roadmaps, skills, and industry certifications.
              </p>
            </div>
          </div>

          {/* Alumni Author Identification Banner */}
          <div
            style={{
              marginTop: "1.25rem",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: 700, color: "#166534", fontSize: "0.9rem" }}>
                    {user?.name || "Verified Alumni"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {user?.role || "Alumni"}
                  </span>
                </div>
                <span style={{ fontSize: "0.78rem", color: "#15803d" }}>
                  Direct Publication Mode: Submissions go live instantly without pending approval.
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontSize: "0.8rem", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Instant Public Availability</span>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.9rem",
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.9rem",
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: Basic Domain Information */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "2rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: "1.75rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 1.25rem 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={20} style={{ color: "#2563eb" }} />
              <span>1. Overview & Fundamentals</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
              {/* Domain Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Domain Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Cloud Native, GenAI Systems"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.925rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Category <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.925rem",
                    background: "#ffffff",
                    outline: "none",
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Recommended Difficulty Level
                </label>
                <select
                  value={formData.difficultyLevel}
                  onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.925rem",
                    background: "#ffffff",
                    outline: "none",
                  }}
                >
                  {DIFFICULTY_LEVELS.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market Demand */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Market Demand
                </label>
                <select
                  value={formData.marketDemand}
                  onChange={(e) => setFormData({ ...formData, marketDemand: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.925rem",
                    background: "#ffffff",
                    outline: "none",
                  }}
                >
                  {DEMAND_LEVELS.map((dem) => (
                    <option key={dem} value={dem}>
                      {dem} Demand
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary Range */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Typical Salary Range
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹8 - ₹24 LPA / $80k - $140k"
                  value={formData.salaryRange}
                  onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.925rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Industry */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Target Industry Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise SaaS, FinTech, Autonomous Systems"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.925rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Short Description */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Short Punchy Tagline / Card Description <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="A concise 1-sentence summary displayed on domain overview cards."
                value={formData.shortDescription}
                maxLength={250}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.925rem",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                {formData.shortDescription.length}/250 characters
              </span>
            </div>

            {/* Detailed Description */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Comprehensive Domain Overview & Career Context <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Explain what this domain entails, why it matters in modern tech stacks, and what students will achieve following this roadmap."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.925rem",
                  lineHeight: 1.5,
                  outline: "none",
                }}
              />
            </div>
          </section>

          {/* SECTION 2: Dynamic 3-Tier Learning Roadmap Builder */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "2rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: "1.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <BookOpen size={20} style={{ color: "#2563eb" }} />
                  <span>2. Dynamic Learning Roadmap (Tiers & Milestones)</span>
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Structure learning progressive milestones from foundations to production mastery. Add or customize tiers and topics.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddNewTier}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#2563eb",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                <Plus size={16} />
                <span>Add New Tier</span>
              </button>
            </div>

            {/* Tiers List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {roadmapTiers.map((tierItem, tierIdx) => (
                <div
                  key={tierIdx}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    background: "#fbfcfd",
                  }}
                >
                  {/* Tier Top Row: Tier Number, Title, Duration, Delete Tier */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          background: "#2563eb",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          padding: "3px 10px",
                          borderRadius: "999px",
                        }}
                      >
                        Tier {tierItem.tier || tierIdx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Tier Title (e.g. Foundations & Core Principles)"
                        value={tierItem.title}
                        onChange={(e) => handleTierChange(tierIdx, "title", e.target.value)}
                        style={{
                          fontWeight: 700,
                          fontSize: "0.975rem",
                          color: "#0f172a",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          minWidth: "260px",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#64748b" }}>
                        <Clock size={15} />
                        <input
                          type="text"
                          placeholder="e.g. 4-6 Weeks"
                          value={tierItem.duration || ""}
                          onChange={(e) => handleTierChange(tierIdx, "duration", e.target.value)}
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.825rem",
                            width: "110px",
                          }}
                        />
                      </div>

                      {roadmapTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(tierIdx)}
                          title="Remove this tier"
                          style={{
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "1px solid #fecaca",
                            background: "#fff5f5",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tier Description */}
                  <div style={{ marginBottom: "1rem" }}>
                    <input
                      type="text"
                      placeholder="Brief summary of learning objectives in this tier..."
                      value={tierItem.description || ""}
                      onChange={(e) => handleTierChange(tierIdx, "description", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    />
                  </div>

                  {/* Topics List & Add Topic Input */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                      Curated Topics & Skills in this Tier ({tierItem.topics?.length || 0})
                    </label>

                    {/* Topic Pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                      {Array.isArray(tierItem.topics) &&
                        tierItem.topics.map((topic, topicIdx) => (
                          <span
                            key={topicIdx}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: "#eff6ff",
                              color: "#1e40af",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            <span>{topic}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTopicFromTier(tierIdx, topic)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#1e40af",
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                              }}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                    </div>

                    {/* Add Topic Field */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Add a specific topic (e.g. Distributed Caching with Redis)..."
                        value={tierTopicInputs[tierIdx] || ""}
                        onChange={(e) => setTierTopicInputs({ ...tierTopicInputs, [tierIdx]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTopicToTier(tierIdx);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.85rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTopicToTier(tierIdx)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "6px",
                          background: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          fontWeight: 600,
                          fontSize: "0.825rem",
                          cursor: "pointer",
                        }}
                      >
                        Add Topic
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Skills, Tools & Industry Certifications */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "2rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: "1.75rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 1.25rem 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Award size={20} style={{ color: "#2563eb" }} />
              <span>3. Tech Stack, Tools & Certifications</span>
            </h2>

            {/* Core Technologies */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Core Technologies & Frameworks <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#334155",
                      fontSize: "0.825rem",
                      fontWeight: 600,
                    }}
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(technologies, setTechnologies, tech)}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Add technology (e.g. Next.js, Kubernetes, PyTorch)..."
                  value={currentTechInput}
                  onChange={(e) => setCurrentTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(technologies, setTechnologies, currentTechInput, setCurrentTechInput);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(technologies, setTechnologies, currentTechInput, setCurrentTechInput)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.825rem",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Target Job Roles */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Target Industry Job Roles
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {jobRoles.map((role) => (
                  <span
                    key={role}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#eff6ff",
                      color: "#1e40af",
                      fontSize: "0.825rem",
                      fontWeight: 600,
                    }}
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(jobRoles, setJobRoles, role)}
                      style={{ background: "none", border: "none", color: "#1e40af", cursor: "pointer", padding: 0 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Add role (e.g. Senior Backend Engineer, DevOps Specialist)..."
                  value={currentRoleInput}
                  onChange={(e) => setCurrentRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(jobRoles, setJobRoles, currentRoleInput, setCurrentRoleInput);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(jobRoles, setJobRoles, currentRoleInput, setCurrentRoleInput)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.825rem",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Recognized Certifications */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Recommended Industry Certifications
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {certifications.map((cert) => (
                  <span
                    key={cert}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#fef3c7",
                      color: "#92400e",
                      fontSize: "0.825rem",
                      fontWeight: 600,
                    }}
                  >
                    <span>{cert}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(certifications, setCertifications, cert)}
                      style={{ background: "none", border: "none", color: "#92400e", cursor: "pointer", padding: 0 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Add certification (e.g. AWS Solutions Architect, GCP Data Engineer)..."
                  value={currentCertInput}
                  onChange={(e) => setCurrentCertInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(certifications, setCertifications, currentCertInput, setCurrentCertInput);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(certifications, setCertifications, currentCertInput, setCurrentCertInput)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.825rem",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* Form Actions Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              padding: "1.5rem 0",
            }}
          >
            <Link
              to="/domains"
              style={{
                padding: "12px 24px",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 32px",
                borderRadius: "999px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Save size={18} />
              <span>{loading ? "Publishing Roadmap..." : isEditMode ? "Update Domain Roadmap" : "Publish Technical Domain"}</span>
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default CreateDomain;
