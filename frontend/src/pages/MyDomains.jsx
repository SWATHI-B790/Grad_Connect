import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MyDomains = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: "/my-domains", message: "Please log in to manage your curated domains." },
      });
      return;
    }
    fetchMyDomains();
  }, [user]);

  const fetchMyDomains = async () => {
    setLoading(true);
    try {
      const res = await API.get("/domains/my");
      if (res.data && Array.isArray(res.data.domains)) {
        setDomains(res.data.domains);
      }
    } catch (err) {
      console.error("Failed to fetch my domains:", err);
      setFeedback({
        type: "error",
        message: "Failed to load your curated tracks. Please refresh.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;
    setActionLoading(true);
    try {
      await API.delete(`/domains/${domainToDelete._id}`);
      setDomains(domains.filter((d) => d._id !== domainToDelete._id));
      setFeedback({
        type: "success",
        message: `Successfully deleted "${domainToDelete.name}".`,
      });
      setDeleteModalOpen(false);
      setDomainToDelete(null);
    } catch (err) {
      console.error("Delete domain error:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to delete domain.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDomains = domains.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q)) ||
      (d.shortDescription && d.shortDescription.toLowerCase().includes(q))
    );
  });

  const totalViews = domains.reduce((acc, d) => acc + (d.views || 0), 0);
  const totalPublished = domains.filter((d) => d.status === "PUBLISHED" || d.status === "published").length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1.25rem 4rem", width: "100%" }}>
        {/* Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: "2rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              My Curated Technical Tracks
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.95rem" }}>
              Manage and update your engineered roadmaps, learning tiers, and student-facing career tracks.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link
              to="/domains"
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <BookOpen size={16} />
              <span>Explore All Tracks</span>
            </Link>

            <Link
              to="/domains/create"
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              }}
            >
              <Plus size={16} />
              <span>Curate New Domain</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              background: feedback.type === "error" ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${feedback.type === "error" ? "#fecaca" : "#bbf7d0"}`,
              color: feedback.type === "error" ? "#dc2626" : "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.9rem",
            }}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback({ type: "", message: "" })}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 700 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {/* Total Curated */}
          <div
            style={{
              background: "#ffffff",
              padding: "1.5rem",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
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
              <Layers size={24} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                Curated Roadmaps
              </span>
              <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
                {domains.length}
              </span>
            </div>
          </div>

          {/* Published Tracks */}
          <div
            style={{
              background: "#ffffff",
              padding: "1.5rem",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                Live & Published
              </span>
              <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
                {totalPublished}
              </span>
            </div>
          </div>

          {/* Student Impressions / Views */}
          <div
            style={{
              background: "#ffffff",
              padding: "1.5rem",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Eye size={24} />
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                Total Views
              </span>
              <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
                {totalViews}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          {/* Table Header & Search */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="Search tracks by name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 40px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>

            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
              Showing {filteredDomains.length} of {domains.length} tracks
            </span>
          </div>

          {/* List or Table */}
          {loading ? (
            <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#64748b" }}>
              <div className="spinner" style={{ margin: "0 auto 12px auto" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Loading your curated domains...</p>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                }}
              >
                <Layers size={28} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>
                {searchQuery ? "No matching tracks found" : "No curated domains yet"}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "420px", margin: "0 auto 1.5rem auto" }}>
                {searchQuery
                  ? "Try adjusting your search keywords."
                  : "Help current students by creating an engineering learning roadmap for your field."}
              </p>
              {!searchQuery && (
                <Link
                  to="/domains/create"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 22px",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                  }}
                >
                  <Plus size={16} />
                  <span>Curate First Track</span>
                </Link>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                    <th style={{ padding: "12px 18px", fontWeight: 700 }}>Domain Track</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700 }}>Category</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700 }}>Level & Tiers</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700 }}>Views</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700 }}>Updated</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ divideY: "1px solid #e2e8f0" }}>
                  {filteredDomains.map((domain) => (
                    <tr
                      key={domain._id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Domain Name & Slug */}
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                          {domain.name}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "2px" }}>
                          /domains/{domain.slug}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "16px 18px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "#eff6ff",
                            color: "#1e40af",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        >
                          {domain.category}
                        </span>
                      </td>

                      {/* Difficulty & Roadmap Tiers */}
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontWeight: 600, color: "#334155" }}>
                            {domain.difficultyLevel || "Intermediate"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {domain.roadmap?.length || 3} Learning Tiers
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              domain.status === "PUBLISHED" || domain.status === "published"
                                ? "#dcfce7"
                                : "#fef3c7",
                            color:
                              domain.status === "PUBLISHED" || domain.status === "published"
                                ? "#15803d"
                                : "#92400e",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "currentColor",
                            }}
                          />
                          {domain.status}
                        </span>
                      </td>

                      {/* Views */}
                      <td style={{ padding: "16px 18px", color: "#334155", fontWeight: 600 }}>
                        {domain.views || 0}
                      </td>

                      {/* Updated Date */}
                      <td style={{ padding: "16px 18px", color: "#64748b", fontSize: "0.8rem" }}>
                        {new Date(domain.updatedAt || domain.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          {/* View Roadmap */}
                          <Link
                            to={`/domains/${domain.slug}`}
                            title="View Public Roadmap"
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#2563eb",
                              display: "inline-flex",
                              alignItems: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            <ExternalLink size={14} />
                          </Link>

                          {/* Edit */}
                          <Link
                            to={`/domains/edit/${domain._id}`}
                            title="Edit Roadmap & Skills"
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#0f172a",
                              display: "inline-flex",
                              alignItems: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            <Edit size={14} />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete Domain"
                            onClick={() => {
                              setDomainToDelete(domain);
                              setDeleteModalOpen(true);
                            }}
                            style={{
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #fecaca",
                              background: "#fff5f5",
                              color: "#ef4444",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && domainToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            padding: "1rem",
          }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              padding: "28px 24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e2e8f0",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <h3
              style={{
                fontFamily: "'Fraunces', serif, Georgia",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 10px 0",
              }}
            >
              Delete Technical Domain?
            </h3>

            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 20px 0" }}>
              Are you sure you want to permanently delete <strong>"{domainToDelete.name}"</strong>? This will remove all associated roadmap tiers and resources for students.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "999px",
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
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteDomain}
                style={{
                  padding: "10px 22px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                }}
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyDomains;
