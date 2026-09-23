import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderSearch,
  Briefcase,
  Award,
  GraduationCap,
  Sparkles,
  Compass,
  Bell,
  Users,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import API from "../api/axios";

const CATEGORY_META = {
  "Career Advice": { icon: Briefcase, color: "#2563eb", bg: "rgba(37, 99, 235, 0.08)" },
  "Job Opportunity": { icon: Award, color: "#059669", bg: "rgba(5, 150, 105, 0.08)" },
  "Internship": { icon: GraduationCap, color: "#7c3aed", bg: "rgba(124, 58, 237, 0.08)" },
  "Alumni Achievement": { icon: Sparkles, color: "#d97706", bg: "rgba(217, 119, 6, 0.08)" },
  "Career Journey": { icon: Compass, color: "#0284c7", bg: "rgba(2, 132, 199, 0.08)" },
  "Announcement": { icon: Bell, color: "#ea580c", bg: "rgba(234, 88, 12, 0.08)" },
  "Mentorship": { icon: Users, color: "#10b981", bg: "rgba(16, 185, 129, 0.08)" },
  "Industry Insights": { icon: BookOpen, color: "#4f46e5", bg: "rgba(79, 70, 229, 0.08)" },
};

const CategoryCards = ({ onSelectCategory }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const response = await API.get("/blogs/categories");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Failed to fetch category counts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryCounts();
  }, []);

  const handleCardClick = (catName) => {
    navigate(`/domains?category=${encodeURIComponent(catName)}`);
  };

  return (
    <section className="section-categories">
      <div className="container">
        {/* Section Header */}
        <div className="section-header text-center mb-5">
          <span className="section-subtitle">
            <FolderSearch size={16} className="subtitle-icon" />
            <span>ALUMNI &amp; CAREER DOMAINS</span>
          </span>
          <h2 className="section-title center-title">
            Explore Professional Knowledge Areas <span className="animated-underline center-underline" />
          </h2>
          <p className="section-intro text-center max-w-2xl mx-auto">
            Browse career opportunities, internship alerts, mentorship guidance, and alumni achievements across 8 specialized domains.
          </p>
        </div>

        {/* 8 Category Grid */}
        <div className="category-cards-grid">
          {categories.map((cat, idx) => {
            const meta = CATEGORY_META[cat.name] || {
              icon: Briefcase,
              color: "#2563eb",
              bg: "rgba(37, 99, 235, 0.08)",
            };
            const Icon = meta.icon;

            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)" }}
                onClick={() => handleCardClick(cat.name)}
                className="category-card"
                style={{ "--cat-color": meta.color, "--cat-bg": meta.bg }}
              >
                <div className="cat-card-header flex-between">
                  <div className="cat-card-icon">
                    <Icon size={26} style={{ color: meta.color }} />
                  </div>
                  <span className="cat-count-badge">{cat.count} posts</span>
                </div>

                <h3 className="cat-card-title">{cat.name}</h3>

                <div className="cat-card-footer flex-between mt-3">
                  <span className="cat-browse-text">Browse Section</span>
                  <ArrowRight size={16} className="cat-arrow-icon" style={{ color: meta.color }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;
