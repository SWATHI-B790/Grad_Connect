const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc    Follow a user & send instant notification
// @route   POST /api/follow/:userId
// @access  Private (All authenticated users)
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const followerId = req.user._id;

    if (followerId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: targetUserId,
    });

    if (existingFollow) {
      return res.status(400).json({
        message: "Already following this user",
        isFollowing: true,
      });
    }

    await Follow.create({
      follower: followerId,
      following: targetUserId,
    });

    // Send instant notification specifically to the target user (recipient)
    // Avoid duplicate unread follow notifications if one already exists
    const existingNotif = await Notification.findOne({
      recipient: targetUserId,
      sender: followerId,
      type: { $in: ["new_follower", "follow_request"] },
      isRead: false,
    });

    if (!existingNotif) {
      await Notification.create({
        recipient: targetUserId,
        sender: followerId,
        type: "follow_request",
        message: `${req.user.name} sent you a follow request.`,
      });
    }

    return res.status(201).json({
      message: `You are now following ${targetUser.name}`,
      isFollowing: true,
    });
  } catch (error) {
    console.error("Follow User Error:", error);
    return res.status(500).json({ message: "Server error during follow action" });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/follow/:userId
// @access  Private (All authenticated users)
const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const followerId = req.user._id;

    await Follow.findOneAndDelete({
      follower: followerId,
      following: targetUserId,
    });

    // Clean up unread follow notification from this sender
    await Notification.deleteMany({
      recipient: targetUserId,
      sender: followerId,
      type: { $in: ["new_follower", "follow_request"] },
      isRead: false,
    });

    return res.status(200).json({
      message: "Unfollowed successfully",
      isFollowing: false,
    });
  } catch (error) {
    console.error("Unfollow User Error:", error);
    return res.status(500).json({ message: "Server error during unfollow action" });
  }
};

// @desc    Get follow status for a specific user
// @route   GET /api/follow/status/:userId
// @access  Private
const getFollowStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const followerId = req.user._id;

    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: targetUserId,
    });

    return res.status(200).json({
      isFollowing: !!existingFollow,
    });
  } catch (error) {
    console.error("Get Follow Status Error:", error);
    return res.status(500).json({ message: "Server error fetching follow status" });
  }
};

// @desc    Get list of users following :userId
// @route   GET /api/follow/followers/:userId
// @access  Private
const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Follow.find({ following: userId })
      .populate("follower", "name email role adminLabel createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      followers: followers.map((f) => f.follower),
    });
  } catch (error) {
    console.error("Get Followers Error:", error);
    return res.status(500).json({ message: "Server error fetching followers" });
  }
};

// @desc    Get list of users :userId follows
// @route   GET /api/follow/following/:userId
// @access  Private
const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Follow.find({ follower: userId })
      .populate("following", "name email role adminLabel createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      following: following.map((f) => f.following),
    });
  } catch (error) {
    console.error("Get Following Error:", error);
    return res.status(500).json({ message: "Server error fetching following list" });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
};
