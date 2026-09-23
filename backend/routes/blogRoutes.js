const express = require("express");
const router = express.Router();
const {
  createBlog,
  createAlumniBlog,
  getAllBlogs,
  getBlogBySlug,
  recordBlogView,
  getAllBlogsAdmin,
  updateBlog,
  updateAlumniBlog,
  deleteBlog,
  deleteAlumniBlog,
  getMyBlogs,
  getBlogById,
  toggleFeatured,
  getCategories,
  getBlogStats,
  getTrendingBlogs,
  getDomains,
} = require("../controllers/blogController");
const { protect, isAdminRole, isAlumniRole } = require("../middleware/authMiddleware");
const { checkMenuAccess } = require("../middleware/checkMenuAccess");
const { checkUsageLimit } = require("../middleware/usageLimit");
const upload = require("../middleware/upload");

// Public Blog Routes
router.get("/blogs", getAllBlogs);
router.get("/blogs/categories", getCategories);
router.get("/blogs/domains", getDomains);
router.get("/blogs/stats", getBlogStats);
router.get("/blogs/trending", getTrendingBlogs);

// Alumni Experience Authoring Routes (Private - Alumni Only)
// Declared BEFORE /blogs/:slug to prevent parameter collision
router.get("/blogs/my", protect, isAlumniRole, getMyBlogs);
router.get("/blogs/id/:id", protect, getBlogById);
router.post("/blogs", protect, isAlumniRole, upload.single("bannerImage"), createAlumniBlog);
router.put("/blogs/:id", protect, isAlumniRole, upload.single("bannerImage"), updateAlumniBlog);
router.delete("/blogs/:id", protect, isAlumniRole, deleteAlumniBlog);

// Single Blog Slug Route (Public)
router.get("/blogs/:slug", getBlogBySlug);

// Private Blog View Tracking Route
router.post("/blogs/:id/view", protect, recordBlogView);

// Admin Blog Routes (Protected by existing auth & RBAC)
router.get(
  "/admin/blogs",
  protect,
  isAdminRole,
  checkMenuAccess("blogs"),
  checkUsageLimit("blogs"),
  getAllBlogsAdmin
);

router.post(
  "/admin/blogs",
  protect,
  isAdminRole,
  checkMenuAccess("blogs"),
  upload.single("bannerImage"),
  createBlog
);

router.put(
  "/admin/blogs/:id",
  protect,
  isAdminRole,
  checkMenuAccess("blogs"),
  upload.single("bannerImage"),
  updateBlog
);

router.delete(
  "/admin/blogs/:id",
  protect,
  isAdminRole,
  checkMenuAccess("blogs"),
  deleteBlog
);

router.patch(
  "/admin/blogs/:id/feature",
  protect,
  isAdminRole,
  checkMenuAccess("blogs"),
  toggleFeatured
);

module.exports = router;
