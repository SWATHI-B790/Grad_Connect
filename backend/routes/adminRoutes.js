const express = require("express");
const router = express.Router();
const {
  getDashboardData,
  getAdminNotifications,
  getRegistrations,
  getRegistrationById,
  deleteRegistration,
  approveUser,
  rejectUser,
  getAllUsers,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  suspendUser,
  activateUser,
  deleteUserByAdmin,
  getAdminBlogs,
  createBlogByAdmin,
  updateBlogByAdmin,
  deleteBlogByAdmin,
  toggleBlogStatus,
  toggleFeatured,
  getAdminDomains,
  createDomainArticle,
  updateDomainArticle,
  deleteDomainArticle,
  getAdminEvents,
  createEventByAdmin,
  updateEventByAdmin,
  deleteEventByAdmin,
  updateAttendeeStatus,
  getAdminEventAttendees,
  cancelEventByAdmin,
  rejectEventSubmission,
  approveEventSubmission,
  toggleEventPublish,
  getActivityLogs,
  getSettings,
  updateAdminProfile,
  getUserHistory,
  getUsageStatus,
  getReports,
  generateDailyRegistrationsPdf,
  generatePendingApprovalsPdf,
  generateMembershipPdf,
  generateReportPdf,
} = require("../controllers/adminController");
const { protect, isAdminRole } = require("../middleware/authMiddleware");
const { checkUsageLimit } = require("../middleware/usageLimit");
const domainController = require("../controllers/domainController");
const { checkUserAccess } = require("../middleware/checkUserAccess");
const { checkMenuAccess } = require("../middleware/checkMenuAccess");
const upload = require("../middleware/upload");

// All admin routes require authentication and an administrative role (admin, subadmin, superadmin)
router.use(protect);
router.use(isAdminRole);

// ==========================================
// 1. DASHBOARD & NOTIFICATIONS
// ==========================================
router.get("/dashboard", checkMenuAccess("dashboard"), getDashboardData);
router.get("/notifications", getAdminNotifications);
router.get("/usage-status", getUsageStatus);

// ==========================================
// 2. REGISTRATIONS & APPROVAL WORKFLOW
// ==========================================
router.get("/registrations", checkMenuAccess("user_management"), getRegistrations);
router.get("/registrations/:id", checkMenuAccess("user_management"), getRegistrationById);
router.delete("/registrations/:id", checkMenuAccess("user_management"), checkUserAccess, deleteRegistration);
router.patch("/users/:id/approve", checkMenuAccess("user_management"), checkUserAccess, approveUser);
router.patch("/users/:id/reject", checkMenuAccess("user_management"), checkUserAccess, rejectUser);
router.patch("/registrations/:id/approve", checkMenuAccess("user_management"), checkUserAccess, approveUser);
router.patch("/registrations/:id/reject", checkMenuAccess("user_management"), checkUserAccess, rejectUser);

// ==========================================
// 3. USER MANAGEMENT (CRUD, SUSPEND, ACTIVATE)
// ==========================================
router.get("/users", checkMenuAccess("user_management"), checkUsageLimit("user_management"), getAllUsers);
router.post("/users", checkMenuAccess("user_management"), createUserByAdmin);
router.get("/users/:id", checkMenuAccess("user_management"), getUserById);
router.put("/users/:id", checkMenuAccess("user_management"), checkUserAccess, updateUserByAdmin);
router.patch("/users/:id/suspend", checkMenuAccess("user_management"), checkUserAccess, suspendUser);
router.patch("/users/:id/activate", checkMenuAccess("user_management"), checkUserAccess, activateUser);
router.delete("/users/:id", checkMenuAccess("user_management"), checkUserAccess, deleteUserByAdmin);
router.get("/users/:id/history", checkMenuAccess("user_management"), getUserHistory);

// ==========================================
// 4. CONTENT MANAGEMENT: BLOGS
// ==========================================
router.get("/blogs", checkMenuAccess("blogs"), checkUsageLimit("blogs"), getAdminBlogs);
router.post("/blogs", checkMenuAccess("blogs"), upload.single("bannerImage"), createBlogByAdmin);
router.put("/blogs/:id", checkMenuAccess("blogs"), upload.single("bannerImage"), updateBlogByAdmin);
router.delete("/blogs/:id", checkMenuAccess("blogs"), deleteBlogByAdmin);
router.patch("/blogs/:id/status", checkMenuAccess("blogs"), toggleBlogStatus);
router.patch("/blogs/:id/feature", checkMenuAccess("blogs"), toggleFeatured);

// ==========================================
// 5. CONTENT MANAGEMENT: DOMAINS & DOMAIN ARTICLES
// ==========================================
// Domains (Engineering & Technology Tracks)
router.get("/domains", checkMenuAccess("blogs"), domainController.getAdminDomains);
router.post("/domains", checkMenuAccess("blogs"), domainController.createDomainByAdmin);
router.get("/domains/:id", checkMenuAccess("blogs"), domainController.getDomainByIdAdmin);
router.put("/domains/:id", checkMenuAccess("blogs"), domainController.updateDomainByAdmin);
router.delete("/domains/:id", checkMenuAccess("blogs"), domainController.deleteDomainByAdmin);
router.patch("/domains/:id/status", checkMenuAccess("blogs"), domainController.toggleDomainStatus);
router.patch("/domains/:id/approve", checkMenuAccess("blogs"), domainController.approveDomainSubmission);
router.put("/domains/:id/approve", checkMenuAccess("blogs"), domainController.approveDomainSubmission);
router.patch("/domains/:id/reject", checkMenuAccess("blogs"), domainController.rejectDomainSubmission);
router.put("/domains/:id/reject", checkMenuAccess("blogs"), domainController.rejectDomainSubmission);

// Domain Articles (Technical Roadmaps & Alumni Articles)
router.get("/domain-articles", checkMenuAccess("blogs"), getAdminDomains);
router.post("/domain-articles", checkMenuAccess("blogs"), createDomainArticle);
router.put("/domain-articles/:id", checkMenuAccess("blogs"), updateDomainArticle);
router.delete("/domain-articles/:id", checkMenuAccess("blogs"), deleteDomainArticle);

// ==========================================
// 6. CONTENT MANAGEMENT: EVENTS
// ==========================================
router.get("/events", getAdminEvents);
router.post("/events", createEventByAdmin);
router.get("/events/:id/attendees", getAdminEventAttendees);
router.patch("/events/:id/attendees/:registrationId", updateAttendeeStatus);
router.patch("/events/:id/publish", toggleEventPublish);
router.patch("/events/:id/cancel", cancelEventByAdmin);
router.put("/events/:id/approve", approveEventSubmission);
router.patch("/events/:id/approve", approveEventSubmission);
router.post("/events/:id/approve", approveEventSubmission);
router.put("/events/:id/reject", rejectEventSubmission);
router.patch("/events/:id/reject", rejectEventSubmission);
router.post("/events/:id/reject", rejectEventSubmission);
router.put("/events/:id", updateEventByAdmin);
router.delete("/events/:id", deleteEventByAdmin);

// ==========================================
// 7. ACTIVITY / AUDIT LOGS
// ==========================================
router.get("/activity", checkMenuAccess("activity_logs"), checkUsageLimit("activity_logs"), getActivityLogs);
router.get("/activity-logs", checkMenuAccess("activity_logs"), getActivityLogs);

// ==========================================
// 8. SETTINGS & PROFILE
// ==========================================
router.get("/settings", checkMenuAccess("settings"), checkUsageLimit("settings"), getSettings);
router.put("/settings/profile", checkMenuAccess("settings"), updateAdminProfile);

// ==========================================
// 9. SYSTEM REPORTS & PDF GENERATION
// ==========================================
router.get("/reports", checkMenuAccess("reports"), checkUsageLimit("reports"), getReports);
router.get("/reports/daily-registrations/pdf", checkMenuAccess("reports"), checkUsageLimit("reports"), generateDailyRegistrationsPdf);
router.get("/reports/pending-approvals/pdf", checkMenuAccess("reports"), checkUsageLimit("reports"), generatePendingApprovalsPdf);
router.get("/reports/membership/pdf", checkMenuAccess("reports"), checkUsageLimit("reports"), generateMembershipPdf);
router.get("/reports/:reportType/pdf", checkMenuAccess("reports"), checkUsageLimit("reports"), generateReportPdf);

module.exports = router;
