import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  Award,
  Users,
  Check,
  X,
  FileText,
  Clock,
  TrendingUp,
  DollarSign,
  Briefcase,
  Wrench,
  BookOpen,
  Filter,
  Sparkles,
  Send,
  AlertTriangle,
} from "lucide-react";
import API from "../../api/axios";

const CATEGORIES = [
  "Development",
  "AI & Data",
  "Cloud & DevOps",
  "Cybersecurity",
  "Design",
  "Mobile",
  "Emerging Technology",
  "Other",
];

const AdminDomainManagement = () => {
  // Tabs: 'domains' | 'pending' | 'articles'
  const [activeTab, setActiveTab] = useState("domains");

  // Domain Management State
  const [domains, setDomains] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    unpublished: 0,
    rejected: 0,
    alumniSubmitted: 0,
  });
  const [loadingDomains, setLoadingDomains] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Domain Create / Edit Modal State
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [domainModalMode, setDomainModalMode] = useState("add"); // 'add' | 'edit'
  const [domainModalTab, setDomainModalTab] = useState("details"); // 'details' | 'skills' | 'roadmap' | 'projects'
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Domain Form State
  const [domainForm, setDomainForm] = useState({
    name: "",
    category: "Development",
    shortDescription: "",
    description: "",
    salaryRange: "",
    marketDemand: "High",
    careerRoles: "",
    technologies: "",
    skills: "",
    tools: "",
    status: "PUBLISHED",
    beginnerDuration: "1-2 Months",
    beginnerTopics: "",
    intermediateDuration: "2-3 Months",
    intermediateTopics: "",
    advancedDuration: "3-4 Months",
    advancedTopics: "",
    proj1Title: "",
    proj1Difficulty: "Beginner",
    proj1Desc: "",
    proj2Title: "",
    proj2Difficulty: "Intermediate",
    proj2Desc: "",
  });

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Articles Tab State
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const [articleDomainFilter, setArticleDomainFilter] = useState("all");

  // 1. Fetch Domains from Backend
  const fetchDomains = useCallback(async () => {
    setLoadingDomains(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);

      const res = await API.get(`/admin/domains?${params.toString()}`);
      setDomains(res.data.domains || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to load engineering tracks");
    } finally {
      setLoadingDomains(false);
    }
  }, [search, categoryFilter, statusFilter, sourceFilter]);

  // 2. Fetch Domain Articles
  const fetchArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const params = new URLSearchParams();
      if (articleSearch.trim()) params.append("search", articleSearch.trim());
      if (articleDomainFilter !== "all") params.append("domain", articleDomainFilter);

      const res = await API.get(`/admin/domain-articles?${params.toString()}`);
      setArticles(res.data.articles || []);
    } catch (err) {
      console.error("Failed to load domain articles:", err);
    } finally {
      setLoadingArticles(false);
    }
  }, [articleSearch, articleDomainFilter]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  useEffect(() => {
    if (activeTab === "articles") {
      fetchArticles();
    }
  }, [activeTab, fetchArticles]);

  // Alert dismiss
  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setDomainModalMode("add");
    setSelectedDomain(null);
    setDomainModalTab("details");
    setDomainForm({
      name: "",
      category: "Development",
      shortDescription: "",
      description: "",
      salaryRange: "$75,000 - $130,000",
      marketDemand: "High",
      careerRoles: "Full Stack Engineer, Frontend Engineer, Backend Developer",
      technologies: "React, Node.js, Express, MongoDB, TypeScript",
      skills: "RESTful APIs, Component Architecture, Database Design",
      tools: "Postman, Git, VS Code, Docker",
      status: "PUBLISHED",
      beginnerDuration: "1-2 Months",
      beginnerTopics: "Fundamentals, Syntax, Toolchain Setup, Core Principles",
      intermediateDuration: "2-3 Months",
      intermediateTopics: "Architecture, State Management, Authentication, API Integration",
      advancedDuration: "3-4 Months",
      advancedTopics: "Performance Optimization, Microservices, CI/CD, Production Deployment",
      proj1Title: "Interactive Dashboard Application",
      proj1Difficulty: "Beginner",
      proj1Desc: "Build a responsive web application with real-time UI updates and mock data.",
      proj2Title: "Full-Stack Collaborative Platform",
      proj2Difficulty: "Intermediate",
      proj2Desc: "End-to-end multi-user application with database persistence, auth, and REST APIs.",
    });
    setDomainModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (dom) => {
    setDomainModalMode("edit");
    setSelectedDomain(dom);
    setDomainModalTab("details");

    const lp = dom.learningPath || {};
    const projs = dom.relatedProjects || [];

    setDomainForm({
      name: dom.name || "",
      category: dom.category || "Development",
      shortDescription: dom.shortDescription || "",
      description: dom.description || "",
      salaryRange: dom.salaryRange || "",
      marketDemand: dom.marketDemand || "High",
      careerRoles: Array.isArray(dom.careerRoles) ? dom.careerRoles.join(", ") : "",
      technologies: Array.isArray(dom.technologies) ? dom.technologies.join(", ") : "",
      skills: Array.isArray(dom.skills) ? dom.skills.join(", ") : "",
      tools: Array.isArray(dom.tools) ? dom.tools.join(", ") : "",
      status: dom.status || "PUBLISHED",
      beginnerDuration: lp.beginner?.duration || "1-2 Months",
      beginnerTopics: Array.isArray(lp.beginner?.topics) ? lp.beginner.topics.join(", ") : "",
      intermediateDuration: lp.intermediate?.duration || "2-3 Months",
      intermediateTopics: Array.isArray(lp.intermediate?.topics) ? lp.intermediate.topics.join(", ") : "",
      advancedDuration: lp.advanced?.duration || "3-4 Months",
      advancedTopics: Array.isArray(lp.advanced?.topics) ? lp.advanced.topics.join(", ") : "",
      proj1Title: projs[0]?.title || "",
      proj1Difficulty: projs[0]?.difficulty || "Beginner",
      proj1Desc: projs[0]?.description || "",
      proj2Title: projs[1]?.title || "",
      proj2Difficulty: projs[1]?.difficulty || "Intermediate",
      proj2Desc: projs[1]?.description || "",
    });
    setDomainModalOpen(true);
  };

  // Handle Domain Form Submit (Add or Edit)
  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        name: domainForm.name.trim(),
        category: domainForm.category,
        shortDescription: domainForm.shortDescription.trim(),
        description: domainForm.description.trim() || domainForm.shortDescription.trim(),
        salaryRange: domainForm.salaryRange.trim(),
        marketDemand: domainForm.marketDemand,
        careerRoles: domainForm.careerRoles
          ? domainForm.careerRoles.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        technologies: domainForm.technologies
          ? domainForm.technologies.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        skills: domainForm.skills
          ? domainForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        tools: domainForm.tools
          ? domainForm.tools.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        status: domainForm.status,
        learningPath: {
          beginner: {
            title: "Beginner Foundations",
            duration: domainForm.beginnerDuration.trim(),
            topics: domainForm.beginnerTopics
              ? domainForm.beginnerTopics.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          },
          intermediate: {
            title: "Intermediate Core Architecture",
            duration: domainForm.intermediateDuration.trim(),
            topics: domainForm.intermediateTopics
              ? domainForm.intermediateTopics.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          },
          advanced: {
            title: "Advanced Systems & Production",
            duration: domainForm.advancedDuration.trim(),
            topics: domainForm.advancedTopics
              ? domainForm.advancedTopics.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          },
        },
        relatedProjects: [
          ...(domainForm.proj1Title.trim()
            ? [
                {
                  title: domainForm.proj1Title.trim(),
                  difficulty: domainForm.proj1Difficulty,
                  description: domainForm.proj1Desc.trim(),
                  skills: [],
                },
              ]
            : []),
          ...(domainForm.proj2Title.trim()
            ? [
                {
                  title: domainForm.proj2Title.trim(),
                  difficulty: domainForm.proj2Difficulty,
                  description: domainForm.proj2Desc.trim(),
                  skills: [],
                },
              ]
            : []),
        ],
      };

      if (domainModalMode === "edit") {
        await API.put(`/admin/domains/${selectedDomain._id}`, payload);
        showNotification(`Domain "${payload.name}" updated successfully.`);
      } else {
        await API.post("/admin/domains", payload);
        showNotification(`Domain "${payload.name}" created successfully.`);
      }

      setDomainModalOpen(false);
      fetchDomains();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save domain track", true);
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle Status (Publish / Unpublish)
  const handleToggleStatus = async (dom) => {
    const nextStatus = dom.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    try {
      await API.patch(`/admin/domains/${dom._id}/status`, { status: nextStatus });
      showNotification(`Track "${dom.name}" is now ${nextStatus.toLowerCase()}.`);
      fetchDomains();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update status", true);
    }
  };

  // Direct Approve
  const handleApprove = async (dom) => {
    try {
      await API.put(`/admin/domains/${dom._id}/approve`);
      showNotification(`Submission "${dom.name}" approved and published!`);
      fetchDomains();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to approve domain", true);
    }
  };

  // Open Rejection Modal
  const openRejectModal = (dom) => {
    setRejectTargetId(dom._id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  // Submit Rejection
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showNotification("Please specify a reason for rejecting this submission.", true);
      return;
    }
    setRejectLoading(true);
    try {
      await API.put(`/admin/domains/${rejectTargetId}/reject`, { reason: rejectReason.trim() });
      showNotification("Submission rejected with feedback recorded.");
      setRejectModalOpen(false);
      fetchDomains();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to reject submission", true);
    } finally {
      setRejectLoading(false);
    }
  };

  // Delete Modal
  const openDeleteModal = (dom) => {
    setDeleteTarget(dom);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/admin/domains/${deleteTarget._id}`);
      showNotification(`Domain "${deleteTarget.name}" deleted permanently.`);
      setDeleteModalOpen(false);
      fetchDomains();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to delete domain", true);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Pending Submissions Filter
  const pendingSubmissions = domains.filter((d) => d.status === "PENDING");

  return (
    <div className="admin-page-content">
      <div className="admin-page-container">
        {/* ============================================================
            1. PAGE HEADER
            ============================================================ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  display: "inline-flex",
                  padding: "6px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  color: "#2563eb",
                }}
              >
                <Layers size={20} />
              </span>
              <h1 className="admin-page-title" style={{ margin: 0, fontSize: "1.75rem" }}>
                Domain &amp; Roadmap Management
              </h1>
            </div>
            <p className="admin-page-subtitle" style={{ margin: 0, fontSize: "0.9rem" }}>
              Curate engineering tracks, configure 3-tier learning roadmaps, manage skills taxonomy, and review alumni domain proposals.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => {
                fetchDomains();
                if (activeTab === "articles") fetchArticles();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Refresh domains list"
            >
              <RefreshCw size={15} className={loadingDomains ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
              }}
            >
              <Plus size={16} />
              <span>Create Track</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================
            2. KPI OVERVIEW CARDS
            ============================================================ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
              Total Tracks
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {stats.totalDomains ?? stats.total ?? domains.length}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
              Curated engineering domains
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "#166534" }}>
              Published &amp; Live
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
              {stats.publishedDomains ?? stats.published ?? domains.filter((d) => d.status === "PUBLISHED").length}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
              Active on public /domains
            </div>
          </div>

          <div
            style={{
              background: (stats.pendingDomains || stats.pending || pendingSubmissions.length) > 0 ? "#fffbeb" : "#ffffff",
              padding: "18px 20px",
              borderRadius: "14px",
              border: (stats.pendingDomains || stats.pending || pendingSubmissions.length) > 0 ? "1.5px solid #f59e0b" : "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "#b45309" }}>
              Pending Review
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
              {stats.pendingDomains ?? stats.pending ?? pendingSubmissions.length}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
              Alumni proposals awaiting approval
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
              Alumni Submitted
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>
              {stats.alumniSubmittedDomains ?? stats.alumniSubmitted ?? domains.filter((d) => d.createdByRole === "alumni").length}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
              Community contributions
            </div>
          </div>
        </div>

        {/* ============================================================
            3. TAB NAVIGATION
            ============================================================ */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            marginBottom: "20px",
            gap: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("domains")}
            style={{
              padding: "10px 4px",
              border: "none",
              borderBottom: activeTab === "domains" ? "2.5px solid #2563eb" : "2.5px solid transparent",
              background: "transparent",
              color: activeTab === "domains" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: "0.925rem",
              cursor: "pointer",
            }}
          >
            All Tracks ({domains.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "10px 4px",
              border: "none",
              borderBottom: activeTab === "pending" ? "2.5px solid #d97706" : "2.5px solid transparent",
              background: "transparent",
              color: activeTab === "pending" ? "#d97706" : "#64748b",
              fontWeight: 700,
              fontSize: "0.925rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Review Queue</span>
            {pendingSubmissions.length > 0 && (
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: "999px",
                  fontSize: "0.72rem",
                  background: "#f59e0b",
                  color: "#ffffff",
                  fontWeight: 800,
                }}
              >
                {pendingSubmissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("articles")}
            style={{
              padding: "10px 4px",
              border: "none",
              borderBottom: activeTab === "articles" ? "2.5px solid #2563eb" : "2.5px solid transparent",
              background: "transparent",
              color: activeTab === "articles" ? "#2563eb" : "#64748b",
              fontWeight: 700,
              fontSize: "0.925rem",
              cursor: "pointer",
            }}
          >
            Domain Articles &amp; Guides
          </button>
        </div>

        {/* ============================================================
            4. TAB 1: ALL DOMAINS LIST
            ============================================================ */}
        {activeTab === "domains" && (
          <div>
            {/* Filters Bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
                alignItems: "center",
              }}
            >
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 240px", minWidth: "220px" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search by track name, skills, tech..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  background: "#ffffff",
                }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  background: "#ffffff",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="PENDING">Pending Review</option>
                <option value="UNPUBLISHED">Unpublished</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  background: "#ffffff",
                }}
              >
                <option value="all">All Sources</option>
                <option value="admin">Admin Created</option>
                <option value="alumni">Alumni Submitted</option>
              </select>
            </div>

            {/* Domains Table */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                    <th style={{ padding: "14px 18px" }}>Track Name &amp; Slug</th>
                    <th style={{ padding: "14px 18px" }}>Category</th>
                    <th style={{ padding: "14px 18px" }}>Source</th>
                    <th style={{ padding: "14px 18px" }}>Market Demand</th>
                    <th style={{ padding: "14px 18px" }}>Roadmap</th>
                    <th style={{ padding: "14px 18px" }}>Status</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDomains ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                        <RefreshCw className="animate-spin text-blue-600" size={24} style={{ margin: "0 auto 8px" }} />
                        <p style={{ margin: 0 }}>Loading engineering tracks...</p>
                      </td>
                    </tr>
                  ) : domains.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                        <p style={{ fontWeight: 600, margin: 0 }}>No engineering tracks match the filter.</p>
                      </td>
                    </tr>
                  ) : (
                    domains.map((dom) => {
                      const isPending = dom.status === "PENDING";
                      const isPublished = dom.status === "PUBLISHED";
                      const isRejected = dom.status === "REJECTED";

                      return (
                        <tr
                          key={dom._id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background-color 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{dom.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: "monospace" }}>
                              /domains/{dom.slug}
                            </div>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              {dom.category}
                            </span>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            {dom.createdByRole === "alumni" ? (
                              <div>
                                <span
                                  style={{
                                    padding: "2px 7px",
                                    borderRadius: "4px",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                  }}
                                >
                                  ALUMNI
                                </span>
                                {dom.createdBy?.name && (
                                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                                    {dom.createdBy.name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  background: "#f5f3ff",
                                  color: "#7c3aed",
                                }}
                              >
                                ADMIN
                              </span>
                            )}
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#059669", fontWeight: 600, fontSize: "0.8rem" }}>
                              <TrendingUp size={13} />
                              <span>{dom.marketDemand || "High"}</span>
                            </div>
                            {dom.salaryRange && (
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{dom.salaryRange}</div>
                            )}
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#475569",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <CheckCircle size={13} className="text-emerald-600" />
                              <span>3 Tiers Configured</span>
                            </span>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                padding: "4px 9px",
                                borderRadius: "999px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                display: "inline-block",
                                background: isPublished
                                  ? "#f0fdf4"
                                  : isPending
                                  ? "#fffbeb"
                                  : isRejected
                                  ? "#fef2f2"
                                  : "#f1f5f9",
                                color: isPublished
                                  ? "#166534"
                                  : isPending
                                  ? "#b45309"
                                  : isRejected
                                  ? "#dc2626"
                                  : "#475569",
                                border: isPublished
                                  ? "1px solid #bbf7d0"
                                  : isPending
                                  ? "1px solid #fde68a"
                                  : isRejected
                                  ? "1px solid #fecaca"
                                  : "1px solid #e2e8f0",
                              }}
                            >
                              {dom.status}
                            </span>
                          </td>

                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              {/* Public link preview */}
                              <Link
                                to={`/domains/${dom.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid #e2e8f0",
                                  background: "#ffffff",
                                  color: "#64748b",
                                  display: "inline-flex",
                                }}
                                title="Preview Track Page"
                              >
                                <ExternalLink size={14} />
                              </Link>

                              {/* If pending, direct review options */}
                              {isPending ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(dom)}
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      border: "none",
                                      background: "#16a34a",
                                      color: "#ffffff",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                    title="Approve & Publish"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openRejectModal(dom)}
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      border: "1px solid #fca5a5",
                                      background: "#fef2f2",
                                      color: "#dc2626",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                    title="Reject with Feedback"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(dom)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #e2e8f0",
                                    background: "#ffffff",
                                    color: isPublished ? "#dc2626" : "#16a34a",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  {isPublished ? "Unpublish" : "Publish"}
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEditModal(dom)}
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid #e2e8f0",
                                  background: "#ffffff",
                                  color: "#2563eb",
                                  cursor: "pointer",
                                }}
                                title="Edit Domain & Roadmap"
                              >
                                <Edit size={14} />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => openDeleteModal(dom)}
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid #fecaca",
                                  background: "#ffffff",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                }}
                                title="Delete Domain"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================
            5. TAB 2: PENDING ALUMNI SUBMISSIONS QUEUE
            ============================================================ */}
        {activeTab === "pending" && (
          <div>
            {pendingSubmissions.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <CheckCircle size={44} className="text-emerald-600" style={{ margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                  Review Queue is Clear!
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
                  There are currently no domain suggestions waiting for administrator review.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                {pendingSubmissions.map((dom) => (
                  <div
                    key={dom._id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      border: "1.5px solid #f59e0b",
                      padding: "24px",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: "#eff6ff",
                              color: "#2563eb",
                            }}
                          >
                            {dom.category}
                          </span>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: "#fffbeb",
                              color: "#d97706",
                            }}
                          >
                            PENDING EDITORIAL APPROVAL
                          </span>
                        </div>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "8px 0 4px" }}>
                          {dom.name}
                        </h3>
                        <p style={{ fontSize: "0.825rem", color: "#64748b", margin: 0 }}>
                          Submitted by <strong>{dom.createdBy?.name || "Alumni Contributor"}</strong> ({dom.createdBy?.email || "Alumni"}) on{" "}
                          {new Date(dom.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleApprove(dom)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#16a34a",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={16} />
                          <span>Approve &amp; Publish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(dom)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#334155",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          <Edit size={15} />
                          <span>Edit Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openRejectModal(dom)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          <X size={16} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "16px" }}>
                      {dom.description || dom.shortDescription}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>CAREER ROLES</div>
                        <div style={{ fontSize: "0.85rem", color: "#1e293b", marginTop: "2px" }}>
                          {(dom.careerRoles || []).join(", ") || "None specified"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>SKILLS &amp; TECH</div>
                        <div style={{ fontSize: "0.85rem", color: "#1e293b", marginTop: "2px" }}>
                          {(dom.technologies || dom.skills || []).join(", ") || "None specified"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>TOOLS &amp; PLATFORMS</div>
                        <div style={{ fontSize: "0.85rem", color: "#1e293b", marginTop: "2px" }}>
                          {(dom.tools || []).join(", ") || "None specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            6. TAB 3: DOMAIN ARTICLES & GUIDES
            ============================================================ */}
        {activeTab === "articles" && (
          <div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 240px" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search articles by title, tags..."
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <select
                value={articleDomainFilter}
                onChange={(e) => setArticleDomainFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  background: "#ffffff",
                }}
              >
                <option value="all">All Domains</option>
                {domains.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                    <th style={{ padding: "14px 18px" }}>Article Title</th>
                    <th style={{ padding: "14px 18px" }}>Linked Domain</th>
                    <th style={{ padding: "14px 18px" }}>Author</th>
                    <th style={{ padding: "14px 18px" }}>Views</th>
                    <th style={{ padding: "14px 18px" }}>Status</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingArticles ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                        <RefreshCw className="animate-spin text-blue-600" size={24} style={{ margin: "0 auto 8px" }} />
                        <p style={{ margin: 0 }}>Loading domain articles...</p>
                      </td>
                    </tr>
                  ) : articles.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                        <p style={{ fontWeight: 600, margin: 0 }}>No domain articles found.</p>
                      </td>
                    </tr>
                  ) : (
                    articles.map((art) => (
                      <tr key={art._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px", fontWeight: 600, color: "#0f172a" }}>
                          {art.title}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "#eff6ff",
                              color: "#2563eb",
                            }}
                          >
                            {art.domain || "General"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", color: "#64748b" }}>
                          {art.author?.name || "Community Author"}
                        </td>
                        <td style={{ padding: "14px 18px", color: "#64748b" }}>
                          {art.views || 0}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: art.status === "published" ? "#f0fdf4" : "#f1f5f9",
                              color: art.status === "published" ? "#166534" : "#64748b",
                            }}
                          >
                            {art.status || "published"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <Link
                            to={`/blog/${art.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#2563eb",
                              textDecoration: "none",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Eye size={13} />
                            <span>Read</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================
            7. CREATE / EDIT DOMAIN MODAL
            ============================================================ */}
        {domainModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div
              className="modal-content"
              style={{
                maxWidth: "760px",
                width: "92%",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "16px",
                padding: "28px",
                background: "#ffffff",
                boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {domainModalMode === "add" ? "Create New Engineering Track" : `Edit Track: ${selectedDomain?.name}`}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0" }}>
                    Configure the learning roadmap, competencies, market salary, and projects for this domain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDomainModalOpen(false)}
                  style={{ border: "none", background: "#f8fafc", padding: "6px", borderRadius: "8px", cursor: "pointer" }}
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Modal Step/Tab Selector */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                {[
                  { id: "details", label: "1. Overview & Market" },
                  { id: "skills", label: "2. Skills & Toolchain" },
                  { id: "roadmap", label: "3. 3-Tier Roadmap" },
                  { id: "projects", label: "4. Practical Projects" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDomainModalTab(t.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: domainModalTab === t.id ? "#eff6ff" : "transparent",
                      color: domainModalTab === t.id ? "#2563eb" : "#64748b",
                      fontWeight: domainModalTab === t.id ? 700 : 500,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleDomainSubmit}>
                {/* Tab 1: Details */}
                {domainModalTab === "details" && (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "14px" }}>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Track Name *</label>
                        <input
                          type="text"
                          value={domainForm.name}
                          onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
                          placeholder="e.g. MERN Stack Development"
                          required
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Category *</label>
                        <select
                          value={domainForm.category}
                          onChange={(e) => setDomainForm({ ...domainForm, category: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Short Summary (Card Preview) *</label>
                      <input
                        type="text"
                        value={domainForm.shortDescription}
                        onChange={(e) => setDomainForm({ ...domainForm, shortDescription: e.target.value })}
                        placeholder="Comprehensive roadmap covering React, Node.js, Express, and MongoDB."
                        required
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Full Overview &amp; Industry Scope</label>
                      <textarea
                        rows={3}
                        value={domainForm.description}
                        onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })}
                        placeholder="In-depth explanation of the track, architecture patterns, and what learners will master..."
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Salary Range</label>
                        <input
                          type="text"
                          value={domainForm.salaryRange}
                          onChange={(e) => setDomainForm({ ...domainForm, salaryRange: e.target.value })}
                          placeholder="$80,000 - $140,000"
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Market Demand</label>
                        <select
                          value={domainForm.marketDemand}
                          onChange={(e) => setDomainForm({ ...domainForm, marketDemand: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="Very High">Very High</option>
                          <option value="High">High</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Emerging">Emerging</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Publication Status</label>
                        <select
                          value={domainForm.status}
                          onChange={(e) => setDomainForm({ ...domainForm, status: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="PUBLISHED">Published (Public)</option>
                          <option value="UNPUBLISHED">Unpublished (Draft)</option>
                          <option value="PENDING">Pending Review</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Skills */}
                {domainModalTab === "skills" && (
                  <div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Career Roles (comma-separated)</label>
                      <input
                        type="text"
                        value={domainForm.careerRoles}
                        onChange={(e) => setDomainForm({ ...domainForm, careerRoles: e.target.value })}
                        placeholder="Full Stack Developer, MERN Specialist, Backend Engineer"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Core Technologies (comma-separated)</label>
                      <input
                        type="text"
                        value={domainForm.technologies}
                        onChange={(e) => setDomainForm({ ...domainForm, technologies: e.target.value })}
                        placeholder="React, Node.js, Express, MongoDB, TypeScript"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Key Competencies &amp; Skills (comma-separated)</label>
                      <input
                        type="text"
                        value={domainForm.skills}
                        onChange={(e) => setDomainForm({ ...domainForm, skills: e.target.value })}
                        placeholder="RESTful APIs, JWT Auth, State Management, Database Indexing"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Tools &amp; Platforms (comma-separated)</label>
                      <input
                        type="text"
                        value={domainForm.tools}
                        onChange={(e) => setDomainForm({ ...domainForm, tools: e.target.value })}
                        placeholder="Postman, Git, VS Code, Docker, GitHub Actions"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Roadmap */}
                {domainModalTab === "roadmap" && (
                  <div>
                    {/* Beginner Tier */}
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Tier 1: Beginner Roadmap</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "#64748b" }}>Duration</label>
                          <input
                            type="text"
                            value={domainForm.beginnerDuration}
                            onChange={(e) => setDomainForm({ ...domainForm, beginnerDuration: e.target.value })}
                            placeholder="1-2 Months"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "#64748b" }}>Topics (comma-separated)</label>
                          <input
                            type="text"
                            value={domainForm.beginnerTopics}
                            onChange={(e) => setDomainForm({ ...domainForm, beginnerTopics: e.target.value })}
                            placeholder="Syntax, DOM, Git, Basic APIs"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Intermediate Tier */}
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Tier 2: Intermediate Roadmap</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "#64748b" }}>Duration</label>
                          <input
                            type="text"
                            value={domainForm.intermediateDuration}
                            onChange={(e) => setDomainForm({ ...domainForm, intermediateDuration: e.target.value })}
                            placeholder="2-3 Months"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "#64748b" }}>Topics (comma-separated)</label>
                          <input
                            type="text"
                            value={domainForm.intermediateTopics}
                            onChange={(e) => setDomainForm({ ...domainForm, intermediateTopics: e.target.value })}
                            placeholder="Express Routing, Mongoose, State Management, JWT Auth"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced Tier */}
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Tier 3: Advanced Roadmap</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "#64748b" }}>Duration</label>
                          <input
                            type="text"
                            value={domainForm.advancedDuration}
                            onChange={(e) => setDomainForm({ ...domainForm, advancedDuration: e.target.value })}
                            placeholder="3-4 Months"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "#64748b" }}>Topics (comma-separated)</label>
                          <input
                            type="text"
                            value={domainForm.advancedTopics}
                            onChange={(e) => setDomainForm({ ...domainForm, advancedTopics: e.target.value })}
                            placeholder="Microservices, Redis Caching, Docker, Production CI/CD"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Projects */}
                {domainModalTab === "projects" && (
                  <div>
                    {/* Project 1 */}
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Project 1</div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "8px" }}>
                        <input
                          type="text"
                          value={domainForm.proj1Title}
                          onChange={(e) => setDomainForm({ ...domainForm, proj1Title: e.target.value })}
                          placeholder="Project Title"
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <select
                          value={domainForm.proj1Difficulty}
                          onChange={(e) => setDomainForm({ ...domainForm, proj1Difficulty: e.target.value })}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={domainForm.proj1Desc}
                        onChange={(e) => setDomainForm({ ...domainForm, proj1Desc: e.target.value })}
                        placeholder="Brief project description and core learning objective..."
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    {/* Project 2 */}
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Project 2</div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "8px" }}>
                        <input
                          type="text"
                          value={domainForm.proj2Title}
                          onChange={(e) => setDomainForm({ ...domainForm, proj2Title: e.target.value })}
                          placeholder="Project Title"
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <select
                          value={domainForm.proj2Difficulty}
                          onChange={(e) => setDomainForm({ ...domainForm, proj2Difficulty: e.target.value })}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={domainForm.proj2Desc}
                        onChange={(e) => setDomainForm({ ...domainForm, proj2Desc: e.target.value })}
                        placeholder="Brief project description and core learning objective..."
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "20px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "16px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDomainModalOpen(false)}
                    disabled={modalLoading}
                    style={{
                      padding: "9px 18px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    style={{
                      padding: "9px 24px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {modalLoading ? "Saving Track..." : domainModalMode === "add" ? "Publish Domain" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================
            8. REJECTION FEEDBACK MODAL
            ============================================================ */}
        {rejectModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div
              className="modal-content"
              style={{
                maxWidth: "500px",
                width: "90%",
                borderRadius: "16px",
                padding: "24px",
                background: "#ffffff",
                boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#dc2626" }}>
                <AlertTriangle size={22} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Reject Proposal</h3>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 16px" }}>
                Please provide actionable feedback explaining why this proposal was rejected so the alumni author can improve it.
              </p>

              <form onSubmit={handleRejectSubmit}>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Please add more specific details on the learning milestones, or align with existing cloud track curriculum..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    marginBottom: "20px",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    disabled={rejectLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rejectLoading}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#dc2626",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {rejectLoading ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================
            9. DELETE CONFIRMATION MODAL
            ============================================================ */}
        {deleteModalOpen && deleteTarget && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div
              className="modal-content"
              style={{
                maxWidth: "460px",
                width: "90%",
                borderRadius: "16px",
                padding: "24px",
                background: "#ffffff",
                boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#dc2626" }}>
                <Trash2 size={22} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Delete Engineering Track</h3>
              </div>
              <p style={{ fontSize: "0.9rem", color: "#334155", margin: "0 0 8px" }}>
                Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>?
              </p>
              <p style={{ fontSize: "0.825rem", color: "#64748b", margin: "0 0 20px" }}>
                This action cannot be undone and will be logged in the administrative audit history.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#dc2626",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {deleteLoading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDomainManagement;
