const express = require("express");
const router = express.Router();
const {
  getAllRegularUsers,
  getUserById,
  updateUserProfile,
  uploadAvatar,
  uploadCover,
  uploadResume,
  uploadCertificate,
  uploadDocument,
  deleteDocument,
  sendConnectionRequest,
  respondConnectionRequest,
  getUserActivity,
  getSummaryStats,
  getFeaturedAlumni,
} = require("../controllers/userController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/stats/summary", getSummaryStats);
router.get("/public/featured", getFeaturedAlumni);

router.get("/", optionalAuth, getAllRegularUsers);
router.put("/profile", protect, updateUserProfile);
router.put("/profile/:id", protect, updateUserProfile);
router.put("/:id", protect, updateUserProfile);

router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);
router.post("/upload-cover", protect, upload.single("cover"), uploadCover);
router.post("/upload-resume", protect, upload.single("resume"), uploadResume);
router.post("/upload-certificate", protect, upload.single("certificate"), uploadCertificate);
router.post("/upload-achievement-proof", protect, upload.single("proof"), uploadCertificate);
router.post("/upload-document", protect, upload.single("document"), uploadDocument);
router.post("/upload-portfolio-document", protect, upload.single("document"), uploadDocument);
router.delete("/document/:docId", protect, deleteDocument);
router.delete("/portfolio-document/:docId", protect, deleteDocument);

router.get("/:id", protect, getUserById);
router.get("/:id/activity", protect, getUserActivity);
router.post("/:id/connect", protect, sendConnectionRequest);
router.post("/connection-request/:requestId/respond", protect, respondConnectionRequest);

module.exports = router;
