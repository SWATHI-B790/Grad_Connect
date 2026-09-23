const mongoose = require("mongoose");

const learningTierSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    topics: { type: [String], default: [] },
    duration: { type: String, default: "" },
  },
  { _id: false }
);

const projectIdeaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    techStack: { type: [String], default: [] },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, default: "" },
    type: {
      type: String,
      enum: ["Documentation", "Course", "Book", "Video", "Roadmap", "Other"],
      default: "Documentation",
    },
  },
  { _id: false }
);

const domainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Domain name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Domain slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      maxlength: [400, "Short description cannot exceed 400 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Full domain description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Development",
        "AI & Data",
        "Cloud & DevOps",
        "Cybersecurity",
        "Design",
        "Mobile",
        "Emerging Technology",
        "Software Engineering",
        "Other",
      ],
      default: "Development",
      trim: true,
    },
    icon: {
      type: String,
      default: "Layers",
      trim: true,
    },
    coverImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    technologies: {
      type: [String],
      default: [],
    },
    careerRoles: {
      type: [String],
      default: [],
    },
    jobRoles: {
      type: [String],
      default: [],
    },
    tools: {
      type: [String],
      default: [],
    },
    learningPath: {
      beginner: {
        type: learningTierSchema,
        default: () => ({ title: "Foundations & Fundamentals", topics: [], duration: "4-6 Weeks" }),
      },
      intermediate: {
        type: learningTierSchema,
        default: () => ({ title: "Core Architecture & Tooling", topics: [], duration: "6-8 Weeks" }),
      },
      advanced: {
        type: learningTierSchema,
        default: () => ({ title: "Production Scaling & Systems", topics: [], duration: "8-12 Weeks" }),
      },
    },
    industry: {
      type: String,
      default: "Information Technology & Software Services",
      trim: true,
    },
    difficultyLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "Intermediate",
    },
    salaryRange: {
      type: String,
      default: "₹6 - ₹24 LPA / $70k - $140k",
      trim: true,
    },
    marketDemand: {
      type: String,
      enum: ["Very High", "High", "Moderate", "Emerging"],
      default: "High",
    },
    futureScope: {
      type: String,
      default: "",
      trim: true,
    },
    relatedProjects: {
      type: [projectIdeaSchema],
      default: [],
    },
    recommendedResources: {
      type: [resourceSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin", "superadmin", "subadmin", "alumni"],
      default: "admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"],
      default: "PUBLISHED",
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "restricted"],
      default: "public",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

domainSchema.index({ status: 1, category: 1 });
domainSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Domain", domainSchema);
