const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [function () { return this.status === "published"; }, "Short description is required"],
      maxlength: [200, "Short description cannot exceed 200 characters"],
      trim: true,
      default: "",
    },
    content: {
      type: String,
      required: [function () { return this.status === "published"; }, "Blog content is required"],
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Placement Journey",
        "Internship Experience",
        "Technical Article",
        "Technical Roadmap",
        "Guide & Tutorial",
        "Interview Preparation",
        "Architecture & System",
        "Project Experience",
        "Career Advice",
        "Job Opportunity",
        "Internship",
        "Alumni Achievement",
        "Career Journey",
        "Announcement",
        "Mentorship",
        "Industry Insights",
        "Workplace Experience",
        "Technology",
        "Software Development",
        "Engineering",
        "General",
        "Career",
      ],
      default: "Career Journey",
    },
    domain: {
      type: String,
      default: "Software Development",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    bannerImage: {
      type: String,
      required: [function () { return this.status === "published"; }, "Banner image URL or path is required"],
      default: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
    },
    experienceType: {
      type: String,
      trim: true,
      default: "",
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    jobRole: {
      type: String,
      trim: true,
      default: "",
    },
    batch: {
      type: String,
      trim: true,
      default: "",
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search & filtering performance
blogSchema.index({ category: 1, status: 1, createdAt: -1 });
blogSchema.index({ domain: 1, status: 1, createdAt: -1 });

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
