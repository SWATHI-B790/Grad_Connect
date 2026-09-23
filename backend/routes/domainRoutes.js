const express = require("express");
const router = express.Router();
const {
  getPublicDomains,
  getPublicDomainBySlug,
  getDomainCategoriesSummary,
  suggestDomainByAlumni,
  getAlumniSubmissions,
  updateAlumniSubmission,
  getAdminDomains,
  createDomainByAdmin,
  getDomainByIdAdmin,
  updateDomainByAdmin,
  deleteDomainByAdmin,
  toggleDomainStatus,
  approveDomainSubmission,
  rejectDomainSubmission,
} = require("../controllers/domainController");
const { protect, isAdminRole } = require("../middleware/authMiddleware");

// Public Exploration Endpoints
router.get("/categories/summary", getDomainCategoriesSummary);
router.get("/summary", getDomainCategoriesSummary); // alias
router.get("/", getPublicDomains);

// Alumni Contribution Endpoints (Must be placed before /:slug so "my" isn't treated as slug)
router.post("/suggest", protect, suggestDomainByAlumni);
router.get("/my/submissions", protect, getAlumniSubmissions);
router.put("/my/submissions/:id", protect, updateAlumniSubmission);

// Admin Management Aliases under /api/domains/admin/*
router.get("/admin/all", protect, isAdminRole, getAdminDomains);
router.post("/admin/create", protect, isAdminRole, createDomainByAdmin);
router.get("/admin/:id", protect, isAdminRole, getDomainByIdAdmin);
router.put("/admin/:id", protect, isAdminRole, updateDomainByAdmin);
router.delete("/admin/:id", protect, isAdminRole, deleteDomainByAdmin);
router.patch("/admin/:id/status", protect, isAdminRole, toggleDomainStatus);
router.patch("/admin/:id/approve", protect, isAdminRole, approveDomainSubmission);
router.patch("/admin/:id/reject", protect, isAdminRole, rejectDomainSubmission);

// Public Single Domain Detail by Slug (or ID)
router.get("/:slug", getPublicDomainBySlug);

module.exports = router;
