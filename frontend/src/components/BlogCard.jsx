import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Eye, ArrowRight, Star, CheckCircle } from "lucide-react";
import { getCategoryStyle } from "../utils/categoryColors";
import { getImageUrl } from "../utils/getImageUrl";

const BlogCard = ({ blog, index = 0, isFeaturedCard = false }) => {
  const categoryStyle = getCategoryStyle(blog.category);
  const CategoryIcon = categoryStyle.icon;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isRecentlyUpdated = (() => {
    if (!blog.updatedAt || !blog.createdAt) return false;
    const created = new Date(blog.createdAt).getTime();
    const updated = new Date(blog.updatedAt).getTime();
    const diffHours = (updated - created) / (1000 * 60 * 60);
    const isWithin7Days = Date.now() - updated < 7 * 24 * 60 * 60 * 1000;
    return diffHours >= 2 && isWithin7Days;
  })();

  const getInitials = (name) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const imageSrc = getImageUrl(blog.bannerImage);

  const isAlumni =
    blog.author?.isVerifiedAlumni ||
    blog.author?.userType === "Alumni" ||
    blog.author?.role === "alumni";

  const authorHeadline =
    blog.author?.jobTitle
      ? `${blog.author.jobTitle}${blog.author.company ? ` @ ${blog.author.company}` : ""}`
      : blog.author?.graduationYear
      ? `Class of ${blog.author.graduationYear} Alumni`
      : isAlumni
      ? "Alumni Mentor"
      : blog.author?.adminLabel || "Verified Contributor";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: (index % 6) * 0.07 }}
      className={`blog-card ${isFeaturedCard || blog.isFeatured ? "featured-blog-card" : ""}`}
    >
      {/* Featured Ribbon Badge */}
      {(blog.isFeatured || isFeaturedCard) && (
        <div className="featured-ribbon">
          <Star size={12} fill="currentColor" />
          <span>FEATURED</span>
        </div>
      )}

      {/* Recently Updated Badge */}
      {isRecentlyUpdated && !blog.isFeatured && (
        <div className="updated-badge">
          <span className="pulse-dot" />
          <span>UPDATED</span>
        </div>
      )}

      {/* Card Image Wrapper */}
      <div className="card-image-wrapper">
        <img
          src={imageSrc}
          alt={blog.title}
          className="card-image"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop";
          }}
        />
        <div className="card-image-overlay" />

        {/* Category Pill */}
        <div
          className="category-badge"
          style={{
            backgroundColor: categoryStyle.bg,
            color: categoryStyle.color,
            borderColor: categoryStyle.border,
          }}
        >
          <CategoryIcon size={13} className="category-icon" />
          <span>{blog.category}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Meta Header */}
        <div className="card-meta-row">
          <span className="card-meta-item">
            <Calendar size={13} />
            <span>{formatDate(blog.createdAt)}</span>
          </span>
          <span className="card-meta-item">
            <Eye size={13} />
            <span>{blog.views || 0} views</span>
          </span>
        </div>

        {/* Article Title */}
        <h3 className="card-title">
          <Link to={`/blog/${blog.slug}`} title={blog.title}>
            {blog.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="card-description">{blog.shortDescription}</p>

        {/* Card Footer */}
        <div className="card-footer">
          <div className="author-block">
            <div className="author-avatar-wrapper">
              {blog.author?.avatar ? (
                <img
                  src={getImageUrl(blog.author.avatar)}
                  alt={blog.author.name}
                  className="author-avatar-img"
                />
              ) : (
                <span>{getInitials(blog.author?.name)}</span>
              )}
            </div>
            <div className="author-info-col">
              <div className="author-name-row">
                <span className="author-name" title={blog.author?.name}>
                  {blog.author?.name || "GradConnect Alumni"}
                </span>
                {isAlumni && (
                  <span className="author-verified-badge" title="Verified Alumni">
                    <CheckCircle size={10} />
                    <span>Alumni</span>
                  </span>
                )}
              </div>
              <span className="author-headline" title={authorHeadline}>
                {authorHeadline}
              </span>
            </div>
          </div>

          <Link to={`/blog/${blog.slug}`} className="read-experience-cta">
            <span>Read Experience</span>
            <ArrowRight size={13} className="arrow-icon" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
