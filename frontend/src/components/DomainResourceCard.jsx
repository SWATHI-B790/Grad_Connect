import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, ShieldCheck, CheckCircle, Tag } from "lucide-react";
import { getCategoryStyle } from "../utils/categoryColors";
import { getImageUrl } from "../utils/getImageUrl";

const DomainResourceCard = ({ resource, index = 0 }) => {
  const categoryStyle = getCategoryStyle(resource.category);
  const CategoryIcon = categoryStyle.icon;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const imageSrc = getImageUrl(resource.bannerImage);

  const isAdmin =
    resource.author?.role === "admin" ||
    resource.author?.role === "superadmin" ||
    resource.author?.role === "subadmin" ||
    Boolean(resource.author?.adminLabel);

  const isAlumni =
    resource.author?.isVerifiedAlumni ||
    resource.author?.userType === "Alumni" ||
    resource.author?.role === "alumni" ||
    Boolean(resource.author?.graduationYear);

  const authorRoleBadge = isAdmin ? "Admin" : isAlumni ? "Alumni" : "Contributor";

  const tags = Array.isArray(resource.tags) && resource.tags.length > 0
    ? resource.tags
    : [resource.domain || "Tech"];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25, delay: (index % 6) * 0.05 }}
      className="domain-resource-card"
    >
      {/* 1. Cover Image & Badges */}
      <div className="resource-image-container">
        <img
          src={imageSrc}
          alt={resource.title}
          className="resource-image"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop";
          }}
        />
        <div className="resource-image-gradient" />

        {/* Domain Badge */}
        {resource.domain && (
          <div className="resource-domain-badge">
            <span>{resource.domain}</span>
          </div>
        )}

        {/* Category Pill */}
        <div
          className="resource-category-pill"
          style={{
            backgroundColor: categoryStyle.bg,
            color: categoryStyle.color,
            borderColor: categoryStyle.border,
          }}
        >
          <CategoryIcon size={12} />
          <span>{resource.category || "Technical Resource"}</span>
        </div>
      </div>

      {/* 2. Card Content */}
      <div className="resource-card-body">
        {/* Meta Row: Date & Read Time */}
        <div className="resource-meta-row">
          <span className="resource-meta-item">
            <Calendar size={13} />
            <span>{formatDate(resource.createdAt)}</span>
          </span>
          <span className="resource-meta-dot">•</span>
          <span className="resource-meta-item">
            <Clock size={13} />
            <span>{resource.readTime || "6 min read"}</span>
          </span>
        </div>

        {/* Resource Title */}
        <h3 className="resource-card-title">
          <Link to={`/blog/${resource.slug}`} title={resource.title}>
            {resource.title}
          </Link>
        </h3>

        {/* Excerpt / Short Description */}
        <p className="resource-card-desc">{resource.shortDescription}</p>

        {/* Technology Tags / Skills */}
        <div className="resource-tech-tags">
          {tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="resource-tech-tag">
              <Tag size={10} className="tag-hash-icon" />
              <span>{tag}</span>
            </span>
          ))}
          {tags.length > 4 && (
            <span className="resource-tech-tag-more">+{tags.length - 4}</span>
          )}
        </div>

        {/* 3. Card Footer: Author Attribution & CTA */}
        <div className="resource-card-footer">
          <div className="resource-author-group">
            <div className="resource-author-avatar">
              {resource.author?.avatar ? (
                <img
                  src={getImageUrl(resource.author.avatar)}
                  alt={resource.author?.name || "Author"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(resource.author?.name)}</span>
              )}
            </div>
            <div className="resource-author-info">
              <div className="resource-author-name-row">
                <span className="resource-author-name" title={resource.author?.name}>
                  {resource.author?.name || "GradConnect Contributor"}
                </span>
                <span
                  className={`resource-role-pill ${
                    isAdmin ? "role-admin" : isAlumni ? "role-alumni" : "role-contributor"
                  }`}
                >
                  {isAdmin ? (
                    <>
                      <ShieldCheck size={10} />
                      <span>Admin</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={10} />
                      <span>Alumni</span>
                    </>
                  )}
                </span>
              </div>
              <span className="resource-author-detail">
                {resource.author?.jobTitle
                  ? `${resource.author.jobTitle}${resource.author.company ? ` @ ${resource.author.company}` : ""}`
                  : isAdmin
                  ? "Engineering Lead"
                  : resource.author?.graduationYear
                  ? `Class of ${resource.author.graduationYear}`
                  : "Verified Alumni"}
              </span>
            </div>
          </div>

          <Link to={`/blog/${resource.slug}`} className="resource-cta-btn">
            <span>Read Resource</span>
            <ArrowRight size={14} className="resource-cta-arrow" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default DomainResourceCard;
