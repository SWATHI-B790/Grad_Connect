const express = require("express");
const router = express.Router();
const {
  getActiveBanners,
  recordImpression,
  recordClick,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  reorderBanners,
} = require("../controllers/bannerController");
const { protect, isAdminRole } = require("../middleware/authMiddleware");
const { checkMenuAccess } = require("../middleware/checkMenuAccess");
const upload = require("../middleware/upload");

// Public Banner Routes
router.get("/banners", getActiveBanners);
router.post("/banners/:id/impression", recordImpression);
router.post("/banners/:id/click", recordClick);

// Admin Banner Routes
router.get(
  "/admin/banners",
  protect,
  isAdminRole,
  checkMenuAccess("banners"),
  getAllBannersAdmin
);

router.post(
  "/admin/banners",
  protect,
  isAdminRole,
  checkMenuAccess("banners"),
  upload.single("bannerImage"),
  createBanner
);

router.put(
  "/admin/banners/:id",
  protect,
  isAdminRole,
  checkMenuAccess("banners"),
  upload.single("bannerImage"),
  updateBanner
);

router.delete(
  "/admin/banners/:id",
  protect,
  isAdminRole,
  checkMenuAccess("banners"),
  deleteBanner
);

router.patch(
  "/admin/banners/reorder",
  protect,
  isAdminRole,
  checkMenuAccess("banners"),
  reorderBanners
);

router.patch(
  "/admin/banners/:id/toggle",
  protect,
  isAdminRole,
  checkMenuAccess("banners"),
  toggleBannerActive
);

module.exports = router;
