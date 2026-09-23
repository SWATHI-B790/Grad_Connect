const express = require("express");
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
} = require("../controllers/followController");
const { protect } = require("../middleware/authMiddleware");

router.post("/:userId", protect, followUser);
router.delete("/:userId", protect, unfollowUser);
router.get("/status/:userId", protect, getFollowStatus);
router.get("/followers/:userId", protect, getFollowers);
router.get("/following/:userId", protect, getFollowing);

module.exports = router;
