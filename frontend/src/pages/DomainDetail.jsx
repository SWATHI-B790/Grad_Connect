import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  Code2,
  Wrench,
  GraduationCap,
  FolderGit2,
  Share2,
  ChevronRight,
} from "lucide-react";
import API from "../api/axios";
import DomainResourceCard from "../components/DomainResourceCard";
import SkeletonCard from "../components/SkeletonCard";
import Footer from "../components/Footer";

const getCategoryBadgeStyle = (category = "") => {
  switch (category) {
    case "AI & Data":
      return { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" };
    case "Cloud & DevOps":
      return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    case "Cybersecurity":
      return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    case "Design":
      return { bg: "#fdf2f8", color: "#db2777", border: "#fbcfe8" };
    case "Mobile":
      return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
    case "Emerging Technology":
      return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
    case "Development":
    default:
      return { bg: "#f0fdfa", color: "#0d9488", border: "#99f6e4" };
  }
};

const DomainDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [domain, setDomain] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [communityStories, setCommunityStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRoadmapTier, setActiveRoadmapTier] = useState("beginner"); // 'beginner' | 'intermediate' | 'advanced'

  useEffect(() => {
    const fetchDomain = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get(`/domains/${slug}`);
        setDomain(res.data.domain);
        setRelatedArticles(res.data.relatedArticles || []);
        setCommunityStories(res.data.communityStories || []);
      } catch (err) {
        console.error("Failed to load domain detail:", err);
        setError(err.response?.data?.message || "Domain track not found.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchDomain();
  }, [slug]);

  if (loading) {
    return (
      <div className="domains-page" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <Sparkles className="animate-spin text-blue-600" size={36} style={{ margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600 }}>Loading domain track &amp; roadmaps...</p>
        </div>
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="domains-page">
        <div className="domain-page-container" style={{ textAlign: "center", padding: "5rem 1rem" }}>
          <Compass size={48} className="text-slate-400" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
            Domain Not Found
          </h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            The requested technical domain could not be located or may be pending review.
          </p>
          <Link
            to="/domains"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to All Tracks</span>
          </Link>
        </div>
      </div>
    );
  }

  const catBadge = getCategoryBadgeStyle(domain.category);
  const learningPath = domain.learningPath || {};

  return (
    <div className="domains-page" style={{ paddingTop: "5rem" }}>
      <div className="domain-page-container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/domains"
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
            <span>Back to All Technical Tracks</span>
          </Link>
        </div>

        {/* ============================================================
            1. HERO SECTION
            ============================================================ */}
        <section
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            borderRadius: "24px",
            padding: "3rem 2.5rem",
            marginBottom: "2.5rem",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.3)",
          }}
        >
          {/* Top badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: 700,
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                color: "#93c5fd",
                backdropFilter: "blur(4px)",
              }}
            >
              {domain.category}
            </span>

            {domain.marketDemand && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                <TrendingUp size={13} />
                <span>{domain.marketDemand} Market Demand</span>
              </span>
            )}

            {domain.salaryRange && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                <DollarSign size={13} />
                <span>Typical Compensation: {domain.salaryRange}</span>
              </span>
            )}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading, 'Fraunces', serif)",
              fontSize: "clamp(2.2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: "14px",
              color: "#ffffff",
            }}
          >
            {domain.name}
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.6,
              color: "#cbd5e1",
              maxWidth: "840px",
              marginBottom: "28px",
            }}
          >
            {domain.shortDescription}
          </p>

          {/* Quick Metrics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "16px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                Career Pathways
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>
                {(domain.careerRoles || []).length} Roles
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                Core Technologies
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>
                {(domain.technologies || []).length} Verified
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                Roadmap Depth
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#60a5fa", marginTop: "2px" }}>
                3-Tier Progressive
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>
                Community Guides
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>
                {relatedArticles.length + communityStories.length} Articles
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            2. TWO-COLUMN MAIN CONTENT: OVERVIEW & TOOLCHAIN
            ============================================================ */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
          {/* Left Column: Detailed Description */}
          <div
            style={{
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Compass size={20} className="text-blue-600" />
              <span>Track Overview &amp; Industry Scope</span>
            </h2>
            <p style={{ color: "#334155", lineHeight: 1.7, fontSize: "0.98rem", marginBottom: "20px" }}>
              {domain.description}
            </p>

            {/* Target Career Roles */}
            {Array.isArray(domain.careerRoles) && domain.careerRoles.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Briefcase size={18} className="text-indigo-600" />
                  <span>Target Career Roles</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  {domain.careerRoles.map((role) => (
                    <div
                      key={role}
                      style={{
                        padding: "10px 14px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Skills, Tech & Tools */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Tech Stack Box */}
            <div
              style={{
                background: "#ffffff",
                padding: "1.75rem",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Code2 size={18} className="text-blue-600" />
                <span>Technologies &amp; Frameworks</span>
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(domain.technologies || []).map((tech) => (
                  <span
                    key={tech}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Skills & Tools Box */}
            <div
              style={{
                background: "#ffffff",
                padding: "1.75rem",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Wrench size={18} className="text-slate-700" />
                <span>Essential Tools &amp; Platforms</span>
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(domain.tools || []).map((tool) => (
                  <span
                    key={tool}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            3. PROGRESSIVE 3-TIER LEARNING ROADMAP
            ============================================================ */}
        <section
          style={{
            background: "#ffffff",
            padding: "2.5rem",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            marginBottom: "3rem",
            boxShadow: "0 4px 16px -4px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              <GraduationCap size={14} />
              <span>Structured Skill Acquisition</span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading, 'Fraunces', serif)",
                fontSize: "1.85rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              3-Tier Progressive Learning Roadmap
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "6px" }}>
              Milestones designed to advance learners from core fundamentals to production architecture.
            </p>
          </div>

          {/* Tier Selector Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "2rem",
            }}
          >
            {[
              { id: "beginner", label: "Tier 1: Beginner", duration: learningPath.beginner?.duration || "1-2 Months" },
              { id: "intermediate", label: "Tier 2: Intermediate", duration: learningPath.intermediate?.duration || "2-3 Months" },
              { id: "advanced", label: "Tier 3: Advanced", duration: learningPath.advanced?.duration || "3-4 Months" },
            ].map((tier) => {
              const active = activeRoadmapTier === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setActiveRoadmapTier(tier.id)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "12px",
                    border: active ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: active ? "#eff6ff" : "#ffffff",
                    color: active ? "#1d4ed8" : "#475569",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{tier.label}</span>
                  <span style={{ fontSize: "0.72rem", color: active ? "#2563eb" : "#94a3b8", fontWeight: 500 }}>
                    <Clock size={11} style={{ display: "inline", marginRight: "3px" }} />
                    {tier.duration}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Tier Content Card */}
          {(() => {
            const currentTier = learningPath[activeRoadmapTier] || {};
            const topics = currentTier.topics || [];

            return (
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {currentTier.title || `${activeRoadmapTier.toUpperCase()} CURRICULUM`}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0" }}>
                      Estimated completion: <strong>{currentTier.duration || "Self-paced"}</strong>
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {topics.map((topic, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 16px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.9rem",
                        color: "#1e293b",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </section>

        {/* ============================================================
            4. PRACTICAL HANDS-ON PROJECTS
            ============================================================ */}
        {Array.isArray(domain.relatedProjects) && domain.relatedProjects.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background: "#f0fdf4",
                  color: "#166534",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                <FolderGit2 size={14} />
                <span>Portfolio Builders</span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-heading, 'Fraunces', serif)",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Recommended Hands-on Projects
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.925rem", marginTop: "4px" }}>
                Build these projects to demonstrate real-world competence to recruiters and hiring managers.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {domain.relatedProjects.map((proj, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {proj.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        fontWeight: 700,
                        background:
                          proj.difficulty === "Advanced"
                            ? "#fef2f2"
                            : proj.difficulty === "Intermediate"
                            ? "#fffbeb"
                            : "#eff6ff",
                        color:
                          proj.difficulty === "Advanced"
                            ? "#dc2626"
                            : proj.difficulty === "Intermediate"
                            ? "#d97706"
                            : "#2563eb",
                      }}
                    >
                      {proj.difficulty || "Project"}
                    </span>
                  </div>

                  <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "16px", flex: 1 }}>
                    {proj.description}
                  </p>

                  {Array.isArray(proj.skills) && proj.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {proj.skills.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: "0.72rem",
                            padding: "2px 8px",
                            background: "#f1f5f9",
                            borderRadius: "4px",
                            color: "#475569",
                            fontWeight: 500,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================
            5. RELATED TECHNICAL ARTICLES & COMMUNITY EXPERIENCES
            ============================================================ */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                <BookOpen size={14} />
                <span>Knowledge &amp; Field Experiences</span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-heading, 'Fraunces', serif)",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Community Guides &amp; Stories in {domain.name}
              </h2>
            </div>

            <Link
              to={`/blogs?domain=${encodeURIComponent(domain.name)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#2563eb",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span>View All Domain Articles</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {relatedArticles.length === 0 && communityStories.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px dashed #cbd5e1",
                color: "#64748b",
              }}
            >
              <BookOpen size={36} className="text-slate-400" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontWeight: 600, margin: 0 }}>
                No published articles linked to this domain yet.
              </p>
              <p style={{ fontSize: "0.85rem", margin: "6px 0 0" }}>
                Be the first to publish a technical guide or project walkthrough!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {[...relatedArticles, ...communityStories].slice(0, 6).map((item, idx) => (
                <DomainResourceCard key={item._id} resource={item} index={idx} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default DomainDetail;
