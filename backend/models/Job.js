const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    // Basic & Company Info
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: "",
      trim: true,
    },
    companyWebsite: {
      type: String,
      default: "",
      trim: true,
    },
    companyDescription: {
      type: String,
      default: "",
      trim: true,
    },

    // Opportunity Details
    type: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
      default: "Full-Time",
    },
    jobType: {
      type: String,
      default: "Full-Time",
    },
    workMode: {
      type: String,
      enum: ["On-site", "Hybrid", "Remote"],
      default: "Remote",
    },
    location: {
      type: String,
      default: "Remote",
      trim: true,
    },
    experience: {
      type: String,
      default: "0-2 Years",
      trim: true,
    },
    experienceLevel: {
      type: String,
      default: "0-2 Years",
      trim: true,
    },
    openings: {
      type: Number,
      default: 1,
      min: [1, "Number of openings must be at least 1"],
    },

    // Description & Skills
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    responsibilities: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: String,
      default: "",
    },
    preferredQualifications: {
      type: String,
      default: "",
    },

    // Compensation & Application
    salary: {
      type: String,
      default: "",
      trim: true,
    },
    salaryRange: {
      type: String,
      default: "",
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    applyUrl: {
      type: String,
      default: "",
      trim: true,
    },
    applicationUrl: {
      type: String,
      default: "",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
    },

    // Moderation & Ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    postedByName: {
      type: String,
      default: "",
    },
    isVerifiedAlumniPost: {
      type: Boolean,
      default: false,
    },
    createdByRole: {
      type: String,
      enum: ["alumni", "admin", "superadmin", "subadmin", "admin1", "admin2"],
      default: "alumni",
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "UNPUBLISHED", "CLOSED"],
      default: "PUBLISHED",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization hook to ensure cross-compatibility between legacy & new schemas
jobSchema.pre("save", function (next) {
  // Sync applyUrl and applicationUrl
  if (this.applicationUrl && !this.applyUrl) {
    this.applyUrl = this.applicationUrl;
  } else if (this.applyUrl && !this.applicationUrl) {
    this.applicationUrl = this.applyUrl;
  }

  // Sync type and jobType
  if (this.type && !this.jobType) {
    this.jobType = this.type;
  } else if (this.jobType && !this.type) {
    const jt = this.jobType.toLowerCase();
    if (jt.includes("intern")) this.type = "Internship";
    else if (jt.includes("part")) this.type = "Part-Time";
    else if (jt.includes("contract")) this.type = "Contract";
    else this.type = "Full-Time";
  }

  // Sync skills and requirements
  if (this.skills && this.skills.length > 0 && (!this.requirements || this.requirements.length === 0)) {
    this.requirements = this.skills;
  } else if (this.requirements && this.requirements.length > 0 && (!this.skills || this.skills.length === 0)) {
    this.skills = this.requirements;
  }

  // Sync salary and salaryRange
  if (this.salary && !this.salaryRange) {
    this.salaryRange = this.salary;
  } else if (this.salaryRange && !this.salary) {
    this.salary = this.salaryRange;
  }

  // Sync experience and experienceLevel
  if (this.experience && !this.experienceLevel) {
    this.experienceLevel = this.experience;
  } else if (this.experienceLevel && !this.experience) {
    this.experience = this.experienceLevel;
  }

  // Sync createdBy and postedBy
  if (this.postedBy && !this.createdBy) {
    this.createdBy = this.postedBy;
  } else if (this.createdBy && !this.postedBy) {
    this.postedBy = this.createdBy;
  }

  // Normalize status uppercase
  if (this.status) {
    this.status = this.status.toUpperCase();
  } else {
    this.status = "PUBLISHED";
  }

  if (this.status === "PUBLISHED" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Indexes for search and query performance
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ workMode: 1, status: 1 });
jobSchema.index({ createdBy: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ title: "text", company: "text", skills: "text", description: "text" });

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
