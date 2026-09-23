import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  GraduationCap,
  Briefcase,
  AlertCircle,
  Check,
  X,
  Sparkles,
  BookOpen,
  Compass,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import API from "../api/axios";
import FollowButton from "../components/FollowButton";
import Footer from "../components/Footer";
import { getImageUrl } from "../utils/getImageUrl";

const PAGE_SIZE = 10;

const People = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  // Fetch users from API
  const fetchUsers = async (query = "", typeFilter = "All") => {
    setLoading(true);
    setError("");
    try {
      let url = "/users";
      const params = new URLSearchParams();
      if (query.trim()) params.append("search", query.trim());
      if (typeFilter !== "All") params.append("userType", typeFilter);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await API.get(url);
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Unable to load community members. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(search, userTypeFilter);
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [search, userTypeFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, userTypeFilter]);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Summary counts
  const totalMembers = users.length;
  const alumniCount = useMemo(
    () => users.filter((u) => u.userType === "Alumni" || u.role === "alumni").length,
    [users]
  );
  const studentCount = useMemo(
    () => users.filter((u) => u.userType === "Current Student" || u.role === "student").length,
    [users]
  );

  // Client-side pagination
  const totalPages = Math.ceil(users.length / PAGE_SIZE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="people-page-wrapper">
      <div className="people-container">
        {/* 1. Header Section (Typography & Clean Spacing) */}
        <div className="people-hero-section">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="people-eyebrow-pill"
          >
            <Users size={14} />
            <span>COMMUNITY DIRECTORY</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="people-hero-title"
          >
            Discover Alumni &amp; Students
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="people-hero-subtitle"
          >
            Connect with verified alumni mentors, accomplished graduates, and ambitious students across academic departments, career domains, and professional industries.
          </motion.p>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.22 }}
            className="people-stats-strip"
          >
            <div className="people-stat-badge">
              <Users size={15} className="text-blue-600" />
              <span>
                <strong>{totalMembers}</strong> Total Members
              </span>
            </div>
            <div className="people-stat-divider" />
            <div className="people-stat-badge">
              <GraduationCap size={15} className="text-emerald-600" />
              <span>
                <strong>{alumniCount}</strong> Alumni Mentors
              </span>
            </div>
            <div className="people-stat-divider" />
            <div className="people-stat-badge">
              <BookOpen size={15} className="text-purple-600" />
              <span>
                <strong>{studentCount}</strong> Current Students
              </span>
            </div>
          </motion.div>
        </div>

        {/* 2. Directory Toolbar Panel */}
        <div className="people-toolbar-panel">
          {/* Search Input */}
          <div className="people-search-container">
            <Search size={19} className="people-search-icon" />
            <input
              type="text"
              placeholder="Search directory by member name, company, role, skills, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="people-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="people-search-clear-btn"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Bar & Pills */}
          <div className="people-filter-bar">
            <div className="people-filter-pills">
              <button
                type="button"
                onClick={() => setUserTypeFilter("All")}
                className={`people-filter-pill ${userTypeFilter === "All" ? "active" : ""}`}
              >
                <span>All Members</span>
                <span className="people-filter-count">{totalMembers}</span>
              </button>
              <button
                type="button"
                onClick={() => setUserTypeFilter("Alumni")}
                className={`people-filter-pill ${userTypeFilter === "Alumni" ? "active" : ""}`}
              >
                <GraduationCap size={14} />
                <span>Alumni</span>
                <span className="people-filter-count">{alumniCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setUserTypeFilter("Current Student")}
                className={`people-filter-pill ${userTypeFilter === "Current Student" ? "active" : ""}`}
              >
                <BookOpen size={14} />
                <span>Students</span>
                <span className="people-filter-count">{studentCount}</span>
              </button>
            </div>

            <div className="people-toolbar-meta">
              Showing <strong>{users.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</strong>–
              <strong>{Math.min(currentPage * PAGE_SIZE, totalMembers)}</strong> of{" "}
              <strong>{totalMembers}</strong> members
            </div>
          </div>

          {/* Active Filter Tags */}
          {(search.trim() || userTypeFilter !== "All") && (
            <div className="people-active-bar">
              <span className="people-active-label">Active Filters:</span>
              {userTypeFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => setUserTypeFilter("All")}
                  className="people-active-chip"
                  title="Remove type filter"
                >
                  <span>Type: <strong>{userTypeFilter}</strong></span>
                  <X size={12} />
                </button>
              )}
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="people-active-chip"
                  title="Clear search query"
                >
                  <span>Query: "<strong>{search.trim()}</strong>"</span>
                  <X size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setUserTypeFilter("All");
                }}
                className="people-reset-btn"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* 3. Error Banner */}
        {error && (
          <div className="alert alert-error mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchUsers(search, userTypeFilter)}
              className="btn btn-sm btn-outline ml-3"
            >
              Try Again
            </button>
          </div>
        )}

        {/* 4. Directory Container */}
        <div className="people-directory-container">
          {/* Table Header (Desktop Only) */}
          <div className="people-directory-thead">
            <div className="people-directory-th">Avatar</div>
            <div className="people-directory-th">Member &amp; Role</div>
            <div className="people-directory-th">Academic &amp; Field</div>
            <div className="people-directory-th th-skills">Key Skills</div>
            <div className="people-directory-th th-action">Network &amp; Action</div>
          </div>

          {/* Directory Body */}
          {loading ? (
            /* Skeleton Loading Rows */
            <div>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="directory-skeleton-row">
                  <div className="directory-main-info-group">
                    <div className="directory-skeleton-avatar shimmer-bg" />
                    <div className="directory-skeleton-col">
                      <div className="directory-skeleton-line w-75 shimmer-bg" />
                      <div className="directory-skeleton-line w-50 shimmer-bg" />
                    </div>
                  </div>
                  <div className="directory-skeleton-col">
                    <div className="directory-skeleton-line w-75 shimmer-bg" />
                    <div className="directory-skeleton-line w-40 shimmer-bg" />
                  </div>
                  <div className="directory-skills-col">
                    <div className="flex gap-2">
                      <div className="directory-skeleton-pill shimmer-bg" />
                      <div className="directory-skeleton-pill shimmer-bg" />
                    </div>
                  </div>
                  <div className="directory-action-col">
                    <div className="directory-skeleton-btn shimmer-bg" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            /* Empty State */
            <div className="people-empty-state">
              <div className="people-empty-icon-wrap">
                <AlertCircle size={32} />
              </div>
              <h3 className="people-empty-title">No Community Members Found</h3>
              <p className="people-empty-desc">
                {search.trim()
                  ? `No directory members matched "${search}". Try adjusting your search query or removing active filters.`
                  : "No community members registered under this filter yet. Check back soon!"}
              </p>
              {(search.trim() || userTypeFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setUserTypeFilter("All");
                  }}
                  className="people-empty-action-btn"
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : (
            /* Directory Rows */
            <div>
              <AnimatePresence mode="popLayout">
                {paginatedUsers.map((member, idx) => {
                  const isAlumni =
                    member.userType === "Alumni" || member.role === "alumni";
                  const isStudent =
                    member.userType === "Current Student" || member.role === "student";

                  const headline =
                    member.jobTitle
                      ? `${member.jobTitle}${member.company ? ` @ ${member.company}` : ""}`
                      : isStudent
                      ? "Current Student"
                      : isAlumni
                      ? "Alumni Member"
                      : "GradConnect Member";

                  const academicText = [
                    member.degree,
                    member.department,
                    member.batch ? `Batch '${member.batch}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  const hasAvatar = Boolean(member.avatar && member.avatar.trim());

                  return (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.025 }}
                      className="people-directory-row"
                    >
                      {/* 1 & 2. Main Info Group (Avatar + Identity) */}
                      <div className="directory-main-info-group">
                        {/* 1. Avatar Column */}
                        <div className="directory-avatar-col">
                          <Link
                            to={`/profile/${member._id}`}
                            className="directory-avatar-link"
                            title={`View ${member.name}'s profile`}
                          >
                            {hasAvatar ? (
                              <img
                                src={getImageUrl(member.avatar)}
                                alt={member.name}
                                className="directory-avatar-img"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="directory-avatar-initials"
                              style={{ display: hasAvatar ? "none" : "flex" }}
                            >
                              {getInitials(member.name)}
                            </div>
                          </Link>
                        </div>

                        {/* 2. Identity Column */}
                        <div className="directory-identity-col">
                          <div className="directory-identity-top">
                            <Link
                              to={`/profile/${member._id}`}
                              className="directory-member-name"
                              title={`View ${member.name}'s profile`}
                            >
                              {member.name}
                            </Link>

                            {/* Role Badge */}
                            <span
                              className={`directory-role-badge ${
                                isStudent ? "badge-student" : "badge-alumni"
                              }`}
                            >
                              {isStudent ? (
                                <>
                                  <BookOpen size={11} />
                                  <span>Student</span>
                                </>
                              ) : (
                                <>
                                  <Check size={11} />
                                  <span>Alumni</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Professional Headline */}
                          <div className="directory-member-headline" title={headline}>
                            <Briefcase size={13} className="directory-headline-icon" />
                            <span>{headline}</span>
                          </div>

                          {/* Mini Badges (Mentorship & Referrals) */}
                          {(member.willingToMentor || member.openToReferrals) && (
                            <div className="directory-mini-badges-row">
                              {member.willingToMentor && (
                                <span className="directory-mini-badge mentor-badge">
                                  <Sparkles size={10} />
                                  <span>Mentor</span>
                                </span>
                              )}
                              {member.openToReferrals && (
                                <span className="directory-mini-badge referral-badge">
                                  <Briefcase size={10} />
                                  <span>Referrals</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Academic & Field Column */}
                      <div className="directory-academic-col">
                        <div className="directory-academic-primary" title={academicText}>
                          <GraduationCap size={14} className="text-blue-600 flex-shrink-0" />
                          <span>{academicText || "Campus Community"}</span>
                        </div>

                        <div className="directory-academic-secondary">
                          {member.interestedField ? (
                            <>
                              <Compass size={13} className="text-slate-400 flex-shrink-0" />
                              <span className="directory-domain-tag" title={member.interestedField}>
                                {member.interestedField}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {member.college || "GradConnect Central University"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 4. Skills Column */}
                      <div className="directory-skills-col">
                        {member.skills && member.skills.length > 0 ? (
                          <div className="directory-skills-wrap">
                            {member.skills.slice(0, 3).map((skill, sIdx) => (
                              <span key={sIdx} className="directory-skill-chip" title={skill}>
                                {skill}
                              </span>
                            ))}
                            {member.skills.length > 3 && (
                              <span
                                className="directory-skill-more"
                                title={member.skills.slice(3).join(", ")}
                              >
                                +{member.skills.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="directory-no-skills">General Interest</span>
                        )}
                      </div>

                      {/* 5. Network & Action Column */}
                      <div className="directory-action-col">
                        <div className="directory-connection-counts">
                          <Users size={12} className="text-slate-400" />
                          <span>
                            {member.followersCount || 0} connections · {member.followingCount || 0} following
                          </span>
                        </div>

                        <div className="directory-action-buttons">
                          <FollowButton
                            userId={member._id}
                            userName={member.name}
                            compact={true}
                          />
                          <Link
                            to={`/profile/${member._id}`}
                            className="directory-view-link"
                          >
                            <span>View Profile</span>
                            <ArrowRight size={11} className="inline ml-0.5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* 5. Pagination Bar */}
          {!loading && users.length > PAGE_SIZE && (
            <div className="people-pagination-bar">
              <div className="people-pagination-info">
                Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
                <strong>{totalMembers}</strong> total members)
              </div>

              <div className="people-pagination-controls">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="people-pagination-btn"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`people-pagination-page ${
                      currentPage === pageNum ? "active" : ""
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="people-pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default People;
