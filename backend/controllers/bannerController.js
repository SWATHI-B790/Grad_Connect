const Banner = require("../models/Banner");
const path = require("path");
const fs = require("fs");

// @desc    Get active banners for public hero carousel
// @route   GET /api/banners
// @access  Public
const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();

    const banners = await Banner.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    }).sort({ displayOrder: 1, updatedAt: -1 });

    return res.status(200).json({ banners });
  } catch (error) {
    console.error("Get Active Banners Error:", error);
    return res.status(500).json({ message: "Server error fetching active banners" });
  }
};

// @desc    Record impression count when banner slide becomes visible
// @route   POST /api/banners/:id/impression
// @access  Public
const recordImpression = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(
      id,
      { $inc: { impressionCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res.status(200).json({ success: true, impressionCount: banner.impressionCount });
  } catch (error) {
    console.error("Record Impression Error:", error);
    return res.status(500).json({ message: "Server error recording impression" });
  }
};

// @desc    Record click count when banner CTA is clicked
// @route   POST /api/banners/:id/click
// @access  Public
const recordClick = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(
      id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res.status(200).json({ success: true, clickCount: banner.clickCount });
  } catch (error) {
    console.error("Record Click Error:", error);
    return res.status(500).json({ message: "Server error recording click" });
  }
};

// @desc    Get all banners for admin panel
// @route   GET /api/admin/banners
// @access  Private/Admin
const getAllBannersAdmin = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, updatedAt: -1 });
    return res.status(200).json({ banners });
  } catch (error) {
    console.error("Get Admin Banners Error:", error);
    return res.status(500).json({ message: "Server error fetching admin banners" });
  }
};

// @desc    Create new hero banner
// @route   POST /api/admin/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      ctaText,
      ctaLink,
      isActive,
      displayOrder,
      startDate,
      endDate,
      bannerImageUrl,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Banner title is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Banner description is required" });
    }

    let bannerImage = "";
    if (req.file) {
      bannerImage = `/uploads/${req.file.filename}`;
    } else if (bannerImageUrl && bannerImageUrl.trim()) {
      bannerImage = bannerImageUrl.trim();
    } else {
      return res.status(400).json({ message: "Banner image is required" });
    }

    // Determine max display order if not explicitly passed
    let computedOrder = parseInt(displayOrder, 10);
    if (isNaN(computedOrder)) {
      const highest = await Banner.findOne().sort({ displayOrder: -1 });
      computedOrder = highest ? highest.displayOrder + 1 : 1;
    }

    const newBanner = await Banner.create({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : "",
      description: description.trim(),
      bannerImage,
      ctaText: ctaText && ctaText.trim() ? ctaText.trim() : "Explore Advisories",
      ctaLink: ctaLink && ctaLink.trim() ? ctaLink.trim() : "/#articles-section",
      isActive: isActive === "true" || isActive === true,
      displayOrder: computedOrder,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      message: "Hero banner created successfully",
      banner: newBanner,
    });
  } catch (error) {
    console.error("Create Banner Error:", error);
    return res.status(500).json({ message: "Server error creating banner" });
  }
};

// @desc    Update hero banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      description,
      ctaText,
      ctaLink,
      isActive,
      displayOrder,
      startDate,
      endDate,
      bannerImageUrl,
    } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (title !== undefined) banner.title = title.trim();
    if (subtitle !== undefined) banner.subtitle = subtitle.trim();
    if (description !== undefined) banner.description = description.trim();
    if (ctaText !== undefined) banner.ctaText = ctaText.trim();
    if (ctaLink !== undefined) banner.ctaLink = ctaLink.trim();
    if (isActive !== undefined) banner.isActive = isActive === "true" || isActive === true;
    if (displayOrder !== undefined) banner.displayOrder = parseInt(displayOrder, 10) || 0;
    if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;

    if (req.file) {
      if (banner.bannerImage && banner.bannerImage.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", banner.bannerImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      banner.bannerImage = `/uploads/${req.file.filename}`;
    } else if (bannerImageUrl && bannerImageUrl.trim()) {
      banner.bannerImage = bannerImageUrl.trim();
    }

    await banner.save();

    return res.status(200).json({
      message: "Hero banner updated successfully",
      banner,
    });
  } catch (error) {
    console.error("Update Banner Error:", error);
    return res.status(500).json({ message: "Server error updating banner" });
  }
};

// @desc    Delete hero banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (banner.bannerImage && banner.bannerImage.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", banner.bannerImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Banner.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Hero banner deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    return res.status(500).json({ message: "Server error deleting banner" });
  }
};

// @desc    Toggle active status of hero banner
// @route   PATCH /api/admin/banners/:id/toggle
// @access  Private/Admin
const toggleBannerActive = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.status(200).json({
      message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`,
      banner,
    });
  } catch (error) {
    console.error("Toggle Banner Active Error:", error);
    return res.status(500).json({ message: "Server error toggling banner status" });
  }
};

// @desc    Reorder banners bulk (Drag & drop)
// @route   PATCH /api/admin/banners/reorder
// @access  Private/Admin
const reorderBanners = async (req, res) => {
  try {
    const { banners } = req.body; // Array of { id, displayOrder }

    if (!banners || !Array.isArray(banners)) {
      return res.status(400).json({ message: "Banners array is required for reordering" });
    }

    const bulkOps = banners.map((b) => ({
      updateOne: {
        filter: { _id: b.id },
        update: { $set: { displayOrder: b.displayOrder } },
      },
    }));

    await Banner.bulkWrite(bulkOps);

    const updatedBanners = await Banner.find().sort({ displayOrder: 1, updatedAt: -1 });

    return res.status(200).json({
      message: "Banners reordered successfully",
      banners: updatedBanners,
    });
  } catch (error) {
    console.error("Reorder Banners Error:", error);
    return res.status(500).json({ message: "Server error reordering banners" });
  }
};

module.exports = {
  getActiveBanners,
  recordImpression,
  recordClick,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  reorderBanners,
};
