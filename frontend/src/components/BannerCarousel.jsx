import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import API from "../api/axios";
import { getImageUrl } from "../utils/getImageUrl";

const DEFAULT_SLIDES = [
  {
    id: "slide-1",
    subtitle: "OFFICIAL ALUMNI NETWORK",
    title: "Connect With Verified Alumni Leaders",
    description: "Build meaningful professional relationships with graduates working at Google, Meta, Microsoft, and Uber.",
    ctaText: "Discover Alumni",
    ctaLink: "/people",
    icon: Users,
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)",
  },
  {
    id: "slide-2",
    subtitle: "CAREER OPPORTUNITIES",
    title: "Exclusive Internships & Referral Opportunities",
    description: "Explore curated executive job openings and internal referral positions posted by alumni leaders.",
    ctaText: "Explore Jobs",
    ctaLink: "/jobs",
    icon: Briefcase,
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #311b92 50%, #7c3aed 100%)",
  },
  {
    id: "slide-3",
    subtitle: "EXECUTIVE MASTERCLASSES",
    title: "Join Upcoming Industry Webinars & Reunions",
    description: "Attend interactive masterclasses, panel discussions, and annual alumni mixers in one click.",
    ctaText: "Explore Events",
    ctaLink: "/events",
    icon: Award,
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)",
  },
  {
    id: "slide-4",
    subtitle: "ALUMNI INSIGHTS",
    title: "Read Career Advice & Transition Stories",
    description: "Learn how senior alumni navigated technical interviews, system design, and product leadership.",
    ctaText: "Read Blogs",
    ctaLink: "/blogs",
    icon: Sparkles,
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #701a75 50%, #dc2626 100%)",
  },
];

const BannerCarousel = () => {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await API.get("/banners");
        const activeBanners = response.data.banners || [];
        if (activeBanners.length > 0) {
          const formatted = activeBanners.map((b, idx) => ({
            id: b._id,
            subtitle: b.subtitle || "GRADCONNECT FEATURED",
            title: b.title,
            description: b.description,
            ctaText: b.ctaText || "Explore Opportunities",
            ctaLink: b.ctaLink || "/domains",
            icon: GraduationCap,
            bannerImage: b.bannerImage ? getImageUrl(b.bannerImage) : null,
            bgGradient: DEFAULT_SLIDES[idx % DEFAULT_SLIDES.length].bgGradient,
          }));
          setSlides(formatted);
        }
      } catch (err) {
        console.error("Failed to load active carousel banners:", err);
      }
    };
    fetchBanners();
  }, []);

  // Autoplay timer 5.5s
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const activeSlide = slides[currentIdx] || slides[0];
  const Icon = activeSlide.icon || GraduationCap;

  return (
    <div
      className="carousel-container relative overflow-hidden my-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        minHeight: "340px",
        background: activeSlide.bannerImage
          ? `linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%), url(${activeSlide.bannerImage}) center/cover no-repeat`
          : activeSlide.bgGradient,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="carousel-slide-content p-6 md:p-10 flex-between flex-wrap gap-6 items-center min-h-[340px] text-white relative z-10"
        >
          <div className="carousel-text-block max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur border border-white/20 mb-3 text-amber-300">
              <Icon size={14} className="text-amber-400" />
              <span>{activeSlide.subtitle}</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3">
              {activeSlide.title}
            </h2>

            <p className="text-sm md:text-base text-slate-200 mb-6 leading-relaxed max-w-xl">
              {activeSlide.description}
            </p>

            <Link
              to={activeSlide.ctaLink}
              className="btn btn-primary btn-md inline-flex items-center gap-2 shadow-xl hover:scale-105"
              style={{ background: "linear-gradient(135deg, #dc2626, #2563eb)", border: "none" }}
            >
              <span>{activeSlide.ctaText}</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="carousel-graphic-side hidden lg:flex items-center justify-center p-8 bg-white/5 rounded-full border border-white/10 backdrop-blur">
            <Icon size={76} className="text-white/80" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="carousel-nav-btn absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="carousel-nav-btn absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      <div className="carousel-dots-bar absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentIdx(idx)}
            className={`rounded-full transition-all border-none cursor-pointer ${
              currentIdx === idx ? "w-7 h-2.5 bg-white shadow" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
