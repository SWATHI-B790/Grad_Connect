import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Layers, Eye, ShieldCheck } from "lucide-react";
import API from "../api/axios";

const AnimatedCount = ({ value, duration = 1.5 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView || !value) return;

    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }

    const totalSteps = 40;
    const stepTime = (duration * 1000) / totalSteps;
    const increment = Math.ceil(end / totalSteps);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

const StatsCounter = () => {
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalCategories: 8,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/blogs/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch blog stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      label: "Community Posts & Opportunities",
      value: stats.totalArticles,
      icon: BookOpen,
      color: "blue",
      suffix: "+",
    },
    {
      label: "Specialized Career Domains",
      value: stats.totalCategories,
      icon: Layers,
      color: "amber",
      suffix: "",
    },
    {
      label: "Community Views",
      value: stats.totalViews,
      icon: Eye,
      color: "purple",
      suffix: "+",
    },
    {
      label: "Verified Network Satisfaction",
      value: 100,
      icon: ShieldCheck,
      color: "green",
      suffix: "%",
    },
  ];

  return (
    <section className="section-stats-counter">
      <div className="container">
        <div className="stats-grid">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="stat-card-box"
              >
                <div className={`stat-card-icon icon-${item.color}`}>
                  <Icon size={24} />
                </div>
                <div className="stat-card-content">
                  <div className="stat-card-number">
                    <AnimatedCount value={item.value} />
                    <span>{item.suffix}</span>
                  </div>
                  <div className="stat-card-label">{item.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
