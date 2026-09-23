import React from "react";
import { LayoutGrid } from "lucide-react";
import { CATEGORIES, getCategoryStyle } from "../utils/categoryColors";

const CategoryFilter = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className="category-filter-container">
      <div className="category-pills-wrapper">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          const style = category !== "All" ? getCategoryStyle(category) : null;
          const Icon = category === "All" ? LayoutGrid : (style ? style.icon : null);

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`category-pill-btn ${isActive ? "active" : ""}`}
            >
              {Icon && <Icon size={14} className="pill-icon" />}
              <span>{category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;
