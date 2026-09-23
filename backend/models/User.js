const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["user", "alumni", "student", "subadmin", "superadmin", "admin", "admin1", "admin2"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "pending", "approved", "rejected", "suspended"],
      default: "APPROVED",
    },
    accountStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "pending", "approved", "rejected", "suspended"],
      default: "approved",
    },
    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "pending", "approved", "rejected", "suspended"],
      default: "approved",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    suspensionReason: {
      type: String,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    adminLabel: {
      type: String,
      default: null,
    },
    userType: {
      type: String,
      enum: ["Alumni", "Current Student"],
      default: "Alumni",
    },
    college: {
      type: String,
      default: "GradConnect Central University",
    },
    department: {
      type: String,
      default: "",
    },
    degree: {
      type: String,
      default: "",
    },
    batch: {
      type: String,
      default: "",
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    jobTitle: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    interestedField: {
      type: String,
      default: "",
    },
    age: {
      type: Number,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    linkedIn: {
      type: String,
      default: "",
    },
    portfolio: {
      type: String,
      default: "",
    },
    willingToMentor: {
      type: Boolean,
      default: false,
    },
    openToReferrals: {
      type: Boolean,
      default: true,
    },
    isVerifiedAlumni: {
      type: Boolean,
      default: true,
    },
    headline: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    education: [
      {
        school: { type: String, default: "" },
        degree: { type: String, default: "" },
        fieldOfStudy: { type: String, default: "" },
        startYear: { type: String, default: "" },
        endYear: { type: String, default: "" },
        grade: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],
    experience: [
      {
        title: { type: String, default: "" },
        company: { type: String, default: "" },
        employmentType: { type: String, default: "Full-Time" },
        location: { type: String, default: "" },
        startDate: { type: String, default: "" },
        endDate: { type: String, default: "" },
        currentlyWorking: { type: Boolean, default: false },
        description: { type: String, default: "" },
        skills: { type: [String], default: [] },
      },
    ],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    connectionRequests: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    interests: {
      type: [String],
      default: [],
    },
    projects: [
      {
        name: { type: String, default: "" },
        description: { type: String, default: "" },
        technologies: { type: [String], default: [] },
        role: { type: String, default: "" },
        startDate: { type: String, default: "" },
        endDate: { type: String, default: "" },
        link: { type: String, default: "" },
      },
    ],
    certifications: [
      {
        name: { type: String, default: "" },
        organization: { type: String, default: "" },
        issueDate: { type: String, default: "" },
        expiryDate: { type: String, default: "" },
        credentialId: { type: String, default: "" },
        credentialUrl: { type: String, default: "" },
        certificateFile: { type: String, default: "" },
      },
    ],
    documents: [
      {
        name: { type: String, default: "" },
        fileUrl: { type: String, default: "" },
        fileType: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    achievements: [
      {
        title: { type: String, required: true, trim: true },
        organization: { type: String, default: "", trim: true },
        date: { type: String, default: "", trim: true },
        category: {
          type: String,
          default: "Award",
          trim: true,
        },
        description: { type: String, default: "", trim: true },
        credentialUrl: { type: String, default: "", trim: true },
        proofFile: { type: String, default: "", trim: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    resume: {
      type: String,
      default: "",
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    allowedMenus: {
      type: [String],
      default: [],
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to keep status, accountStatus, and approvalStatus strictly synchronized
userSchema.pre("save", function (next) {
  const currentStatus = (this.status || this.accountStatus || this.approvalStatus || "APPROVED").toString().toUpperCase();
  if (["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(currentStatus)) {
    this.status = currentStatus;
    this.accountStatus = currentStatus.toLowerCase();
    this.approvalStatus = currentStatus.toLowerCase();
  }
  next();
});

// Method to remove sensitive fields when converting document to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  if (!user.accountStatus && user.status) {
    user.accountStatus = user.status.toLowerCase();
  }
  if (!user.approvalStatus && user.status) {
    user.approvalStatus = user.status.toLowerCase();
  }
  return user;
};

// Indexes for fast administrative queries
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
