const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
    },
    eventType: {
      type: String,
      default: "Technical Workshop",
      trim: true,
    },
    category: {
      type: String,
      default: "Technical Workshop",
      trim: true,
    },
    domain: {
      type: String,
      default: "Full Stack Development",
      trim: true,
    },
    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: {
      type: String,
      default: "10:00 AM - 12:00 PM IST",
    },
    startTime: {
      type: String,
      default: "10:00 AM",
    },
    endTime: {
      type: String,
      default: "12:00 PM",
    },
    timezone: {
      type: String,
      default: "IST",
    },
    duration: {
      type: String,
      default: "2 Hours",
    },
    mode: {
      type: String,
      enum: ["Online", "Offline", "In-person", "Hybrid"],
      default: "Online",
    },
    meetingPlatform: {
      type: String,
      enum: ["Google Meet", "Zoom", "Microsoft Teams", "Other", ""],
      default: "Google Meet",
    },
    meetingLink: {
      type: String,
      default: "",
    },
    onlineLink: {
      type: String,
      default: "",
    },
    venue: {
      type: String,
      default: "Virtual Meeting Hall",
    },
    venueName: {
      type: String,
      default: "",
    },
    venueAddress: {
      type: String,
      default: "",
    },
    venueCity: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    room: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    priceType: {
      type: String,
      enum: ["Free", "Paid"],
      default: "Free",
    },
    paymentRequired: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      default: "INR",
    },
    bannerImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
    },
    banner: {
      type: String,
      default: "",
    },
    organizer: {
      type: String,
      trim: true,
      default: "GradConnect Organizer",
    },
    organizerName: {
      type: String,
      default: "",
    },
    organizerEmail: {
      type: String,
      default: "",
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdByRole: {
      type: String,
      enum: ["superadmin", "admin", "subadmin", "alumni", "student"],
      default: "admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    capacity: {
      type: Number,
      default: 100,
    },
    maxAttendees: {
      type: Number,
      default: 100,
    },
    registrationEnabled: {
      type: Boolean,
      default: true,
    },
    registrationDeadline: {
      type: Date,
    },
    eligibility: {
      type: String,
      default: "Open to all verified students and alumni",
    },
    topics: {
      type: [String],
      default: [],
    },
    agenda: [
      {
        time: { type: String },
        activity: { type: String },
      },
    ],
    status: {
      type: String,
      enum: [
        "PENDING_ADMIN_APPROVAL",
        "PENDING",
        "APPROVED",
        "PUBLISHED",
        "REJECTED",
        "DRAFT",
        "COMPLETED",
        "CANCELLED",
        "UNPUBLISHED",
        "ARCHIVED",
        "Upcoming",
        "Open for Registration",
        "Almost Full",
        "Registration Closed",
      ],
      default: "PUBLISHED",
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
    adminApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminApprovedAt: {
      type: Date,
    },
    visibility: {
      type: String,
      enum: ["PUBLIC", "PRIVATE", "UNPUBLISHED"],
      default: "PUBLIC",
    },
    published: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ published: 1, date: 1 });
eventSchema.index({ isDeleted: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ domain: 1 });
eventSchema.index({ domainId: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ organizerId: 1 });

module.exports = mongoose.model("Event", eventSchema);
