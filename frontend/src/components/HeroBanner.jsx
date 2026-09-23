import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Users,
  Briefcase,
  Award,
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  UserCheck,
} from "lucide-react";
import API from "../api/axios";
import { getImageUrl } from "../utils/getImageUrl";

const DEFAULT_BANNER = {
  _id: "default-hero",
  title: "Connect With Your Alumni Network",
  subtitle: "Official Alumni Community",
  description:
    "Connect with alumni and fellow graduates, discover career opportunities, find mentors, and build a professional network that grows with you.",
  ctaText: "Create Free Account",
  ctaLink: "/register",
  bannerImage: "",
};

const AUTO_ADVANCE_MS = 5000;

const HeroBanner = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const recordedImpressions = useRef(new Set());
  const bannerListRef = useRef([]);

  // Fetch active banners from backend
  const fetchActiveBanners = async (isInitial = false) => {
    try {
      const response = await API.get("/banners");
      const fetched = response.data.banners || [];

      if (fetched.length === 0) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[HERO BANNER] Displaying default GradConnect hero banner.");
        }
      }

      // Shallow compare to avoid resetting state if data hasn't changed
      const currentSignature = bannerListRef.current.map((b) => `${b._id}-${b.updatedAt}`).join("|");
      const fetchedSignature = fetched.map((b) => `${b._id}-${b.updatedAt}`).join("|");

      if (currentSignature !== fetchedSignature) {
        bannerListRef.current = fetched;
        setBanners(fetched);
        if (isInitial && fetched.length > 0) {
          setCurrentIndex(0);
        }
      }
    } catch (error) {
      console.error("Failed to load active hero banners:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Initial fetch and 60-second silent background polling
  useEffect(() => {
    fetchActiveBanners(true);

    const pollInterval = setInterval(() => {
      fetchActiveBanners(false);
    }, 60000);

    return () => clearInterval(pollInterval);
  }, []);

  const activeBanners = banners.length > 0 ? banners : [DEFAULT_BANNER];
  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  // Auto-advance timer (5000ms), paused on hover or play toggle
  useEffect(() => {
    if (!isPlaying || isHovered || activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [currentIndex, isHovered, isPlaying, activeBanners.length]);

  // Record impression for active custom banner slide
  useEffect(() => {
    if (!currentBanner || !currentBanner._id || currentBanner._id === "default-hero") return;
    if (recordedImpressions.current.has(currentBanner._id)) return;

    recordedImpressions.current.add(currentBanner._id);

    API.post(`/banners/${currentBanner._id}/impression`).catch((err) => {
      console.error("Failed to record banner impression:", err);
    });
  }, [currentBanner?._id]);

  // Record click on CTA button
  const handleCtaClick = () => {
    if (currentBanner && currentBanner._id && currentBanner._id !== "default-hero") {
      API.post(`/banners/${currentBanner._id}/click`).catch((err) => {
        console.error("Failed to record banner click:", err);
      });
    }

    if (currentBanner.ctaLink && currentBanner.ctaLink.startsWith("http")) {
      window.open(currentBanner.ctaLink, "_blank");
    } else if (currentBanner.ctaLink) {
      navigate(currentBanner.ctaLink);
    } else {
      navigate("/register");
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleDragEnd = (e, info) => {
    if (info.offset.x < -40) {
      handleNext();
    } else if (info.offset.x > 40) {
      handlePrev();
    }
  };

  const scrollToContent = () => {
    const section = document.getElementById("articles-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const rawImagePath = currentBanner.bannerImage || currentBanner.image || "";
  const bgImageSrc = rawImagePath ? getImageUrl(rawImagePath) : "";

  return (
    <section
      className="hero-banner-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Base Gradient Overlay */}
      <div className="hero-animated-gradient" />
      <div className="hero-grid-overlay" />

      {/* 2. Active Banner Background Image */}
      <AnimatePresence mode="wait">
        {bgImageSrc ? (
          <motion.div
            key={currentBanner._id || currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-kenburns-bg-wrapper"
          >
            <motion.img
              src={bgImageSrc}
              alt={currentBanner.title}
              initial={{ scale: 1 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: 6, ease: "linear" }}
              className="hero-kenburns-bg-img"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop";
              }}
            />
            <div className="hero-banner-image-overlay" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 3. Floating Icons */}
      <div className="hero-floating-icons">
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="floating-icon icon-shield"
        >
          <GraduationCap size={64} />
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="floating-icon icon-lock"
        >
          <Users size={72} />
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="floating-icon icon-search"
        >
          <Briefcase size={56} />
        </motion.div>

        <motion.div
          animate={{ y: [0, 16, 0], rotate: [0, -6, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="floating-icon icon-scale"
        >
          <Award size={60} />
        </motion.div>
      </div>

      {/* 4. Carousel Drag Area & Slide Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="hero-content hero-drag-area"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner._id || currentIndex}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            transition={{ duration: 0.5 }}
            className="hero-slide-body"
          >
            {/* Badge Pill */}
            <div className="hero-badge-pill">
              <GraduationCap size={16} className="hero-badge-icon" />
              <span>{currentBanner.subtitle || "Official Alumni Community"}</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title">{currentBanner.title}</h1>

            {/* Subtitle / Description */}
            <p className="hero-subtitle">{currentBanner.description}</p>

            {/* CTA Buttons */}
            <div className="hero-actions mt-3 flex-items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCtaClick}
                className="hero-cta-btn"
              >
                <span>{currentBanner.ctaText || "Create Free Account"}</span>
                <ArrowRight size={20} />
              </motion.button>

              <Link to="/login" className="btn btn-secondary btn-hero-secondary">
                <UserCheck size={18} />
                <span>Member Login</span>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 5. Carousel Controls (Only if > 1 banner) */}
      {activeBanners.length > 1 && (
        <>
          {/* Arrow Left */}
          <button
            type="button"
            onClick={handlePrev}
            className="hero-nav-arrow arrow-left"
            title="Previous Slide"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Arrow Right */}
          <button
            type="button"
            onClick={handleNext}
            className="hero-nav-arrow arrow-right"
            title="Next Slide"
          >
            <ChevronRight size={24} />
          </button>

          {/* Animated Progress Bar Dots & Play/Pause Toggle */}
          <div className="hero-progress-dots-container">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="hero-play-pause-btn"
              title={isPlaying ? "Pause Carousel" : "Play Carousel"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {activeBanners.map((banner, idx) => {
              const isActiveDot = idx === currentIndex;

              return (
                <button
                  key={banner._id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`hero-dot-btn ${isActiveDot ? "active-dot" : ""}`}
                  title={`Go to slide ${idx + 1}`}
                >
                  <div className="dot-track">
                    {isActiveDot && (
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: !isPlaying || isHovered ? "50%" : "100%" }}
                        transition={{
                          duration: !isPlaying || isHovered ? 0.2 : AUTO_ADVANCE_MS / 1000,
                          ease: "linear",
                        }}
                        className="dot-progress-bar"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Scroll Down Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        onClick={scrollToContent}
        className="scroll-indicator"
      >
        <ChevronDown size={28} />
      </motion.div>
    </section>
  );
};

export default HeroBanner;
