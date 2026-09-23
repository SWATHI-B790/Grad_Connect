const express = require("express");
const router = express.Router();
const {
  getProfileById,
  updateProfile,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  addProject,
  updateProject,
  deleteProject,
  addSkill,
  deleteSkill,
  addCertification,
  updateCertification,
  deleteCertification,
  uploadResume,
  addAchievement,
  updateAchievement,
  deleteAchievement,
} = require("../controllers/profileController");
const {
  uploadDocument,
  deleteDocument,
} = require("../controllers/userController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Base Profile Endpoints
router.get("/:id", optionalAuth, getProfileById);
router.put("/:id", protect, updateProfile);

// Experience Endpoints
router.post("/:id/experience", protect, addExperience);
router.put("/:id/experience/:experienceId", protect, updateExperience);
router.delete("/:id/experience/:experienceId", protect, deleteExperience);

// Education Endpoints
router.post("/:id/education", protect, addEducation);
router.put("/:id/education/:educationId", protect, updateEducation);
router.delete("/:id/education/:educationId", protect, deleteEducation);

// Project Endpoints
router.post("/:id/projects", protect, addProject);
router.put("/:id/projects/:projectId", protect, updateProject);
router.delete("/:id/projects/:projectId", protect, deleteProject);

// Skill Endpoints
router.post("/:id/skills", protect, addSkill);
router.delete("/:id/skills/:skill", protect, deleteSkill);

// Certification Endpoints
router.post("/:id/certifications", protect, addCertification);
router.put("/:id/certifications/:certificateId", protect, updateCertification);
router.delete("/:id/certifications/:certificateId", protect, deleteCertification);

// Document Endpoints (Profile alias)
router.post("/:id/documents", protect, upload.single("document"), uploadDocument);
router.delete("/:id/documents/:docId", protect, deleteDocument);

// Achievement Endpoints
router.post("/:id/achievements", protect, addAchievement);
router.put("/:id/achievements/:achievementId", protect, updateAchievement);
router.delete("/:id/achievements/:achievementId", protect, deleteAchievement);

// Resume Upload Endpoint
router.post("/:id/resume", protect, upload.single("resume"), uploadResume);

module.exports = router;
