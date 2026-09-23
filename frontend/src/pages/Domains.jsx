import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderSearch,
  Search,
  RefreshCw,
  AlertTriangle,
  Layers,
  ArrowRight,
  Filter,
  Check,
  X,
  BookOpen,
  Users,
  Code2,
  Sparkles,
  Compass,
  Cpu,
  Cloud,
  Shield,
  Palette,
  Smartphone,
  Database,
  TrendingUp,
  PlusCircle,
  Award,
  ExternalLink,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import DomainResourceCard from "../components/DomainResourceCard";
import SkeletonCard from "../components/SkeletonCard";
import SuggestDomainModal from "../components/SuggestDomainModal";
import Footer from "../components/Footer";

// Helper to choose the best icon for each domain category / title
const getDomainIcon = (domain) => {
  const cat = (domain.category || "").toLowerCase();
  const name = (domain.name || "").toLowerCase();

  if (cat.includes("ai") || cat.includes("data") || name.includes("machine learning") || name.includes("llm")) {
    return Cpu;
  }
  if (cat.includes("cloud") || name.includes("cloud") || name.includes("aws")) {
    return Cloud;
  }
  if (name.includes("devops") || name.includes("ci/cd")) {
    return Layers;
  }
  if (cat.includes("security") || name.includes("cyber") || name.includes("hacking")) {
    return Shield;
  }
  if (cat.includes("design") || name.includes("ui/ux") || name.includes("figma")) {
    return Palette;
  }
  if (cat.includes("mobile") || name.includes("flutter") || name.includes("react native") || name.includes("android") || name.includes("ios")) {
    return Smartphone;
  }
  if (name.includes("database") || name.includes("sql") || name.includes("mongo")) {
    return Database;
  }
  return Code2;
};

// Accent styles per category
const getDomainCategoryStyle = (category = "") => {
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

const Domains = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamic Domain Data
  const [domains, setDomains] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);

  // Filters & State (Use "all" as consistent base representation)
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeDomain, setActiveDomain] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);

  // Resources Feed State (Articles for active domain)
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [totalResources, setTotalResources] = useState(0);

  const isAlumniOrAdmin =
    user?.role === "alumni" ||
    user?.userType === "Alumni" ||
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    user?.role === "subadmin";

  // 1. Fetch live published domains & category summary
  const fetchLiveDomains = async () => {
    setLoadingDomains(true);
    try {
      const [domainsRes, summaryRes] = await Promise.all([
        API.get("/domains"),
        API.get("/domains/categories/summary").catch(() => ({ data: { categories: [] } })),
      ]);

      if (domainsRes.data && Array.isArray(domainsRes.data.domains)) {
        setDomains(domainsRes.data.domains);
      }
      if (summaryRes.data && Array.isArray(summaryRes.data.categories)) {
        setCategoriesSummary(summaryRes.data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch live domains:", err);
    } finally {
      setLoadingDomains(false);
    }
  };

  useEffect(() => {
    fetchLiveDomains();
  }, []);

  // 2. Stable, normalized categories structure
  const categories = useMemo(() => {
    const list = [
      {
        id: "all",
        label: "All Tracks",
        value: "all",
        count: domains.length,
      },
    ];

    // Build count map from loaded domains
    const domainCountMap = {};
    domains.forEach((d) => {
      const cat = (d.category || "").trim();
      if (cat) {
        domainCountMap[cat] = (domainCountMap[cat] || 0) + 1;
      }
    });

    const seen = new Set(["all"]);

    // 1. Incorporate categories from backend summary
    if (Array.isArray(categoriesSummary)) {
      categoriesSummary.forEach((item) => {
        const rawName = item.name || item.label || item.category || item.value || item.id;
        if (rawName && typeof rawName === "string") {
          const name = rawName.trim();
          const key = name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              id: name,
              label: name,
              value: name,
              count: item.count !== undefined ? item.count : (domainCountMap[name] || 0),
            });
          }
        }
      });
    }

    // 2. Incorporate any category directly present on loaded domains
    Object.entries(domainCountMap).forEach(([catName, count]) => {
      const key = catName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: catName,
          label: catName,
          value: catName,
          count,
        });
      }
    });

    return list;
  }, [categoriesSummary, domains]);

  // 3. Sync URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const domainParam = params.get("domain");
    const categoryParam = params.get("category");
    const searchParam = params.get("search");

    if (domainParam) {
      setActiveDomain(domainParam);
    } else {
      setActiveDomain("All");
    }

    if (categoryParam && categoryParam.trim()) {
      const clean = categoryParam.trim();
      if (clean.toLowerCase() === "all" || clean.toLowerCase() === "all tracks") {
        setSelectedCategory("all");
      } else {
        setSelectedCategory(clean);
      }
    } else {
      setSelectedCategory("all");
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  // 4. Automatically reset invalid filters if category does not exist
  useEffect(() => {
    if (
      !loadingDomains &&
      selectedCategory !== "all" &&
      categories.length > 1 &&
      !categories.some(
        (c) =>
          c.id.toLowerCase() === selectedCategory.toLowerCase() ||
          c.value.toLowerCase() === selectedCategory.toLowerCase() ||
          c.label.toLowerCase() === selectedCategory.toLowerCase()
      )
    ) {
      setSelectedCategory("all");
      const params = new URLSearchParams(location.search);
      if (params.has("category")) {
        params.delete("category");
        const query = params.toString();
        navigate(`/domains${query ? `?${query}` : ""}`, { replace: true });
      }
    }
  }, [categories, selectedCategory, loadingDomains, location.search, navigate]);

  // 5. Fetch articles for active domain feed
  useEffect(() => {
    const fetchArticles = async () => {
      setLoadingResources(true);
      try {
        let url = `/blogs?page=1&limit=6`;
        if (activeDomain && activeDomain !== "All") {
          url += `&domain=${encodeURIComponent(activeDomain)}`;
        }
        const res = await API.get(url);
        setResources(res.data.blogs || []);
        setTotalResources(res.data.totalBlogs || (res.data.blogs || []).length);
      } catch (err) {
        console.error("Failed to fetch domain articles:", err);
      } finally {
        setLoadingResources(false);
      }
    };

    fetchArticles();
  }, [activeDomain]);

  // Handle Domain Selection for Feed
  const handleDomainCardClick = (domainName) => {
    const next = activeDomain === domainName ? "All" : domainName;
    setActiveDomain(next);

    const params = new URLSearchParams(location.search);
    if (next !== "All") {
      params.set("domain", next);
    } else {
      params.delete("domain");
    }
    navigate(`/domains?${params.toString()}`, { replace: true });

    // Scroll to feed if domain selected
    if (next !== "All") {
      const feedEl = document.getElementById("domain-feed");
      if (feedEl) feedEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle Category Selection
  const handleCategorySelect = (categoryId) => {
    const next = !categoryId || categoryId.toLowerCase() === "all" ? "all" : categoryId;
    setSelectedCategory(next);

    const params = new URLSearchParams(location.search);
    if (next !== "all") {
      params.set("category", next);
    } else {
      params.delete("category");
    }
    const query = params.toString();
    navigate(`/domains${query ? `?${query}` : ""}`, { replace: true });
  };

  // Safe category label resolution
  const selectedCategoryObj = categories.find(
    (c) =>
      c.id.toLowerCase() === selectedCategory.toLowerCase() ||
      c.value.toLowerCase() === selectedCategory.toLowerCase() ||
      c.label.toLowerCase() === selectedCategory.toLowerCase()
  );

  const selectedCategoryLabel =
    selectedCategory === "all"
      ? "All Engineering"
      : selectedCategoryObj?.label || selectedCategory || "All Engineering";

  const headingTitle =
    selectedCategory === "all" || !selectedCategory || selectedCategory === "undefined"
      ? "All Engineering Tracks"
      : `${selectedCategoryLabel} Tracks`;

  // Filter Domains
  const filteredDomains = useMemo(() => {
    return domains.filter((d) => {
      // Category filter
      const trackCategory = (d.category || "").trim();
      const matchesCategory =
        selectedCategory === "all" ||
        trackCategory.toLowerCase() === selectedCategory.toLowerCase() ||
        d.categoryId === selectedCategory;

      if (!matchesCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inName = (d.name || "").toLowerCase().includes(query);
        const inDesc = (d.shortDescription || "").toLowerCase().includes(query);
        const inSkills = (d.skills || []).some((s) => s.toLowerCase().includes(query));
        const inTech = (d.technologies || []).some((t) => t.toLowerCase().includes(query));
        const inRoles = (d.careerRoles || []).some((r) => r.toLowerCase().includes(query));
        return inName || inDesc || inSkills || inTech || inRoles;
      }
      return true;
    });
  }, [domains, selectedCategory, searchQuery]);

  return (
    <div className="domains-page">
      <div className="domain-page-container">
        {/* ============================================================
            1. HERO SECTION
            ============================================================ */}
        <section className="domains-hero-wrapper">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="domains-eyebrow-pill"
          >
            <FolderSearch size={14} className="text-blue-600" />
            <span>VERIFIED ENGINEERING DOMAINS &amp; ROADMAPS</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="domains-page-title"
          >
            Explore Technical Domains
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="domains-page-subtitle"
          >
            Industry tracks, 3-tier progressive learning roadmaps, required skills, and hands-on guidance curated by GradConnect engineers and alumni.
          </motion.p>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.2 }}
            className="domains-stats-bar"
          >
            <div className="domains-stat-item">
              <Layers size={16} className="text-blue-600" />
              <span><strong>{domains.length || 8}</strong> Technical Tracks</span>
            </div>
            <div className="domains-stat-divider" />
            <div className="domains-stat-item">
              <Award size={16} className="text-amber-600" />
              <span><strong>3-Tier</strong> Roadmaps</span>
            </div>
            <div className="domains-stat-divider" />
            <div className="domains-stat-item">
              <Users size={16} className="text-emerald-600" />
              <span><strong>Admin &amp; Alumni</strong> Curated</span>
            </div>
          </motion.div>

          {/* Alumni Contribution Button */}
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate("/login");
                } else {
                  setSuggestModalOpen(true);
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 20px",
                background: "#ffffff",
                border: "1.5px solid #cbd5e1",
                borderRadius: "999px",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.color = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.color = "#1e293b";
              }}
            >
              <PlusCircle size={16} className="text-blue-600" />
              <span>{isAlumniOrAdmin ? "Suggest a Technical Domain" : "Alumni: Propose a Domain Track"}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="domains-search-container" style={{ marginTop: "1.75rem" }}>
            <div className="domains-search-box">
              <Search size={19} className="domains-search-icon" />
              <input
                type="text"
                placeholder="Search tracks by name, technologies, or skills (e.g. React, Cloud, AI)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="domains-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="domains-search-clear-btn"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================
            2. CATEGORY PILL FILTER TABS
            ============================================================ */}
        <section style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {categories.map((cat) => {
              const isActive =
                selectedCategory === "all"
                  ? cat.id === "all"
                  : selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
                    selectedCategory.toLowerCase() === cat.value.toLowerCase();

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 18px",
                    borderRadius: "999px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: isActive ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
                    background: isActive ? "#2563eb" : "#ffffff",
                    color: isActive ? "#ffffff" : "#334155",
                    boxShadow: isActive
                      ? "0 4px 12px rgba(37, 99, 235, 0.25)"
                      : "0 1px 3px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.18s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.color = "#0f172a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.background = "#ffffff";
                      e.currentTarget.style.color = "#334155";
                    }
                  }}
                >
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "999px",
                      background: isActive ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#64748b",
                      lineHeight: 1.2,
                    }}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            3. TECHNICAL DOMAIN GRID
            ============================================================ */}
        <section className="domains-grid-section">
          <div className="domains-section-header">
            <h2 className="domains-section-title">
              {headingTitle}
            </h2>
            <p className="domains-section-intro">
              Select any track to view its comprehensive 3-tier roadmap, required toolchain, and verified articles.
            </p>
          </div>

          {loadingDomains ? (
            <div className="domain-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredDomains.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3.5rem 1rem",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px dashed #cbd5e1",
              }}
            >
              <Compass size={40} className="text-slate-400" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
                No engineering tracks found
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 16px" }}>
                Try adjusting your search terms or category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  handleCategorySelect("all");
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="domain-grid">
              {filteredDomains.map((domain, idx) => {
                const IconComponent = getDomainIcon(domain);
                const catStyle = getDomainCategoryStyle(domain.category);
                const isSelected = activeDomain === domain.name;

                return (
                  <motion.div
                    key={domain._id || domain.slug}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.22, delay: (idx % 8) * 0.03 }}
                    onClick={() => handleDomainCardClick(domain.name)}
                    className={`domain-card ${isSelected ? "selected-domain-card" : ""}`}
                    style={{
                      "--domain-accent": catStyle.color,
                      "--domain-bg": catStyle.bg,
                      "--domain-border": catStyle.border,
                      cursor: "pointer",
                    }}
                  >
                    <div className="domain-card-content">
                      {/* Header Row: Icon + Category Badge */}
                      <div className="domain-card-header">
                        <div
                          className="domain-card-icon-box"
                          style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                        >
                          <IconComponent size={22} />
                        </div>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: catStyle.bg,
                            color: catStyle.color,
                            border: `1px solid ${catStyle.border}`,
                          }}
                        >
                          {domain.category}
                        </span>
                      </div>

                      {/* Domain Title */}
                      <h3 className="domain-card-title">{domain.name}</h3>

                      {/* Market Demand Pill */}
                      {domain.marketDemand && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: "#059669",
                            marginBottom: "8px",
                          }}
                        >
                          <TrendingUp size={13} />
                          <span>{domain.marketDemand} Demand</span>
                          {domain.salaryRange && (
                            <span style={{ color: "#64748b" }}>• {domain.salaryRange}</span>
                          )}
                        </div>
                      )}

                      {/* Short Description */}
                      <p className="domain-card-desc">{domain.shortDescription}</p>

                      {/* Top Skills / Tech Pills */}
                      {Array.isArray(domain.technologies) && domain.technologies.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                            marginBottom: "12px",
                          }}
                        >
                          {domain.technologies.slice(0, 3).map((tech) => (
                            <span
                              key={tech}
                              style={{
                                fontSize: "0.7rem",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: "#f1f5f9",
                                color: "#475569",
                                fontWeight: 500,
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                          {domain.technologies.length > 3 && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                color: "#94a3b8",
                              }}
                            >
                              +{domain.technologies.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom Action Section with Link to /domains/:slug */}
                      <div className="domain-card-action">
                        <Link
                          to={`/domains/${domain.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "#2563eb",
                            fontWeight: 700,
                            textDecoration: "none",
                            fontSize: "0.825rem",
                          }}
                        >
                          <span>Explore Roadmap</span>
                          <ArrowRight size={14} className="domain-arrow-icon" />
                        </Link>

                        {isSelected && (
                          <span className="domain-active-check" title="Active Filter">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ============================================================
            4. SELECTED DOMAIN / COMMUNITY ARTICLES FEED SECTION
            ============================================================ */}
        <section id="domain-feed" className="domains-feed-wrapper">
          <div className="domains-feed-section-header">
            <div className="domains-feed-title-box">
              <div className="domains-feed-heading-row">
                <BookOpen size={20} className="text-blue-600" />
                <h3>
                  {activeDomain === "All"
                    ? "Technical Articles & Guides"
                    : `${activeDomain} Articles & Guides`}
                </h3>
                <span className="domains-resource-counter-badge">
                  {activeDomain === "All"
                    ? `Showing ${totalResources} resources`
                    : `${totalResources} resources in ${activeDomain}`}
                </span>
              </div>
              <p className="domains-feed-desc-text">
                {activeDomain === "All"
                  ? "Read real-world architecture case studies, interview walkthroughs, and roadmaps shared by our verified community."
                  : `Browse technical guides, interview experiences, and project architecture tutorials tagged under ${activeDomain}.`}
              </p>
            </div>

            {activeDomain !== "All" && (
              <button
                type="button"
                onClick={() => handleDomainCardClick(activeDomain)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear Domain Filter
              </button>
            )}
          </div>

          {loadingResources ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                color: "#64748b",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.95rem" }}>
                No community articles found for this track yet.
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>
                Are you working in this domain? Share your knowledge by contributing a technical article!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {resources.map((res, idx) => (
                <DomainResourceCard key={res._id} resource={res} index={idx} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Suggest Domain Modal */}
      <SuggestDomainModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        onSuccess={() => {
          fetchLiveDomains();
        }}
      />

      <Footer />
    </div>
  );
};

export default Domains;
