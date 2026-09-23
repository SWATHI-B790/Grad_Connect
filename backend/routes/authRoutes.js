const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  studentLogin,
  alumniLogin,
  adminLogin,
  logoutUser,
  getUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/student-login", studentLogin);
router.post("/alumni-login", alumniLogin);
router.post("/admin-login", adminLogin);
router.post("/logout", logoutUser);
router.get("/profile", protect, getUserProfile);

module.exports = router;
