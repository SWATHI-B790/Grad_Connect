import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Eye, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import API from "../api/axios";
import { getImageUrl } from "../utils/getImageUrl";

const TrendingNow = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await API.get("/blogs/trending");
        setBlogs(response.data.blogs || []);
      } catch (err) {
        console.error("Failed to fetch trending blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (loading || blogs.length === 0) return null;

  return (
    <section className="section-trending">
      <div className="container">
        {/* Section Header */}
        <div className="flex-between mb-3">
          <div className="flex-items-center gap-2">
            <div className="trending-badge-icon">
              <Flame size={20} className="flame-animated" />
            </div>
            <div>
              <h2 className="trending-section-title">Trending Community Articles</h2>
              <p className="trending-section-subtitle">Most read articles and career journeys across GradConnect</p>
            </div>
          </div>

          {/* Navigation Scroll Controls */}
          <div className="flex-items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="scroll-btn"
              title="Scroll Left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="scroll-btn"
              title="Scroll Right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Cards Container */}
        <div ref={scrollContainerRef} className="trending-scroll-row">
          {blogs.map((article, idx) => {
            const imageSrc = getImageUrl(article.bannerImage);

            return (
              <motion.div
                key={article._id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="trending-card"
              >
                <div className="trending-card-image-wrapper">
                  <img
                    src={imageSrc}
                    alt={article.title}
                    className="trending-card-img"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400&auto=format&fit=crop";
                    }}
                  />
                  <div className="trending-rank-pill">#{idx + 1}</div>
                  <div className="trending-views-badge">
                    <Eye size={12} />
                    <span>{article.views || 0}</span>
                  </div>
                </div>

                <div className="trending-card-body">
                  <span className="trending-category-tag">{article.category}</span>
                  <Link to={`/blog/${article.slug}`} className="trending-card-title-link">
                    <h3>{article.title}</h3>
                  </Link>
                  <div className="trending-card-footer flex-between mt-2">
                    <span className="trending-read-time">{article.readTime || "5 min read"}</span>
                    <Link to={`/blog/${article.slug}`} className="trending-read-more">
                      <span>Read</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrendingNow;
