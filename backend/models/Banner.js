const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: [true, "Banner description is required"],
      trim: true,
    },
    bannerImage: {
      type: String,
      required: [true, "Banner image is required"],
    },
    ctaText: {
      type: String,
      default: "Explore Advisories",
      trim: true,
    },
    ctaLink: {
      type: String,
      default: "/#articles-section",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    impressionCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property 'image' alias for 'bannerImage'
bannerSchema.virtual("image").get(function () {
  return this.bannerImage;
});

bannerSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
