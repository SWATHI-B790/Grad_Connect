import React, { useState } from "react";
import { X, Send, Sparkles, CheckCircle2, AlertCircle, Info } from "lucide-react";
import API from "../api/axios";

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

const SuggestDomainModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "Development",
    shortDescription: "",
    description: "",
    careerRoles: "",
    skills: "",
    technologies: "",
    tools: "",
    salaryRange: "",
    marketDemand: "High",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please provide a domain name.");
      return;
    }
    if (!formData.shortDescription.trim()) {
      setError("Please provide a short description.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim() || formData.shortDescription.trim(),
        careerRoles: formData.careerRoles
          ? formData.careerRoles.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        skills: formData.skills
          ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        technologies: formData.technologies
          ? formData.technologies.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        tools: formData.tools
          ? formData.tools.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        salaryRange: formData.salaryRange.trim(),
        marketDemand: formData.marketDemand,
      };

      await API.post("/domains/suggest", payload);
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setFormData({
          name: "",
          category: "Development",
          shortDescription: "",
          description: "",
          careerRoles: "",
          skills: "",
          technologies: "",
          tools: "",
          salaryRange: "",
          marketDemand: "High",
        });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit domain suggestion. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: "640px",
          width: "92%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "16px",
          padding: "28px",
          background: "#ffffff",
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "16px",
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
                <Sparkles size={18} />
              </span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Suggest a Technical Domain
              </h2>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Share your industry expertise. Submissions are reviewed by administrators before going live.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#f8fafc",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              color: "#64748b",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div
            style={{
              padding: "36px 16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <CheckCircle2 size={48} className="text-emerald-600" />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Suggestion Submitted!
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", maxWidth: "400px", margin: 0 }}>
              Thank you for contributing to GradConnect! Our admin team will review your domain proposal shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "0.875rem",
                  marginBottom: "16px",
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Domain Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. DevSecOps & Cloud Security"
                  required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
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

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                Short Headline / Summary *
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="One-line summary for domain cards and search preview"
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                Detailed Overview & Industry Importance
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Explain what this engineering domain covers, why students should learn it, and typical job market relevance..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Target Career Roles (comma-separated)
                </label>
                <input
                  type="text"
                  name="careerRoles"
                  value={formData.careerRoles}
                  onChange={handleChange}
                  placeholder="DevOps Engineer, Cloud Architect"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Core Technologies (comma-separated)
                </label>
                <input
                  type="text"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleChange}
                  placeholder="AWS, Docker, Kubernetes, Terraform"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Core Skills (comma-separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="CI/CD, Infrastructure as Code, Linux"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Essential Tools (comma-separated)
                </label>
                <input
                  type="text"
                  name="tools"
                  value={formData.tools}
                  onChange={handleChange}
                  placeholder="Git, Prometheus, Grafana, Jenkins"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Typical Salary Range
                </label>
                <input
                  type="text"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  placeholder="e.g. $80,000 - $140,000"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Market Demand
                </label>
                <select
                  name="marketDemand"
                  value={formData.marketDemand}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Very High">Very High (High Volume)</option>
                  <option value="High">High (Strong Demand)</option>
                  <option value="Moderate">Moderate (Steady)</option>
                  <option value="Emerging">Emerging / Niche</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: "#64748b",
                marginBottom: "20px",
              }}
            >
              <Info size={16} className="text-blue-500" style={{ flexShrink: 0 }} />
              <span>
                As an alumnus, your proposal will be tagged with your profile and submitted to administrators for editorial review and learning roadmap validation.
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
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
                disabled={loading}
                style={{
                  padding: "9px 20px",
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
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Proposal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SuggestDomainModal;
