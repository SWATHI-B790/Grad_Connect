import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Loader2, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const FollowButton = ({ userId, userName = "", onFollowChange, compact = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Self-profile check to prevent self-following
  const isSelf = Boolean(
    user && (user._id === userId || user.id === userId || user._id?.toString() === userId?.toString())
  );

  useEffect(() => {
    let isMounted = true;
    const checkFollowStatus = async () => {
      if (!user || isSelf) {
        setLoading(false);
        return;
      }
      try {
        const response = await API.get(`/follow/status/${userId}`);
        if (isMounted) {
          setIsFollowing(Boolean(response.data?.isFollowing));
        }
      } catch (error) {
        // Silently catch error if user is unauthenticated or user doesn't exist
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userId) {
      checkFollowStatus();
    }
    return () => {
      isMounted = false;
    };
  }, [userId, user, isSelf]);

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    if (actionLoading || isSelf) return;

    const previousState = isFollowing;
    // Optimistic toggle
    setIsFollowing(!previousState);
    setActionLoading(true);

    try {
      if (previousState) {
        // Unfollow
        await API.delete(`/follow/${userId}`);
        if (onFollowChange) onFollowChange(false);
      } else {
        // Follow -> creates follow record + recipient notification
        await API.post(`/follow/${userId}`);
        if (onFollowChange) onFollowChange(true);
      }
    } catch (error) {
      console.error("Follow action failed:", error);
      // Revert optimistic update on error
      setIsFollowing(previousState);
    } finally {
      setActionLoading(false);
    }
  };

  if (isSelf) {
    return (
      <span className="self-profile-badge" title="This is your own profile">
        <User size={13} />
        <span>Your Profile</span>
      </span>
    );
  }

  if (loading) {
    return (
      <div className="btn-follow-skeleton">
        <Loader2 size={13} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleToggleFollow}
      disabled={actionLoading}
      className={`follow-action-btn ${
        isFollowing ? "following-active-btn" : "follow-default-btn"
      } ${compact ? "follow-btn-compact" : ""}`}
      title={isFollowing ? `Unfollow ${userName || "member"}` : `Follow ${userName || "member"}`}
      aria-label={isFollowing ? `Following ${userName || "member"}` : `Follow ${userName || "member"}`}
    >
      {actionLoading ? (
        <>
          <Loader2 size={13} className="animate-spin" />
          <span>Updating...</span>
        </>
      ) : isFollowing ? (
        <>
          <UserCheck size={14} className="following-icon" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus size={14} className="follow-icon" />
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
};

export default FollowButton;
