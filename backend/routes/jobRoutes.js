const express = require("express");
const router = express.Router();
const {
  getAllJobs,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getAllJobsAdmin,
} = require("../controllers/jobController");
const { protect, optionalAuth, isAdminRole, canPostJob } = require("../middleware/authMiddleware");
const { checkMenuAccess } = require("../middleware/checkMenuAccess");

// Public Job Routes
router.get("/jobs", getAllJobs);

// Alumni / User Personal Jobs (Declared before /jobs/:id to avoid parameter collision)
router.get("/jobs/my", protect, canPostJob, getMyJobs);

// Single Job Details Route
router.get("/jobs/:id", optionalAuth, getJobById);

// Job Posting & Management Routes (Alumni & Admin only, Student forbidden)
router.post("/jobs", protect, canPostJob, createJob);
router.put("/jobs/:id", protect, canPostJob, updateJob);
router.delete("/jobs/:id", protect, canPostJob, deleteJob);
router.patch("/jobs/:id/status", protect, canPostJob, toggleJobStatus);

// Admin Job Management Routes (Admin only)
router.get("/admin/jobs", protect, isAdminRole, checkMenuAccess("jobs"), getAllJobsAdmin);

module.exports = router;
