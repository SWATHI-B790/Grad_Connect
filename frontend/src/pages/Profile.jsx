import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Briefcase,
  User as UserIcon,
  Award,
  CheckCircle,
  Edit3,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  Camera,
  Share2,
  UserCheck,
  UserPlus,
  Clock,
  BookOpen,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Building,
  Check,
  AlertCircle,
  Users,
  FileText,
  Upload,
  Download,
  Trophy,
  Code2,
  Tag,
  Heart,
  Compass,
  Eye,
  FileCheck,
  Loader2,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/getImageUrl";
import Footer from "../components/Footer";
import FollowButton from "../components/FollowButton";

const SKILL_CHIP_CLASSES = [
  "chip-blue",
  "chip-indigo",
  "chip-emerald",
  "chip-amber",
  "chip-purple",
  "chip-slate",
];

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, setUser: setCurrentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const ADMIN_ROLES = ["admin", "superadmin", "subadmin", "admin1", "admin2", "ADMIN", "SUPER_ADMIN", "SUB_ADMIN"];
  const isCurrentUserAdmin = Boolean(
    currentUser && (
      ADMIN_ROLES.includes(currentUser.role) ||
      ADMIN_ROLES.includes(currentUser.role?.toLowerCase()) ||
      ADMIN_ROLES.includes(currentUser.primaryRole?.toUpperCase()) ||
      currentUser.role?.toLowerCase()?.includes("admin") ||
      currentUser.adminRole
    )
  );

  // Strict ownership calculation:
  // True if user is viewing /profile directly, OR if :userId matches logged-in user's _id or id
  const isOwner = Boolean(
    (!userId && currentUser) ||
    (currentUser && userId && String(currentUser._id || currentUser.id) === String(userId))
  );

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [savingMain, setSavingMain] = useState(false);

  // Activity feed
  const [userActivity, setUserActivity] = useState({ blogs: [], events: [] });
  const [activeTab, setActiveTab] = useState("blogs");

  // Modals
  const [showEditMainModal, setShowEditMainModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showDeleteExpModal, setShowDeleteExpModal] = useState(false);
  const [confirmDeleteExpId, setConfirmDeleteExpId] = useState(null);
  const [deletingExp, setDeletingExp] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showDeleteCertModal, setShowDeleteCertModal] = useState(false);
  const [confirmDeleteCertId, setConfirmDeleteCertId] = useState(null);
  const [confirmDeleteCertName, setConfirmDeleteCertName] = useState("");
  const [deletingCert, setDeletingCert] = useState(false);
  const [editingCertId, setEditingCertId] = useState(null);
  const [savingCert, setSavingCert] = useState(false);
  const [certModalError, setCertModalError] = useState("");

  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState(null);
  const [confirmDeleteDocName, setConfirmDeleteDocName] = useState("");
  const [deletingDoc, setDeletingDoc] = useState(false);
  const [selectedDocFile, setSelectedDocFile] = useState(null);
  const [docModalError, setDocModalError] = useState("");

  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showDeleteAchievementModal, setShowDeleteAchievementModal] = useState(false);
  const [confirmDeleteAchievementId, setConfirmDeleteAchievementId] = useState(null);
  const [confirmDeleteAchievementTitle, setConfirmDeleteAchievementTitle] = useState("");
  const [deletingAchievement, setDeletingAchievement] = useState(false);
  const [editingAchievementId, setEditingAchievementId] = useState(null);
  const [savingAchievement, setSavingAchievement] = useState(false);
  const [achievementModalError, setAchievementModalError] = useState("");
  const [uploadingAchievementProof, setUploadingAchievementProof] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [certPreviewModal, setCertPreviewModal] = useState({ open: false, url: "", title: "" });

  // Edit Indexes
  const [editingEduIndex, setEditingEduIndex] = useState(null);
  const [editingExpIndex, setEditingExpIndex] = useState(null);
  const [editingExpId, setEditingExpId] = useState(null);
  const [savingExp, setSavingExp] = useState(false);
  const [expModalError, setExpModalError] = useState("");
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [editingCertIndex, setEditingCertIndex] = useState(null);
  const [editingAchievementIndex, setEditingAchievementIndex] = useState(null);

  // File Input Refs
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const certFileInputRef = useRef(null);
  const docFileInputRef = useRef(null);
  const achievementFileInputRef = useRef(null);

  // Uploading States
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCertFile, setUploadingCertFile] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Main Edit Form State
  const [mainForm, setMainForm] = useState({
    name: "",
    college: "GradConnect Central University",
    age: "",
    userType: "Alumni",
    role: "alumni",
    headline: "",
    bio: "",
    department: "",
    degree: "",
    batch: "",
    graduationYear: "",
    jobTitle: "",
    company: "",
    industry: "",
    interestedField: "",
    city: "",
    country: "",
    phone: "",
    linkedIn: "",
    portfolio: "",
    willingToMentor: false,
    openToReferrals: true,
  });

  // Section Form States
  const [eduForm, setEduForm] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
    grade: "",
    description: "",
  });

  const [expForm, setExpForm] = useState({
    title: "",
    company: "",
    employmentType: "Full-Time",
    location: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    description: "",
    skills: "",
  });

  const [projectForm, setProjectForm] = useState({
    name: "",
    role: "",
    description: "",
    technologies: "",
    startDate: "",
    endDate: "",
    link: "",
  });

  const [certForm, setCertForm] = useState({
    name: "",
    organization: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    certificateFile: "",
  });

  const [docForm, setDocForm] = useState({
    name: "",
  });

  const [achievementForm, setAchievementForm] = useState({
    _id: "",
    title: "",
    organization: "",
    date: "",
    category: "Award",
    description: "",
    credentialUrl: "",
    proofFile: "",
  });

  const [aboutBioText, setAboutBioText] = useState("");

  // Skills & Interests Inputs
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  // Fetch Profile Data
  const fetchProfileData = async () => {
    setLoading(true);
    setError("");
    const targetUserId = userId || currentUser?._id || currentUser?.id;
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      let data;
      if (isOwner) {
        const res = await API.get("/auth/profile");
        data = res.data;
      } else {
        const res = await API.get(`/profile/${targetUserId}`);
        data = res.data;
      }

      setProfile(data);
      if (isOwner && setCurrentUser) {
        setCurrentUser(data);
      }

      setMainForm({
        name: data.name || "",
        college: data.college || "GradConnect Central University",
        age: data.age || "",
        userType: data.userType || "Alumni",
        role: data.role || "alumni",
        headline: data.headline || "",
        bio: data.bio || "",
        department: data.department || "",
        degree: data.degree || "",
        batch: data.batch || "",
        graduationYear: data.graduationYear || "",
        jobTitle: data.jobTitle || "",
        company: data.company || "",
        industry: data.industry || "",
        interestedField: data.interestedField || data.industry || "",
        city: data.city || "",
        country: data.country || "",
        phone: data.phone || "",
        linkedIn: data.linkedIn || "",
        portfolio: data.portfolio || "",
        willingToMentor: Boolean(data.willingToMentor),
        openToReferrals: data.openToReferrals !== false,
      });

      // Fetch user activities
      try {
        const [blogRes, eventRes] = await Promise.allSettled([
          API.get(`/blogs/user/${targetUserId}`),
          API.get(`/events/user/${targetUserId}`),
        ]);

        setUserActivity({
          blogs: blogRes.status === "fulfilled" && Array.isArray(blogRes.value.data) ? blogRes.value.data : [],
          events: eventRes.status === "fulfilled" && Array.isArray(eventRes.value.data) ? eventRes.value.data : [],
        });
      } catch (actErr) {
        console.warn("Could not fetch user activity feed", actErr);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError(err.response?.data?.message || "Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isCurrentUserAdmin && (!userId || (userId && String(currentUser._id || currentUser.id) === String(userId)))) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      if (!userId && !currentUser) {
        navigate("/login");
        return;
      }
      fetchProfileData();
    }
  }, [userId, authLoading, currentUser?._id, isCurrentUserAdmin]);

  // Image & Document Upload Handlers
  const handleAvatarUpload = async (e) => {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, WebP)");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    setSuccessMsg("");
    setError("");

    try {
      const res = await API.post("/users/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => ({ ...prev, avatar: res.data.avatarUrl }));
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, avatar: res.data.avatarUrl }));
      }
      setSuccessMsg("Profile photo updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleCoverUpload = async (e) => {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid cover image file (JPG, PNG, WebP)");
      return;
    }

    const formData = new FormData();
    formData.append("coverImage", file);

    setUploadingCover(true);
    setSuccessMsg("");
    setError("");

    try {
      const res = await API.post("/users/upload-cover", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => ({ ...prev, coverImage: res.data.coverUrl }));
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, coverImage: res.data.coverUrl }));
      }
      setSuccessMsg("Cover banner updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Cover banner upload failed.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleResumeUpload = async (e) => {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const profileId = profile?._id || profile?.id;
    const formData = new FormData();
    formData.append("resume", file);

    setUploadingResume(true);
    setSuccessMsg("");
    setError("");

    try {
      const res = await API.post(`/profile/${profileId}/resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => ({ ...prev, resume: res.data.resumeUrl }));
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, resume: res.data.resumeUrl }));
      }
      setSuccessMsg("Resume document uploaded successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload resume document");
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  const handleCertFileUpload = async (e) => {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("certificate", file);

    setUploadingCertFile(true);
    setCertModalError("");
    try {
      const res = await API.post("/users/upload-certificate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCertForm((prev) => ({ ...prev, certificateFile: res.data.fileUrl }));
      setSuccessMsg("Certificate file uploaded!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload certificate file";
      setCertModalError(msg);
      setError(msg);
    } finally {
      setUploadingCertFile(false);
      if (certFileInputRef.current) certFileInputRef.current.value = "";
    }
  };

  const handleDocFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedDocFile(file);
    setDocModalError("");
    if (!docForm.name || !docForm.name.trim()) {
      setDocForm({ name: file.name });
    }
  };

  const handleUploadDocument = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isOwner) return;

    const fileToUpload = selectedDocFile || docFileInputRef.current?.files?.[0];
    if (!fileToUpload) {
      setDocModalError("Please select a file to upload (PDF, DOCX, PNG, JPG up to 10MB).");
      return;
    }

    const formData = new FormData();
    formData.append("document", fileToUpload);
    formData.append("name", (docForm.name && docForm.name.trim()) || fileToUpload.name);

    setUploadingDoc(true);
    setDocModalError("");
    try {
      const res = await API.post("/users/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newDoc = res.data.document;
      const allDocs = res.data.documents || [...(profile.documents || []), newDoc];
      setProfile((prev) => ({
        ...prev,
        documents: allDocs,
      }));
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, documents: allDocs }));
      }
      setShowDocUploadModal(false);
      setSelectedDocFile(null);
      setDocForm({ name: "" });
      setSuccessMsg("Document added to portfolio successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload document";
      setDocModalError(msg);
      setError(msg);
    } finally {
      setUploadingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  };

  const handleDeleteDocClick = (doc, idx) => {
    if (!isOwner) return;
    const resolvedId = doc?._id ? doc._id.toString() : (typeof doc === "string" ? doc : idx);
    setConfirmDeleteDocId(resolvedId);
    setConfirmDeleteDocName(doc?.name || "this document");
    setShowDeleteDocModal(true);
  };

  const handleCancelDeleteDocument = () => {
    setShowDeleteDocModal(false);
    setConfirmDeleteDocId(null);
    setConfirmDeleteDocName("");
  };

  const handleConfirmDeleteDocument = async () => {
    if (!isOwner || !confirmDeleteDocId) return;
    setDeletingDoc(true);
    try {
      const res = await API.delete(`/users/document/${confirmDeleteDocId}`);
      const updatedDocs = res.data.documents || (profile.documents || []).filter(
        (d) => (d._id && d._id.toString() !== confirmDeleteDocId.toString())
      );
      setProfile((prev) => ({
        ...prev,
        documents: updatedDocs,
      }));
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, documents: updatedDocs }));
      }
      setSuccessMsg("Document removed from portfolio!");
      setTimeout(() => setSuccessMsg(""), 4000);
      setShowDeleteDocModal(false);
      setConfirmDeleteDocId(null);
      setConfirmDeleteDocName("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete document";
      setError(msg);
      setShowDeleteDocModal(false);
      setConfirmDeleteDocId(null);
      setConfirmDeleteDocName("");
    } finally {
      setDeletingDoc(false);
    }
  };

  // Main Profile Save Handler
  const handleSaveMainProfile = async (e) => {
    e.preventDefault();
    if (!isOwner) return;

    setSavingMain(true);
    setError("");
    setSuccessMsg("");

    const profileId = profile?._id || profile?.id;
    try {
      const res = await API.put(`/profile/${profileId}`, mainForm);
      setProfile(res.data.user);
      if (setCurrentUser) {
        setCurrentUser(res.data.user);
      }
      setShowEditMainModal(false);
      setSuccessMsg("Profile information updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile information");
    } finally {
      setSavingMain(false);
    }
  };

  // About Bio Save Handler
  const handleSaveAbout = async (e) => {
    e.preventDefault();
    if (!isOwner) return;

    const profileId = profile?._id || profile?.id;
    try {
      const res = await API.put(`/profile/${profileId}`, { bio: aboutBioText });
      setProfile((prev) => ({ ...prev, bio: aboutBioText }));
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, bio: aboutBioText }));
      }
      setShowAboutModal(false);
      setSuccessMsg("About summary updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update bio");
    }
  };

  // Skill Handlers
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!isOwner || !newSkill.trim() || !profile) return;

    const profileId = profile?._id || profile?.id;
    try {
      const res = await API.post(`/profile/${profileId}/skills`, { skill: newSkill.trim() });
      setProfile((prev) => ({ ...prev, skills: res.data.skills }));
      if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, skills: res.data.skills }));
      setNewSkill("");
      setSuccessMsg("Skill added!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add skill");
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    if (!isOwner || !profile) return;
    const profileId = profile?._id || profile?.id;
    try {
      const res = await API.delete(`/profile/${profileId}/skills/${encodeURIComponent(skillToRemove)}`);
      setProfile((prev) => ({ ...prev, skills: res.data.skills }));
      if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, skills: res.data.skills }));
    } catch (err) {
      console.error("Remove skill error:", err);
    }
  };

  // Interest Handlers
  const handleAddInterest = async (e) => {
    e.preventDefault();
    if (!isOwner || !newInterest.trim() || !profile) return;

    const currentInterests = Array.isArray(profile.interests) ? profile.interests : [];
    if (currentInterests.some((i) => i.toLowerCase() === newInterest.trim().toLowerCase())) {
      setNewInterest("");
      return;
    }

    const updatedInterests = [...currentInterests, newInterest.trim()];
    const profileId = profile?._id || profile?.id;

    try {
      const res = await API.put(`/profile/${profileId}`, { interests: updatedInterests });
      setProfile(res.data.user);
      if (setCurrentUser) setCurrentUser(res.data.user);
      setNewInterest("");
    } catch (err) {
      console.error("Add interest error:", err);
    }
  };

  const handleRemoveInterest = async (interestToRemove) => {
    if (!isOwner || !profile) return;
    const updatedInterests = (profile.interests || []).filter((i) => i !== interestToRemove);
    const profileId = profile?._id || profile?.id;

    try {
      const res = await API.put(`/profile/${profileId}`, { interests: updatedInterests });
      setProfile(res.data.user);
      if (setCurrentUser) setCurrentUser(res.data.user);
    } catch (err) {
      console.error("Remove interest error:", err);
    }
  };

  // Education Handlers
  const handleSaveEducation = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    const profileId = profile?._id || profile?.id;

    try {
      let res;
      if (editingEduIndex !== null) {
        const eduId = profile.education[editingEduIndex]?._id;
        if (eduId) {
          res = await API.put(`/profile/${profileId}/education/${eduId}`, eduForm);
        } else {
          const currentEdu = [...profile.education];
          currentEdu[editingEduIndex] = eduForm;
          res = await API.put(`/profile/${profileId}`, { education: currentEdu });
        }
      } else {
        res = await API.post(`/profile/${profileId}/education`, eduForm);
      }

      const updatedEducation = res.data.education || res.data.user?.education;
      setProfile((prev) => ({ ...prev, education: updatedEducation }));
      if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, education: updatedEducation }));

      setShowEduModal(false);
      setEditingEduIndex(null);
      setEduForm({ school: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "", grade: "", description: "" });
      setSuccessMsg("Education details saved!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save education entry");
    }
  };

  const handleDeleteEducation = async (indexToDelete) => {
    if (!isOwner) return;
    const profileId = profile?._id || profile?.id;
    const edu = profile.education?.[indexToDelete];

    try {
      let res;
      if (edu?._id) {
        res = await API.delete(`/profile/${profileId}/education/${edu._id}`);
      } else {
        const currentEdu = (profile.education || []).filter((_, idx) => idx !== indexToDelete);
        res = await API.put(`/profile/${profileId}`, { education: currentEdu });
      }
      const updatedEdu = res.data.education || res.data.user?.education;
      setProfile((prev) => ({ ...prev, education: updatedEdu }));
      if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, education: updatedEdu }));
    } catch (err) {
      console.error("Delete education error:", err);
    }
  };

  // Experience Handlers
  const resetExpModal = () => {
    setShowExpModal(false);
    setEditingExpId(null);
    setEditingExpIndex(null);
    setExpModalError("");
    setSavingExp(false);
    setExpForm({
      _id: "",
      title: "",
      company: "",
      employmentType: "Full-Time",
      location: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      description: "",
      skills: "",
    });
  };

  const handleEditExperience = (exp, idx) => {
    if (!exp) return;
    const isCurrent = Boolean(exp.currentlyWorking);
    const skillsStr = Array.isArray(exp.skills)
      ? exp.skills.join(", ")
      : typeof exp.skills === "string"
      ? exp.skills
      : "";

    const resolvedId = exp._id ? exp._id.toString() : (exp.id ? exp.id.toString() : null);
    setEditingExpId(resolvedId);
    setEditingExpIndex(idx);
    setExpModalError("");
    setSavingExp(false);
    setExpForm({
      _id: resolvedId || "",
      title: exp.title || exp.jobTitle || "",
      company: exp.company || "",
      employmentType: exp.employmentType || "Full-Time",
      location: exp.location || "",
      startDate: exp.startDate || "",
      endDate: isCurrent ? "" : (exp.endDate || ""),
      currentlyWorking: isCurrent,
      description: exp.description || "",
      skills: skillsStr,
    });
    setShowExpModal(true);
  };

  const handleAddExperience = () => {
    resetExpModal();
    setShowExpModal(true);
  };

  const handleSaveExperience = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    const profileId = profile?._id || profile?.id;

    // Client-side Validation
    const titleTrimmed = (expForm.title || "").trim();
    const companyTrimmed = (expForm.company || "").trim();

    if (!titleTrimmed) {
      setExpModalError("Job Title is required.");
      return;
    }

    if (!companyTrimmed) {
      setExpModalError("Company / Organization is required.");
      return;
    }

    const startTrimmed = (expForm.startDate || "").trim();
    const endTrimmed = expForm.currentlyWorking ? "" : (expForm.endDate || "").trim();

    // Check year ordering if both start and end look like numeric years
    if (!expForm.currentlyWorking && /^\d{4}$/.test(startTrimmed) && /^\d{4}$/.test(endTrimmed)) {
      if (parseInt(endTrimmed, 10) < parseInt(startTrimmed, 10)) {
        setExpModalError("End date/year cannot be earlier than start date/year.");
        return;
      }
    }

    let parsedSkills = [];
    if (Array.isArray(expForm.skills)) {
      parsedSkills = expForm.skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof expForm.skills === "string" && expForm.skills.trim()) {
      parsedSkills = expForm.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const payload = {
      title: titleTrimmed,
      jobTitle: titleTrimmed,
      company: companyTrimmed,
      employmentType: expForm.employmentType || "Full-Time",
      location: (expForm.location || "").trim(),
      startDate: startTrimmed,
      currentlyWorking: Boolean(expForm.currentlyWorking),
      endDate: endTrimmed,
      description: (expForm.description || "").trim(),
      skills: parsedSkills,
    };

    setSavingExp(true);
    setExpModalError("");

    try {
      let res;
      let targetExpId = editingExpId;

      if (!targetExpId && editingExpIndex !== null && profile?.experience?.[editingExpIndex]) {
        const found = profile.experience[editingExpIndex];
        targetExpId = (found._id || found.id)?.toString();
      }

      if (targetExpId) {
        res = await API.put(`/profile/${profileId}/experience/${targetExpId}`, payload);
      } else {
        res = await API.post(`/profile/${profileId}/experience`, payload);
      }

      const updatedExp = res.data.experience || res.data.user?.experience;
      if (updatedExp) {
        setProfile((prev) => ({ ...prev, experience: updatedExp }));
        if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, experience: updatedExp }));
      }

      setSuccessMsg(targetExpId ? "Experience updated successfully!" : "Experience added successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      resetExpModal();
    } catch (err) {
      console.error("Save experience error:", err);
      const msg = err.response?.data?.message || (editingExpId ? "Failed to update experience" : "Failed to save experience");
      setExpModalError(msg);
      setError(msg);
    } finally {
      setSavingExp(false);
    }
  };

  const handleDeleteExperienceClick = (exp, idx) => {
    if (!isOwner) return;
    const resolvedId = exp?._id ? exp._id.toString() : (exp?.id ? exp.id.toString() : (typeof exp === "string" ? exp : idx));
    setConfirmDeleteExpId(resolvedId);
    setShowDeleteExpModal(true);
  };

  const handleCancelDeleteExperience = () => {
    setShowDeleteExpModal(false);
    setConfirmDeleteExpId(null);
  };

  const handleConfirmDeleteExperience = async () => {
    if (!isOwner || confirmDeleteExpId === null) return;
    const profileId = profile?._id || profile?.id;
    let expId = null;

    if (typeof confirmDeleteExpId === "string") {
      expId = confirmDeleteExpId;
    } else if (typeof confirmDeleteExpId === "number" && profile?.experience?.[confirmDeleteExpId]) {
      const found = profile.experience[confirmDeleteExpId];
      expId = (found._id || found.id)?.toString();
    }

    if (!expId) {
      setShowDeleteExpModal(false);
      setConfirmDeleteExpId(null);
      return;
    }

    setDeletingExp(true);
    try {
      const res = await API.delete(`/profile/${profileId}/experience/${expId}`);
      const updatedExp = res.data.experience || res.data.user?.experience;
      if (updatedExp) {
        setProfile((prev) => ({ ...prev, experience: updatedExp }));
        if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, experience: updatedExp }));
      }
      setSuccessMsg("Experience record deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      setShowDeleteExpModal(false);
      setConfirmDeleteExpId(null);
    } catch (err) {
      console.error("Delete experience error:", err);
      const msg = err.response?.data?.message || "Failed to remove experience";
      setError(msg);
      setShowDeleteExpModal(false);
      setConfirmDeleteExpId(null);
    } finally {
      setDeletingExp(false);
    }
  };

  // Projects Handlers
  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    const profileId = profile?._id || profile?.id;

    const techArray = typeof projectForm.technologies === "string"
      ? projectForm.technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : projectForm.technologies || [];

    const payload = { ...projectForm, technologies: techArray };

    try {
      let res;
      if (editingProjectIndex !== null) {
        const projId = profile.projects[editingProjectIndex]?._id;
        if (projId) {
          res = await API.put(`/profile/${profileId}/projects/${projId}`, payload);
        } else {
          const currentProjects = [...profile.projects];
          currentProjects[editingProjectIndex] = payload;
          res = await API.put(`/profile/${profileId}`, { projects: currentProjects });
        }
      } else {
        res = await API.post(`/profile/${profileId}/projects`, payload);
      }

      const updatedProj = res.data.projects || res.data.user?.projects;
      setProfile((prev) => ({ ...prev, projects: updatedProj }));
      if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, projects: updatedProj }));

      setShowProjectModal(false);
      setEditingProjectIndex(null);
      setProjectForm({ name: "", role: "", description: "", technologies: "", startDate: "", endDate: "", link: "" });
      setSuccessMsg("Project saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save project");
    }
  };

  const handleDeleteProject = async (indexToDelete) => {
    if (!isOwner) return;
    const profileId = profile?._id || profile?.id;
    const proj = profile.projects?.[indexToDelete];

    try {
      let res;
      if (proj?._id) {
        res = await API.delete(`/profile/${profileId}/projects/${proj._id}`);
      } else {
        const currentProjects = (profile.projects || []).filter((_, idx) => idx !== indexToDelete);
        res = await API.put(`/profile/${profileId}`, { projects: currentProjects });
      }
      const updatedProj = res.data.projects || res.data.user?.projects;
      setProfile((prev) => ({ ...prev, projects: updatedProj }));
      if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, projects: updatedProj }));
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  // Certification Handlers
  const resetCertModal = () => {
    setShowCertModal(false);
    setEditingCertIndex(null);
    setEditingCertId(null);
    setSavingCert(false);
    setCertModalError("");
    setCertForm({
      _id: "",
      name: "",
      organization: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
      certificateFile: "",
    });
  };

  const handleEditCertification = (cert, idx) => {
    if (!cert) return;
    const resolvedId = cert._id ? cert._id.toString() : (cert.id ? cert.id.toString() : null);
    setEditingCertId(resolvedId);
    setEditingCertIndex(idx);
    setCertModalError("");
    setSavingCert(false);
    setCertForm({
      _id: resolvedId || "",
      name: cert.name || cert.certificateName || "",
      organization: cert.organization || cert.issuingOrganization || "",
      issueDate: cert.issueDate || "",
      expiryDate: cert.expiryDate || "",
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || "",
      certificateFile: cert.certificateFile || "",
    });
    setShowCertModal(true);
  };

  const handleAddCertification = () => {
    resetCertModal();
    setShowCertModal(true);
  };

  const handleSaveCertification = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    const profileId = profile?._id || profile?.id;

    const nameTrimmed = (certForm.name || "").trim();
    const orgTrimmed = (certForm.organization || "").trim();

    if (!nameTrimmed) {
      setCertModalError("Certificate Name is required.");
      return;
    }
    if (!orgTrimmed) {
      setCertModalError("Issuing Organization is required.");
      return;
    }

    const payload = {
      name: nameTrimmed,
      organization: orgTrimmed,
      issueDate: (certForm.issueDate || "").trim(),
      expiryDate: (certForm.expiryDate || "").trim(),
      credentialId: (certForm.credentialId || "").trim(),
      credentialUrl: (certForm.credentialUrl || "").trim(),
      certificateFile: (certForm.certificateFile || "").trim(),
    };

    setSavingCert(true);
    setCertModalError("");

    try {
      let res;
      let targetCertId = editingCertId;

      if (!targetCertId && editingCertIndex !== null && profile?.certifications?.[editingCertIndex]) {
        const found = profile.certifications[editingCertIndex];
        targetCertId = (found._id || found.id)?.toString();
      }

      if (targetCertId) {
        res = await API.put(`/profile/${profileId}/certifications/${targetCertId}`, payload);
      } else {
        res = await API.post(`/profile/${profileId}/certifications`, payload);
      }

      const updatedCerts = res.data.certifications || res.data.user?.certifications;
      if (updatedCerts) {
        setProfile((prev) => ({ ...prev, certifications: updatedCerts }));
        if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, certifications: updatedCerts }));
      }

      setSuccessMsg(targetCertId ? "Certification updated successfully!" : "Certification added successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      resetCertModal();
    } catch (err) {
      console.error("Save certification error:", err);
      const msg = err.response?.data?.message || (editingCertId ? "Failed to update certification" : "Failed to save certification");
      setCertModalError(msg);
      setError(msg);
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteCertClick = (cert, idx) => {
    if (!isOwner) return;
    const resolvedId = cert?._id ? cert._id.toString() : (cert?.id ? cert.id.toString() : (typeof cert === "string" ? cert : idx));
    setConfirmDeleteCertId(resolvedId);
    setConfirmDeleteCertName(cert?.name || "this certification");
    setShowDeleteCertModal(true);
  };

  const handleCancelDeleteCertification = () => {
    setShowDeleteCertModal(false);
    setConfirmDeleteCertId(null);
    setConfirmDeleteCertName("");
  };

  const handleConfirmDeleteCertification = async () => {
    if (!isOwner || confirmDeleteCertId === null) return;
    const profileId = profile?._id || profile?.id;
    let certId = null;

    if (typeof confirmDeleteCertId === "string") {
      certId = confirmDeleteCertId;
    } else if (typeof confirmDeleteCertId === "number" && profile?.certifications?.[confirmDeleteCertId]) {
      const found = profile.certifications[confirmDeleteCertId];
      certId = (found._id || found.id)?.toString();
    }

    if (!certId) {
      setShowDeleteCertModal(false);
      setConfirmDeleteCertId(null);
      setConfirmDeleteCertName("");
      return;
    }

    setDeletingCert(true);
    try {
      const res = await API.delete(`/profile/${profileId}/certifications/${certId}`);
      const updatedCerts = res.data.certifications || res.data.user?.certifications;
      if (updatedCerts) {
        setProfile((prev) => ({ ...prev, certifications: updatedCerts }));
        if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, certifications: updatedCerts }));
      }
      setSuccessMsg("Certification removed successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      setShowDeleteCertModal(false);
      setConfirmDeleteCertId(null);
      setConfirmDeleteCertName("");
    } catch (err) {
      console.error("Delete certification error:", err);
      const msg = err.response?.data?.message || "Failed to remove certification";
      setError(msg);
      setShowDeleteCertModal(false);
      setConfirmDeleteCertId(null);
      setConfirmDeleteCertName("");
    } finally {
      setDeletingCert(false);
    }
  };

  // Achievements Handlers
  const resetAchievementModal = () => {
    setShowAchievementModal(false);
    setEditingAchievementIndex(null);
    setEditingAchievementId(null);
    setSavingAchievement(false);
    setAchievementModalError("");
    setAchievementForm({
      _id: "",
      title: "",
      organization: "",
      date: "",
      category: "Award",
      description: "",
      credentialUrl: "",
      proofFile: "",
    });
  };

  const handleAddAchievement = () => {
    resetAchievementModal();
    setShowAchievementModal(true);
  };

  const handleEditAchievement = (ach, idx) => {
    if (!ach) return;
    const resolvedId = ach._id ? ach._id.toString() : (ach.id ? ach.id.toString() : null);
    setEditingAchievementId(resolvedId);
    setEditingAchievementIndex(idx);
    setAchievementModalError("");
    setSavingAchievement(false);
    setAchievementForm({
      _id: resolvedId || "",
      title: ach.title || "",
      organization: ach.organization || "",
      date: ach.date || "",
      category: ach.category || "Award",
      description: ach.description || "",
      credentialUrl: ach.credentialUrl || "",
      proofFile: ach.proofFile || "",
    });
    setShowAchievementModal(true);
  };

  const handleAchievementProofUpload = async (e) => {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("certificate", file);

    setUploadingAchievementProof(true);
    setAchievementModalError("");
    try {
      const res = await API.post("/users/upload-certificate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAchievementForm((prev) => ({ ...prev, proofFile: res.data.fileUrl }));
      setSuccessMsg("Achievement proof uploaded!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Upload achievement proof error:", err);
      const msg = err.response?.data?.message || "Failed to upload proof document";
      setAchievementModalError(msg);
      setError(msg);
    } finally {
      setUploadingAchievementProof(false);
      if (achievementFileInputRef.current) achievementFileInputRef.current.value = "";
    }
  };

  const handleSaveAchievement = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    const profileId = profile?._id || profile?.id;

    const titleTrimmed = (achievementForm.title || "").trim();
    if (!titleTrimmed) {
      setAchievementModalError("Honor / Award Title is required.");
      return;
    }

    const payload = {
      title: titleTrimmed,
      organization: (achievementForm.organization || "").trim(),
      date: (achievementForm.date || "").trim(),
      category: achievementForm.category || "Award",
      description: (achievementForm.description || "").trim(),
      credentialUrl: (achievementForm.credentialUrl || "").trim(),
      proofFile: (achievementForm.proofFile || "").trim(),
    };

    setSavingAchievement(true);
    setAchievementModalError("");

    try {
      let res;
      let targetId = editingAchievementId;

      if (!targetId && editingAchievementIndex !== null && profile?.achievements?.[editingAchievementIndex]) {
        const found = profile.achievements[editingAchievementIndex];
        targetId = (found._id || found.id)?.toString();
      }

      if (targetId) {
        res = await API.put(`/profile/${profileId}/achievements/${targetId}`, payload);
      } else {
        res = await API.post(`/profile/${profileId}/achievements`, payload);
      }

      const updatedAchievements = res.data.achievements || res.data.user?.achievements;
      if (updatedAchievements) {
        setProfile((prev) => ({ ...prev, achievements: updatedAchievements }));
        if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, achievements: updatedAchievements }));
      }

      setSuccessMsg(targetId ? "Achievement updated successfully!" : "Achievement added successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      resetAchievementModal();
    } catch (err) {
      console.error("Save achievement error:", err);
      const msg = err.response?.data?.message || (editingAchievementId ? "Failed to update achievement" : "Failed to save achievement");
      setAchievementModalError(msg);
      setError(msg);
    } finally {
      setSavingAchievement(false);
    }
  };

  const handleDeleteAchievementClick = (ach, idx) => {
    if (!isOwner) return;
    const resolvedId = ach?._id ? ach._id.toString() : (ach?.id ? ach.id.toString() : (typeof ach === "string" ? ach : idx));
    setConfirmDeleteAchievementId(resolvedId);
    setConfirmDeleteAchievementTitle(ach?.title || "this achievement");
    setShowDeleteAchievementModal(true);
  };

  const handleCancelDeleteAchievement = () => {
    setShowDeleteAchievementModal(false);
    setConfirmDeleteAchievementId(null);
    setConfirmDeleteAchievementTitle("");
  };

  const handleConfirmDeleteAchievement = async () => {
    if (!isOwner || confirmDeleteAchievementId === null) return;
    const profileId = profile?._id || profile?.id;
    let achievementId = null;

    if (typeof confirmDeleteAchievementId === "string") {
      achievementId = confirmDeleteAchievementId;
    } else if (typeof confirmDeleteAchievementId === "number" && profile?.achievements?.[confirmDeleteAchievementId]) {
      const found = profile.achievements[confirmDeleteAchievementId];
      achievementId = (found._id || found.id)?.toString();
    }

    if (!achievementId) {
      setShowDeleteAchievementModal(false);
      setConfirmDeleteAchievementId(null);
      setConfirmDeleteAchievementTitle("");
      return;
    }

    setDeletingAchievement(true);
    try {
      const res = await API.delete(`/profile/${profileId}/achievements/${achievementId}`);
      const updatedAchievements = res.data.achievements || res.data.user?.achievements;
      if (updatedAchievements) {
        setProfile((prev) => ({ ...prev, achievements: updatedAchievements }));
        if (setCurrentUser) setCurrentUser((prev) => ({ ...prev, achievements: updatedAchievements }));
      }
      setSuccessMsg("Achievement removed successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      setShowDeleteAchievementModal(false);
      setConfirmDeleteAchievementId(null);
      setConfirmDeleteAchievementTitle("");
    } catch (err) {
      console.error("Delete achievement error:", err);
      const msg = err.response?.data?.message || "Failed to remove achievement";
      setError(msg);
      setShowDeleteAchievementModal(false);
      setConfirmDeleteAchievementId(null);
      setConfirmDeleteAchievementTitle("");
    } finally {
      setDeletingAchievement(false);
    }
  };

  const handleShareProfile = () => {
    const profileUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setSuccessMsg("Profile link copied to clipboard!");
      setTimeout(() => setSuccessMsg(""), 3500);
    }
  };

  // Professional Full Skeleton Loader
  if (loading || authLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          {/* Skeleton Hero Header */}
          <div className="profile-hero-card mb-6" style={{ overflow: 'hidden' }}>
            <div style={{ height: '240px', background: '#e2e8f0' }} />
            <div className="profile-hero-body">
              <div className="profile-hero-header-row">
                <div style={{ marginTop: '-60px', width: '130px', height: '130px', borderRadius: '50%', background: '#cbd5e1', border: '5px solid white' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: '120px', height: '40px', borderRadius: '12px', background: '#e2e8f0' }} />
                  <div style={{ width: '90px', height: '40px', borderRadius: '12px', background: '#e2e8f0' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <div style={{ width: '220px', height: '28px', borderRadius: '8px', background: '#cbd5e1' }} />
                <div style={{ width: '320px', height: '18px', borderRadius: '6px', background: '#e2e8f0' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State Handling
  if (error && !profile) {
    return (
      <div className="profile-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="profile-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <AlertCircle size={48} style={{ color: '#dc2626', margin: '0 auto 1rem' }} />
          <h3 className="profile-card-title" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Profile Not Available</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="profile-btn-secondary"
            >
              Go Back
            </button>
            <Link to="/people" className="profile-btn-primary">
              Discover Alumni
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Refined Executive Deep Navy Default Banner
  const defaultCoverGradient = "linear-gradient(135deg, #090e1a 0%, #0f172a 50%, #1e1b4b 100%)";

  // Dynamic Role Badge Helper
  const renderRoleBadge = () => {
    const roleVal = profile?.role;
    const typeVal = profile?.userType;

    if (roleVal === "superadmin" || roleVal === "subadmin" || roleVal === "admin") {
      return (
        <span className="role-badge-pill role-badge-admin">
          <ShieldCheck size={13} />
          <span>{roleVal === "superadmin" ? "Super Admin" : "Admin"}</span>
        </span>
      );
    }

    if (typeVal === "Current Student" || roleVal === "student") {
      return (
        <span className="role-badge-pill role-badge-student">
          <BookOpen size={13} />
          <span>Current Student</span>
        </span>
      );
    }

    return (
      <span className="role-badge-pill role-badge-alumni">
        <CheckCircle size={13} />
        <span>Verified Alumni</span>
      </span>
    );
  };

  const currentRoleHeadline = profile?.jobTitle
    ? `${profile.jobTitle}${profile.company ? ` at ${profile.company}` : ""}`
    : profile?.headline || (profile?.userType === "Current Student" ? `Student at ${profile?.college || "GradConnect Central University"}` : "GradConnect Member");

  if (loading || authLoading) {
    return (
      <div className="profile-page flex-center" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 1rem", color: "var(--primary-color, #dc2626)" }} />
          <p style={{ color: "var(--text-muted, #64748b)", fontWeight: 600 }}>Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page flex-center" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "480px", width: "100%", textAlign: "center", background: "var(--card-bg, #ffffff)", padding: "3rem 2rem", borderRadius: "16px", border: "1px solid var(--border-color, #e2e8f0)", boxShadow: "var(--shadow, 0 4px 12px rgba(0,0,0,0.08))" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem", color: "var(--dark-color, #0f172a)" }}>
            Profile Not Found
          </h2>
          <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            The requested member profile does not exist or is not publicly accessible. Administrative and private accounts cannot be viewed in the community directory.
          </p>
          <Link
            to="/people"
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "8px", textDecoration: "none" }}
          >
            <Users size={16} />
            <span>Discover Community Members</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Hidden File Upload Inputs (Owner Mode Only) */}
        {isOwner && (
          <>
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden-file-input"
            />
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden-file-input"
            />
            <input
              type="file"
              ref={resumeInputRef}
              onChange={handleResumeUpload}
              accept=".pdf,.doc,.docx"
              className="hidden-file-input"
            />
          </>
        )}

        {/* Alerts Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '0.825rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(4, 120, 87, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={17} style={{ color: '#059669', flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg("")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857' }}>
                <X size={15} />
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.825rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(153, 27, 27, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={17} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
           1. HERO PROFILE CARD
           ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-hero-card"
        >
          {/* Executive Deep Navy Cover Banner */}
          <div
            className="profile-banner-hero"
            style={{
              backgroundImage: profile?.coverImage ? `url(${getImageUrl(profile.coverImage)})` : undefined,
              background: !profile?.coverImage ? defaultCoverGradient : undefined,
            }}
          >
            {isOwner && (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="profile-cover-btn"
                title="Change Cover Banner"
              >
                <Camera size={15} />
                <span>{uploadingCover ? "Uploading..." : "Change Cover"}</span>
              </button>
            )}
          </div>

          {/* Profile Header Details Area */}
          <div className="profile-hero-body">
            <div className="profile-hero-header-row">
              {/* Overlapping Avatar */}
              <div className="profile-avatar-container">
                {profile?.avatar ? (
                  <img src={getImageUrl(profile.avatar)} alt={profile.name} className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-fallback">
                    {profile?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}

                {/* Camera Overlay ONLY for owner */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="avatar-camera-overlay"
                    title="Change Profile Picture"
                  >
                    {uploadingAvatar ? <Loader2 size={15} className="animate-spin" /> : <Camera size={16} />}
                  </button>
                )}
              </div>

              {/* Action Buttons: Differentiated for Owner vs Non-Owner */}
              <div className="profile-action-group">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowEditMainModal(true)}
                      className="profile-btn-primary"
                    >
                      <Edit3 size={15} />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="profile-btn-secondary"
                      title="Share profile link"
                    >
                      <Share2 size={15} />
                      <span>Share Profile</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Non-Owner interactive follow button with recipient notification */}
                    <div className="profile-follow-wrap">
                      <FollowButton
                        userId={profile?._id || profile?.id}
                        userName={profile?.name}
                        onFollowChange={(isFollowing) => {
                          setProfile((prev) => ({
                            ...prev,
                            followersCount: Math.max(0, (prev?.followersCount || 0) + (isFollowing ? 1 : -1)),
                          }));
                        }}
                      />
                    </div>

                    <Link
                      to="/people"
                      className="profile-btn-primary"
                    >
                      <MessageSquare size={15} />
                      <span>Message</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="profile-btn-secondary"
                      title="Share profile link"
                    >
                      <Share2 size={15} />
                      <span>Share</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Identity & Headlines */}
            <div>
              <div className="profile-name-badge-row">
                <h1 className="profile-title-name">
                  {profile?.name}
                </h1>
                {renderRoleBadge()}
              </div>

              {/* Current Role / Position */}
              <p className="profile-current-role">
                {currentRoleHeadline}
              </p>

              {/* Short Bio Headline if distinct */}
              {profile?.headline && profile.headline !== profile.jobTitle && (
                <p className="profile-headline-bio">
                  {profile.headline}
                </p>
              )}

              {/* Registration Data Metadata Badges Row */}
              <div className="profile-metadata-strip">
                {profile?.department && (
                  <span className="profile-meta-item">
                    <GraduationCap size={15} style={{ color: '#2563eb' }} />
                    <span>
                      {profile.department}
                      {profile.college ? ` • ${profile.college}` : ""}
                      {profile.batch ? ` • Batch ${profile.batch}` : profile.graduationYear ? ` • Class of ${profile.graduationYear}` : ""}
                    </span>
                  </span>
                )}

                {(profile?.city || profile?.country) && (
                  <span className="profile-meta-item">
                    <MapPin size={15} style={{ color: '#dc2626' }} />
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </span>
                )}

                {profile?.company && (
                  <span className="profile-meta-item">
                    <Building size={15} style={{ color: '#059669' }} />
                    <span>{profile.company}</span>
                  </span>
                )}

                {(profile?.interestedField || profile?.industry) && (
                  <span className="profile-meta-item">
                    <Compass size={15} style={{ color: '#7c3aed' }} />
                    <span>{profile.interestedField || profile.industry}</span>
                  </span>
                )}
              </div>

              {/* Networking Stats Bar */}
              <div className="profile-stats-bar">
                <span className="profile-stat-item">
                  <UserCheck size={15} style={{ color: '#2563eb' }} />
                  <span><strong>{profile?.connections?.length || 0}</strong> Connections</span>
                </span>
                <span className="profile-stat-dot" />
                <span className="profile-stat-item">
                  <Users size={15} style={{ color: '#7c3aed' }} />
                  <span><strong>{profile?.followersCount || 0}</strong> Followers</span>
                </span>
                <span className="profile-stat-dot" />
                <span className="profile-stat-item">
                  <span><strong>{profile?.followingCount || 0}</strong> Following</span>
                </span>

                {profile?.willingToMentor && (
                  <span className="profile-status-mentor">
                    <Heart size={12} style={{ fill: '#2563eb', color: '#2563eb' }} />
                    <span>Willing to Mentor</span>
                  </span>
                )}
                {profile?.openToReferrals && (
                  <span className="profile-status-referrals">
                    <Sparkles size={12} style={{ color: '#059669' }} />
                    <span>Open to Referrals</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================
           2. TWO-COLUMN MAIN GRID LAYOUT
           ============================================================ */}
        <div className="profile-grid-layout">

          {/* LEFT MAIN COLUMN (~70%) */}
          <div className="profile-main-col">

            {/* 1. ABOUT & SKILLS SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                    <UserIcon size={18} />
                  </div>
                  <h2 className="profile-section-title">About</h2>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setAboutBioText(profile?.bio || "");
                      setShowAboutModal(true);
                    }}
                    className="profile-section-action-btn"
                    title="Edit summary"
                  >
                    <Edit3 size={13} />
                    <span>{profile?.bio ? "Edit" : "Add"}</span>
                  </button>
                )}
              </div>

              {profile?.bio ? (
                <p className="profile-editorial-text">
                  {profile.bio}
                </p>
              ) : (
                <div className="profile-empty-compact" style={{ marginBottom: '1.25rem' }}>
                  <UserIcon size={26} className="profile-empty-icon" />
                  <h5 className="profile-empty-title">
                    {isOwner ? "No professional summary added yet" : "No summary provided yet"}
                  </h5>
                  <p className="profile-empty-text">
                    {isOwner
                      ? "Add a brief summary describing your background, skills, and career focus."
                      : "This member has not written an about summary yet."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setAboutBioText("");
                        setShowAboutModal(true);
                      }}
                      className="profile-empty-btn"
                    >
                      <Plus size={13} />
                      <span>Add Summary</span>
                    </button>
                  )}
                </div>
              )}

            </motion.div>

            {/* 2. EXPERIENCE SECTION (VERTICAL TIMELINE) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    <Briefcase size={18} />
                  </div>
                  <h2 className="profile-section-title">Experience</h2>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="profile-section-action-btn"
                  >
                    <Plus size={13} />
                    <span>Add Experience</span>
                  </button>
                )}
              </div>

              {Array.isArray(profile?.experience) && profile.experience.length > 0 ? (
                <div className="profile-career-timeline">
                  <div className="profile-timeline-spine" />
                  {profile.experience.map((exp, idx) => (
                    <div key={exp._id || exp.id || idx} className="profile-timeline-entry">
                      <div className="profile-timeline-node" />
                      <div className="profile-entry-header">
                        <div>
                          <h4 className="profile-entry-title">{exp.title || exp.jobTitle}</h4>
                          <p className="profile-entry-subtitle">
                            {[exp.company, exp.employmentType, exp.location].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                        {isOwner && (
                          <div className="profile-entry-actions">
                            <button
                              type="button"
                              onClick={() => handleEditExperience(exp, idx)}
                              className="profile-entry-btn"
                              title="Edit experience"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperienceClick(exp, idx)}
                              className="profile-entry-btn profile-entry-btn-danger"
                              title="Delete experience"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="profile-entry-meta">
                        {exp.currentlyWorking
                          ? `${exp.startDate || "Started"} — Present`
                          : exp.startDate && exp.endDate
                          ? `${exp.startDate} — ${exp.endDate}`
                          : exp.startDate || exp.endDate || "Dates not specified"}
                      </p>
                      {exp.description && (
                        <p className="profile-entry-desc">
                          {exp.description}
                        </p>
                      )}
                      {exp.skills && (Array.isArray(exp.skills) ? exp.skills.length > 0 : Boolean(exp.skills)) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Skills:</span>
                          {(Array.isArray(exp.skills) ? exp.skills : String(exp.skills).split(",")).map((s, i) => (
                            <span key={i} className="profile-project-pill">
                              {String(s).trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-compact">
                  <Briefcase size={26} className="profile-empty-icon" />
                  <h5 className="profile-empty-title">
                    {isOwner ? "No professional experience added yet" : "No professional experience listed"}
                  </h5>
                  <p className="profile-empty-text">
                    {isOwner
                      ? "Highlight past roles, internships, or current tech engineering positions."
                      : "This member has not listed work experience entries yet."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="profile-empty-btn"
                    >
                      <Plus size={13} />
                      <span>Add Experience</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* 3. EDUCATION SECTION (ACADEMIC TIMELINE) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                    <GraduationCap size={18} />
                  </div>
                  <h2 className="profile-section-title">Education</h2>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEduIndex(null);
                      setEduForm({ school: "", degree: "", fieldOfStudy: "", startYear: "", endYear: "", grade: "", description: "" });
                      setShowEduModal(true);
                    }}
                    className="profile-section-action-btn"
                  >
                    <Plus size={13} />
                    <span>Add Education</span>
                  </button>
                )}
              </div>

              <div className="profile-academic-list">
                {/* Default Academic Institution from Profile/Registration */}
                {(profile?.department || profile?.college) && (
                  <div className="profile-academic-item">
                    <div className="profile-academic-badge">
                      <GraduationCap size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="profile-entry-title">
                        {profile.college || "GradConnect Central University"}
                      </h4>
                      <p className="profile-entry-subtitle" style={{ color: '#4338ca' }}>
                        {profile.degree || "Bachelor of Technology"} {profile.department ? `• ${profile.department}` : ""}
                      </p>
                      <p className="profile-entry-meta">
                        {profile.batch ? `Batch ${profile.batch}` : profile.graduationYear ? `Class of ${profile.graduationYear}` : "Current Student / Alumni"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Education Entries */}
                {Array.isArray(profile?.education) && profile.education.map((edu, idx) => (
                  <div key={edu._id || idx} className="profile-academic-item">
                    <div className="profile-academic-badge">
                      <BookOpen size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="profile-entry-header">
                        <div>
                          <h4 className="profile-entry-title">{edu.school}</h4>
                          <p className="profile-entry-subtitle" style={{ color: '#4338ca' }}>
                            {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                          </p>
                        </div>
                        {isOwner && (
                          <div className="profile-entry-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEduIndex(idx);
                                setEduForm(edu);
                                setShowEduModal(true);
                              }}
                              className="profile-entry-btn"
                              title="Edit education"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEducation(idx)}
                              className="profile-entry-btn profile-entry-btn-danger"
                              title="Delete education"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="profile-entry-meta">
                        {[edu.startYear, edu.endYear].filter(Boolean).join(" — ") || "Graduation"} {edu.grade ? `• Grade: ${edu.grade}` : ""}
                      </p>

                      {edu.description && (
                        <p className="profile-entry-desc">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 4. FEATURED PROJECTS SECTION (PORTFOLIO GRID) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                    <Code2 size={18} />
                  </div>
                  <h2 className="profile-section-title">Projects</h2>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProjectIndex(null);
                      setProjectForm({ name: "", role: "", description: "", technologies: "", startDate: "", endDate: "", link: "" });
                      setShowProjectModal(true);
                    }}
                    className="profile-section-action-btn"
                  >
                    <Plus size={13} />
                    <span>Add Project</span>
                  </button>
                )}
              </div>

              {Array.isArray(profile?.projects) && profile.projects.length > 0 ? (
                <div className="profile-projects-grid">
                  {profile.projects.map((proj, idx) => (
                    <div key={proj._id || idx} className="profile-project-card">
                      <div>
                        <div className="profile-project-card-header">
                          <h4 className="profile-project-title">{proj.name}</h4>
                          {isOwner && (
                            <div className="profile-entry-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProjectIndex(idx);
                                  setProjectForm({
                                    ...proj,
                                    technologies: Array.isArray(proj.technologies) ? proj.technologies.join(", ") : proj.technologies || "",
                                  });
                                  setShowProjectModal(true);
                                }}
                                className="profile-entry-btn"
                                title="Edit project"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(idx)}
                                className="profile-entry-btn profile-entry-btn-danger"
                                title="Delete project"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                        {proj.role && (
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', margin: '0 0 0.35rem 0' }}>
                            {proj.role}
                          </p>
                        )}

                        {(proj.startDate || proj.endDate) && (
                          <p className="profile-entry-meta">
                            {[proj.startDate, proj.endDate].filter(Boolean).join(" — ")}
                          </p>
                        )}

                        {proj.description && (
                          <p className="profile-project-desc">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <div>
                        {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                          <div className="profile-project-tech-strip">
                            {proj.technologies.map((t, i) => (
                              <span key={i} className="profile-project-pill">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {proj.link && (
                          <a
                            href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="profile-project-link-btn"
                          >
                            <span>View Project</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-compact">
                  <Code2 size={26} className="profile-empty-icon" />
                  <h5 className="profile-empty-title">
                    {isOwner ? "No projects showcased yet" : "No projects showcased"}
                  </h5>
                  <p className="profile-empty-text">
                    {isOwner
                      ? "Add your capstone applications, GitHub repositories, or hackathon creations."
                      : "This member has not added projects to their portfolio yet."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProjectIndex(null);
                        setProjectForm({ name: "", role: "", description: "", technologies: "", startDate: "", endDate: "", link: "" });
                        setShowProjectModal(true);
                      }}
                      className="profile-empty-btn"
                    >
                      <Plus size={13} />
                      <span>Add Project</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* 5. LICENSES & CERTIFICATIONS SECTION (CREDENTIAL ROWS) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
                    <Award size={18} />
                  </div>
                  <h2 className="profile-section-title">Licenses &amp; Certifications</h2>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="profile-section-action-btn"
                  >
                    <Plus size={13} />
                    <span>Add Certification</span>
                  </button>
                )}
              </div>

              {Array.isArray(profile?.certifications) && profile.certifications.length > 0 ? (
                <div>
                  {profile.certifications.map((cert, idx) => (
                    <div key={cert._id || idx} className="profile-credential-row">
                      <div className="profile-credential-left">
                        <div className="profile-credential-badge">
                          <Award size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 className="profile-entry-title">{cert.name}</h4>
                          <p className="profile-entry-subtitle" style={{ color: '#b45309' }}>{cert.organization}</p>
                          {cert.issueDate && (
                            <p className="profile-entry-meta">
                              Issued {cert.issueDate} {cert.expiryDate ? `• Expires ${cert.expiryDate}` : ""}
                            </p>
                          )}
                          {cert.credentialId && (
                            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'monospace', margin: '0.15rem 0 0 0' }}>
                              Credential ID: {cert.credentialId}
                            </p>
                          )}

                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                            {cert.certificateFile && (
                              <button
                                type="button"
                                onClick={() => setCertPreviewModal({ open: true, url: getImageUrl(cert.certificateFile), title: cert.name })}
                                className="profile-section-action-btn"
                                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                              >
                                <Eye size={12} />
                                <span>View Certificate</span>
                              </button>
                            )}

                            {cert.credentialUrl && (
                              <a
                                href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="profile-section-action-btn"
                              >
                                <span>Verify Credential</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="profile-entry-actions">
                          <button
                            type="button"
                            onClick={() => handleEditCertification(cert, idx)}
                            className="profile-entry-btn"
                            title="Edit certification"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCertClick(cert, idx)}
                            className="profile-entry-btn profile-entry-btn-danger"
                            title="Delete certification"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-compact">
                  <Award size={26} className="profile-empty-icon" />
                  <h5 className="profile-empty-title">
                    {isOwner ? "No certifications added yet" : "No certifications listed"}
                  </h5>
                  <p className="profile-empty-text">
                    {isOwner
                      ? "Showcase credentials from AWS, Google Cloud, Meta, Cisco, Coursera, or industry certifications."
                      : "This member has not added professional certifications yet."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleAddCertification}
                      className="profile-empty-btn"
                    >
                      <Plus size={13} />
                      <span>Add Certification</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* 6. DOCUMENTS & PORTFOLIO SECTION (FILE MANAGER VIEW) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                    <FileCheck size={18} />
                  </div>
                  <div>
                    <h2 className="profile-section-title">Documents &amp; Portfolio</h2>
                  </div>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocFile(null);
                      setDocForm({ name: "" });
                      setDocModalError("");
                      setShowDocUploadModal(true);
                    }}
                    className="profile-section-action-btn"
                  >
                    <Upload size={13} />
                    <span>Upload Document</span>
                  </button>
                )}
              </div>

              {Array.isArray(profile?.documents) && profile.documents.length > 0 ? (
                <div>
                  {profile.documents.map((doc, idx) => {
                    const ext = doc.fileType ? doc.fileType.toLowerCase() : "pdf";
                    const badgeClass = ext === "pdf" ? "document-type-pdf" : ext === "doc" || ext === "docx" ? "document-type-doc" : "document-type-img";
                    return (
                      <div key={doc._id || idx} className="profile-file-row">
                        <div className="profile-file-left">
                          <span className={`document-type-badge ${badgeClass}`}>
                            {doc.fileType || "DOC"}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <h5 className="profile-file-name">{doc.name}</h5>
                            <p className="profile-file-meta">
                              Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "Recently"}
                            </p>
                          </div>
                        </div>

                        <div className="profile-entry-actions">
                          <a
                            href={getImageUrl(doc.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="profile-section-action-btn"
                            title="View or download document"
                          >
                            <ExternalLink size={12} />
                            <span>View</span>
                          </a>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDocClick(doc, idx)}
                              className="profile-entry-btn profile-entry-btn-danger"
                              title="Delete document"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="profile-empty-compact">
                  <FileText size={26} className="profile-empty-icon" />
                  <h5 className="profile-empty-title">
                    {isOwner ? "No documents uploaded yet" : "No documents shared"}
                  </h5>
                  <p className="profile-empty-text">
                    {isOwner
                      ? "Upload capstone project documentation, academic transcripts, or recommendation letters (PDF, DOCX up to 10MB)."
                      : "This member has not shared public portfolio documents."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocFile(null);
                        setDocForm({ name: "" });
                        setDocModalError("");
                        setShowDocUploadModal(true);
                      }}
                      className="profile-empty-btn"
                    >
                      <Upload size={13} />
                      <span>Upload Document</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* 7. HONORS & ACHIEVEMENTS SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#f5f3ff', color: '#6d28d9' }}>
                    <Trophy size={18} />
                  </div>
                  <h2 className="profile-section-title">Honors &amp; Achievements</h2>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleAddAchievement}
                    className="profile-section-action-btn"
                  >
                    <Plus size={13} />
                    <span>Add Achievement</span>
                  </button>
                )}
              </div>

              {Array.isArray(profile?.achievements) && profile.achievements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {profile.achievements.map((ach, idx) => (
                    <div key={ach._id || idx} className="profile-achievement-item">
                      <div className="profile-achievement-icon">
                        <Trophy size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="profile-entry-header">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <h4 className="profile-entry-title">{ach.title}</h4>
                              {ach.category && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  backgroundColor: '#ede9fe',
                                  color: '#6d28d9',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em'
                                }}>
                                  {ach.category}
                                </span>
                              )}
                            </div>
                            {ach.organization && <p className="profile-entry-subtitle" style={{ color: '#6d28d9' }}>{ach.organization}</p>}
                          </div>
                          {isOwner && (
                            <div className="profile-entry-actions">
                              <button
                                type="button"
                                onClick={() => handleEditAchievement(ach, idx)}
                                className="profile-entry-btn"
                                title="Edit achievement"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAchievementClick(ach, idx)}
                                className="profile-entry-btn profile-entry-btn-danger"
                                title="Delete achievement"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                        {ach.date && (
                          <p className="profile-entry-meta">
                            {ach.date}
                          </p>
                        )}

                        {ach.description && (
                          <p className="profile-entry-desc">
                            {ach.description}
                          </p>
                        )}

                        {(ach.proofFile || ach.credentialUrl) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {ach.proofFile && (
                              <button
                                type="button"
                                onClick={() =>
                                  setCertPreviewModal({
                                    open: true,
                                    url: getImageUrl(ach.proofFile),
                                    title: ach.title || "Achievement Proof",
                                  })
                                }
                                className="profile-section-action-btn"
                                style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}
                              >
                                <Eye size={12} />
                                <span>View Proof</span>
                              </button>
                            )}

                            {ach.credentialUrl && (
                              <a
                                href={ach.credentialUrl.startsWith("http") ? ach.credentialUrl : `https://${ach.credentialUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-section-action-btn"
                              >
                                <ExternalLink size={12} />
                                <span>Verify Credential</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-compact">
                  <Trophy size={26} className="profile-empty-icon" />
                  <h5 className="profile-empty-title">
                    {isOwner ? "No honors or achievements added yet" : "No achievements listed"}
                  </h5>
                  <p className="profile-empty-text">
                    {isOwner
                      ? "Highlight hackathons, academic honors, coding competitions, or university awards."
                      : "This member has not added honors or achievements yet."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleAddAchievement}
                      className="profile-empty-btn"
                    >
                      <Plus size={13} />
                      <span>Add Achievement</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* 8. USER ACTIVITY FEED (BLOGS & EVENTS) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="profile-section"
            >
              <div className="profile-section-header">
                <div className="profile-section-title-group">
                  <div className="profile-section-icon" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                    <Sparkles size={18} />
                  </div>
                  <h2 className="profile-section-title">Activity &amp; Contributions</h2>
                </div>

                <div className="profile-activity-nav">
                  <button
                    type="button"
                    onClick={() => setActiveTab("blogs")}
                    className={`profile-activity-tab ${activeTab === "blogs" ? "active" : ""}`}
                  >
                    Articles ({userActivity.blogs?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("events")}
                    className={`profile-activity-tab ${activeTab === "events" ? "active" : ""}`}
                  >
                    Events ({userActivity.events?.length || 0})
                  </button>
                </div>
              </div>

              {activeTab === "blogs" ? (
                userActivity.blogs?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {userActivity.blogs.map((b) => (
                      <Link
                        key={b._id}
                        to={`/blog/${b.slug}`}
                        className="profile-activity-item"
                      >
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'inline-block', marginBottom: '0.25rem' }}>
                            {b.category || "Article"}
                          </span>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</h4>
                          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                            {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-compact">
                    <BookOpen size={24} className="profile-empty-icon" />
                    <h5 className="profile-empty-title">No published articles yet</h5>
                    <p className="profile-empty-text">Published career stories, domain tutorials, or interview guides will appear here.</p>
                  </div>
                )
              ) : (
                userActivity.events?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {userActivity.events.map((e) => (
                      <div key={e._id} className="profile-activity-item">
                        <div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{e.title}</h4>
                          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} style={{ color: '#2563eb' }} />
                            <span>{new Date(e.eventDate).toLocaleDateString()}</span>
                          </p>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                          Registered
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-compact">
                    <Calendar size={24} className="profile-empty-icon" />
                    <h5 className="profile-empty-title">No scheduled events yet</h5>
                    <p className="profile-empty-text">Upcoming webinars, networking sessions, and alumni meetups will show here.</p>
                  </div>
                )
              )}
            </motion.div>

          </div>

          {/* RIGHT SIDEBAR COLUMN (~30%) */}
          <div className="profile-sidebar-col">

            {/* PROFILE SNAPSHOT & DETAILS PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="profile-sidebar-card"
            >
              <div className="profile-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={17} style={{ color: '#2563eb' }} />
                  <h3 className="profile-sidebar-title">Profile Snapshot</h3>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowEditMainModal(true)}
                    className="profile-section-action-btn"
                    style={{ height: '28px', padding: '0 0.65rem' }}
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              <div className="profile-contact-list">
                {profile?.email && (
                  <div className="profile-contact-item">
                    <Mail size={14} className="contact-icon" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</span>
                  </div>
                )}

                {profile?.phone ? (
                  <div className="profile-contact-item">
                    <Phone size={14} className="contact-icon" />
                    <span>{profile.phone}</span>
                  </div>
                ) : isOwner ? (
                  <div className="profile-contact-item" style={{ color: 'var(--text-muted)' }}>
                    <Phone size={14} className="contact-icon" />
                    <span>Phone: Not added yet</span>
                  </div>
                ) : null}

                {(profile?.city || profile?.country) && (
                  <div className="profile-contact-item">
                    <MapPin size={14} className="contact-icon" />
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}

                {profile?.linkedIn && (
                  <a
                    href={profile.linkedIn.startsWith("http") ? profile.linkedIn : `https://${profile.linkedIn}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-contact-item profile-contact-link"
                  >
                    <ExternalLink size={14} className="contact-icon" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}

                {profile?.portfolio && (
                  <a
                    href={profile.portfolio.startsWith("http") ? profile.portfolio : `https://${profile.portfolio}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-contact-item profile-contact-link"
                    style={{ color: '#4338ca' }}
                  >
                    <Globe size={14} className="contact-icon" />
                    <span>Portfolio / Website</span>
                  </a>
                )}
              </div>

              {/* Embedded Resume Panel */}
              {profile?.resume ? (
                <div className="profile-resume-panel">
                  <div className="profile-resume-info">
                    <FileText size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p className="profile-resume-name">
                        {profile.name ? `${profile.name.replace(/\s+/g, "_")}_Resume.pdf` : "Resume.pdf"}
                      </p>
                      <span className="profile-resume-status">
                        <CheckCircle size={10} />
                        <span>Uploaded Resume</span>
                      </span>
                    </div>
                  </div>

                  <div className="profile-resume-actions">
                    <a
                      href={getImageUrl(profile.resume)}
                      target="_blank"
                      rel="noreferrer"
                      className="profile-resume-btn-view"
                    >
                      <ExternalLink size={11} />
                      <span>View</span>
                    </a>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={uploadingResume}
                        className="profile-resume-btn-upload"
                      >
                        <Upload size={11} />
                        <span>Update</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="profile-empty-compact" style={{ marginTop: '1rem', padding: '1rem' }}>
                  <FileText size={22} className="profile-empty-icon" />
                  <h5 className="profile-empty-title">
                    {isOwner ? "No resume attached" : "No resume available"}
                  </h5>
                  <p className="profile-empty-text" style={{ marginBottom: '0.65rem' }}>
                    {isOwner
                      ? "Attach your PDF resume for recruiters and alumni."
                      : "This member has not attached a public resume."}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="profile-empty-btn"
                    >
                      <Upload size={12} />
                      <span>{uploadingResume ? "Uploading..." : "Upload Resume (PDF)"}</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* 2. SKILLS & EXPERTISE SIDEBAR PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="profile-sidebar-card"
            >
              <div className="profile-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code2 size={17} style={{ color: '#2563eb' }} />
                  <h3 className="profile-sidebar-title">Skills &amp; Expertise</h3>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {profile?.skills?.length || 0}
                </span>
              </div>

              <div className="profile-skills-grid">
                {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
                  profile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="profile-skill-chip"
                    >
                      <span>{skill}</span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="profile-chip-remove"
                          title="Remove skill"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0' }}>No skills listed yet.</p>
                )}
              </div>

              {isOwner && (
                <form onSubmit={handleAddSkill} className="profile-inline-form">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    className="profile-inline-input"
                  />
                  <button
                    type="submit"
                    disabled={!newSkill.trim()}
                    className="profile-inline-submit"
                  >
                    + Add
                  </button>
                </form>
              )}
            </motion.div>

            {/* 3. CAREER INTERESTS PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="profile-sidebar-card"
            >
              <div className="profile-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={17} style={{ color: '#0f766e' }} />
                  <h3 className="profile-sidebar-title">Career Interests</h3>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {profile?.interests?.length || 0}
                </span>
              </div>

              <div className="profile-skills-grid">
                {Array.isArray(profile?.interests) && profile.interests.length > 0 ? (
                  profile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="profile-skill-chip chip-teal"
                    >
                      <span>{interest}</span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(interest)}
                          className="profile-chip-remove"
                          title="Remove interest"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0' }}>No career interests specified.</p>
                )}
              </div>

              {isOwner && (
                <form onSubmit={handleAddInterest} className="profile-inline-form">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="e.g. AI/ML, Cloud..."
                    className="profile-inline-input"
                  />
                  <button
                    type="submit"
                    disabled={!newInterest.trim()}
                    className="profile-inline-submit"
                  >
                    + Add
                  </button>
                </form>
              )}
            </motion.div>

            {/* 4. PERSONAL INFORMATION PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="profile-sidebar-card"
            >
              <div className="profile-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={17} style={{ color: '#4338ca' }} />
                  <h3 className="profile-sidebar-title">Personal Information</h3>
                </div>
              </div>

              <div className="profile-personal-info-list">
                {profile?.department && (
                  <div className="profile-personal-info-row">
                    <div className="profile-personal-info-icon">
                      <GraduationCap size={14} />
                    </div>
                    <div className="profile-personal-info-content">
                      <div className="profile-personal-info-label">Degree / Department</div>
                      <div className="profile-personal-info-value">{profile.department}</div>
                    </div>
                  </div>
                )}

                {profile?.college && (
                  <div className="profile-personal-info-row">
                    <div className="profile-personal-info-icon">
                      <Building size={14} />
                    </div>
                    <div className="profile-personal-info-content">
                      <div className="profile-personal-info-label">College / Institution</div>
                      <div className="profile-personal-info-value">{profile.college}</div>
                    </div>
                  </div>
                )}

                {profile?.batch && (
                  <div className="profile-personal-info-row">
                    <div className="profile-personal-info-icon">
                      <Calendar size={14} />
                    </div>
                    <div className="profile-personal-info-content">
                      <div className="profile-personal-info-label">Graduation Batch</div>
                      <div className="profile-personal-info-value">Batch {profile.batch}</div>
                    </div>
                  </div>
                )}

                {(profile?.interestedField || profile?.industry) && (
                  <div className="profile-personal-info-row">
                    <div className="profile-personal-info-icon">
                      <Compass size={14} />
                    </div>
                    <div className="profile-personal-info-content">
                      <div className="profile-personal-info-label">Domain / Focus</div>
                      <div className="profile-personal-info-value">{profile.interestedField || profile.industry}</div>
                    </div>
                  </div>
                )}

                {profile?.age && (
                  <div className="profile-personal-info-row">
                    <div className="profile-personal-info-icon">
                      <UserIcon size={14} />
                    </div>
                    <div className="profile-personal-info-content">
                      <div className="profile-personal-info-label">Age</div>
                      <div className="profile-personal-info-value">{profile.age} years</div>
                    </div>
                  </div>
                )}

                {!profile?.department && !profile?.college && !profile?.batch && !profile?.age && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    {isOwner ? "No personal details provided yet. Click Edit in Profile Snapshot to update." : "No personal details shared."}
                  </p>
                )}
              </div>
            </motion.div>

            {/* 5. CONNECTIONS NETWORKING PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="profile-sidebar-card"
            >
              <div className="profile-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={17} style={{ color: '#6d28d9' }} />
                  <h3 className="profile-sidebar-title">Connections</h3>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {profile?.connections?.length || 0}
                </span>
              </div>

              <div className="profile-connections-stats">
                <div>
                  <span className="profile-conn-stat-count">{profile?.connections?.length || 0}</span>
                  <span className="profile-conn-stat-label">Connections</span>
                </div>
                <div>
                  <span className="profile-conn-stat-count">{profile?.followingCount || 0}</span>
                  <span className="profile-conn-stat-label">Following</span>
                </div>
              </div>

              {Array.isArray(profile?.connections) && profile.connections.length > 0 ? (
                <div className="profile-connections-list">
                  {profile.connections.slice(0, 4).map((conn) => (
                    <Link
                      key={conn._id}
                      to={`/profile/${conn._id}`}
                      className="profile-connection-item"
                    >
                      <div className="profile-connection-avatar">
                        {conn.avatar ? <img src={getImageUrl(conn.avatar)} alt="" /> : conn.name?.charAt(0) || "U"}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.name}</h5>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.headline || `${conn.userType || "Member"} • ${conn.department || "GradConnect"}`}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-compact" style={{ padding: '0.85rem', marginBottom: '0.85rem' }}>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>No mutual connections yet.</p>
                </div>
              )}

              <Link
                to="/people"
                className="profile-discover-btn"
              >
                <UserPlus size={14} />
                <span>Discover Alumni &amp; Network</span>
              </Link>
            </motion.div>

          </div>

        </div>

      </div>

      {/* ============================================================
         MODALS (Owner Mode Only)
         ============================================================ */}

      {/* 1. EDIT MAIN PROFILE MODAL */}
      <AnimatePresence>
        {showEditMainModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={() => setShowEditMainModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h3 className="profile-modal-title">Edit Profile Information</h3>
                <button type="button" onClick={() => setShowEditMainModal(false)} className="profile-modal-close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveMainProfile} className="profile-modal-body">
                <div className="profile-form-grid-3">
                  <div style={{ gridColumn: 'span 2' }}>
                    <div className="profile-form-group">
                      <label className="profile-form-label">Full Name *</label>
                      <input
                        type="text"
                        value={mainForm.name}
                        onChange={(e) => setMainForm({ ...mainForm, name: e.target.value })}
                        className="profile-form-input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="profile-form-group">
                      <label className="profile-form-label">Age</label>
                      <input
                        type="number"
                        value={mainForm.age}
                        onChange={(e) => setMainForm({ ...mainForm, age: e.target.value })}
                        placeholder="e.g. 24"
                        className="profile-form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Role / Identity</label>
                    <select
                      value={mainForm.userType}
                      onChange={(e) => setMainForm({ ...mainForm, userType: e.target.value, role: e.target.value === "Current Student" ? "student" : "alumni" })}
                      className="profile-form-select"
                    >
                      <option value="Alumni">Alumni Member</option>
                      <option value="Current Student">Current Student</option>
                    </select>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">College / Institution</label>
                    <input
                      type="text"
                      value={mainForm.college}
                      onChange={(e) => setMainForm({ ...mainForm, college: e.target.value })}
                      placeholder="e.g. Sri Eshwar College of Engineering"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Interested Field / Domain</label>
                    <input
                      type="text"
                      value={mainForm.interestedField}
                      onChange={(e) => setMainForm({ ...mainForm, interestedField: e.target.value, industry: e.target.value })}
                      placeholder="e.g. Software Development, AI/ML"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Professional Headline</label>
                    <input
                      type="text"
                      value={mainForm.headline}
                      onChange={(e) => setMainForm({ ...mainForm, headline: e.target.value })}
                      placeholder="e.g. Software Engineer at TechCorp | Mentor"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">About / Professional Summary</label>
                  <textarea
                    rows={3}
                    value={mainForm.bio}
                    onChange={(e) => setMainForm({ ...mainForm, bio: e.target.value })}
                    placeholder="Write a brief summary about your background, career interests, and experiences..."
                    className="profile-form-textarea"
                  />
                </div>

                <div className="profile-form-grid-3">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Department</label>
                    <input
                      type="text"
                      value={mainForm.department}
                      onChange={(e) => setMainForm({ ...mainForm, department: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Degree</label>
                    <input
                      type="text"
                      value={mainForm.degree}
                      onChange={(e) => setMainForm({ ...mainForm, degree: e.target.value })}
                      placeholder="e.g. B.Tech / B.E."
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Batch / Year</label>
                    <input
                      type="text"
                      value={mainForm.batch}
                      onChange={(e) => setMainForm({ ...mainForm, batch: e.target.value })}
                      placeholder="e.g. 2024"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Job Title / Current Role</label>
                    <input
                      type="text"
                      value={mainForm.jobTitle}
                      onChange={(e) => setMainForm({ ...mainForm, jobTitle: e.target.value })}
                      placeholder="e.g. Frontend Engineer"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Company / Organization</label>
                    <input
                      type="text"
                      value={mainForm.company}
                      onChange={(e) => setMainForm({ ...mainForm, company: e.target.value })}
                      placeholder="e.g. Google / Microsoft"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-grid-3">
                  <div className="profile-form-group">
                    <label className="profile-form-label">City</label>
                    <input
                      type="text"
                      value={mainForm.city}
                      onChange={(e) => setMainForm({ ...mainForm, city: e.target.value })}
                      placeholder="e.g. Coimbatore"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Country</label>
                    <input
                      type="text"
                      value={mainForm.country}
                      onChange={(e) => setMainForm({ ...mainForm, country: e.target.value })}
                      placeholder="e.g. India"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Phone</label>
                    <input
                      type="text"
                      value={mainForm.phone}
                      onChange={(e) => setMainForm({ ...mainForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={mainForm.linkedIn}
                      onChange={(e) => setMainForm({ ...mainForm, linkedIn: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Portfolio / Website URL</label>
                    <input
                      type="text"
                      value={mainForm.portfolio}
                      onChange={(e) => setMainForm({ ...mainForm, portfolio: e.target.value })}
                      placeholder="https://yourportfolio.com"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                {/* Networking Preferences */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={mainForm.willingToMentor}
                      onChange={(e) => setMainForm({ ...mainForm, willingToMentor: e.target.checked })}
                    />
                    <span>Willing to Mentor Students</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={mainForm.openToReferrals}
                      onChange={(e) => setMainForm({ ...mainForm, openToReferrals: e.target.checked })}
                    />
                    <span>Open to Providing Job Referrals</span>
                  </label>
                </div>

                <div className="profile-modal-footer" style={{ margin: '0 -1.75rem -1.75rem -1.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditMainModal(false)}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMain}
                    className="profile-btn-primary"
                  >
                    {savingMain ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ABOUT SUMMARY MODAL */}
      <AnimatePresence>
        {showAboutModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={() => setShowAboutModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              style={{ maxWidth: '540px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h3 className="profile-modal-title">Edit About / Summary</h3>
                <button type="button" onClick={() => setShowAboutModal(false)} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAbout} className="profile-modal-body">
                <div className="profile-form-group">
                  <label className="profile-form-label">Professional Summary</label>
                  <textarea
                    rows={6}
                    value={aboutBioText}
                    onChange={(e) => setAboutBioText(e.target.value)}
                    placeholder="Describe your background, core technical strengths, and what you are looking forward to in the community..."
                    className="profile-form-textarea"
                    required
                  />
                </div>
                <div className="profile-modal-footer" style={{ margin: '0 -1.75rem -1.75rem -1.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAboutModal(false)}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-primary"
                  >
                    <Save size={14} />
                    <span>Save Summary</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. EXPERIENCE MODAL */}
      <AnimatePresence>
        {showExpModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={resetExpModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="profile-modal-header">
                <h3 className="profile-modal-title">
                  {editingExpId !== null || editingExpIndex !== null ? "Edit Experience" : "Add Work Experience"}
                </h3>
                <button type="button" onClick={resetExpModal} className="profile-modal-close" title="Close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveExperience} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <div className="profile-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
                  {expModalError && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{expModalError}</span>
                    </div>
                  )}

                  <div className="profile-form-grid-2">
                    <div className="profile-form-group">
                      <label className="profile-form-label">Job Title *</label>
                      <input
                        type="text"
                        value={expForm.title}
                        onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
                        className="profile-form-input"
                        required
                      />
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-form-label">Company / Organization *</label>
                      <input
                        type="text"
                        value={expForm.company}
                        onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                        placeholder="e.g. Google, Microsoft, Startup"
                        className="profile-form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="profile-form-grid-2">
                    <div className="profile-form-group">
                      <label className="profile-form-label">Employment Type</label>
                      <select
                        value={expForm.employmentType || "Full-Time"}
                        onChange={(e) => setExpForm({ ...expForm, employmentType: e.target.value })}
                        className="profile-form-select"
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-form-label">Location</label>
                      <input
                        type="text"
                        value={expForm.location}
                        onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
                        placeholder="e.g. Bengaluru, India (or Remote)"
                        className="profile-form-input"
                      />
                    </div>
                  </div>

                  <div className="profile-form-grid-2">
                    <div className="profile-form-group">
                      <label className="profile-form-label">Start Date / Year</label>
                      <input
                        type="text"
                        value={expForm.startDate}
                        onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                        placeholder="e.g. 2024 or Jan 2023"
                        className="profile-form-input"
                      />
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-form-label">End Date / Year</label>
                      <input
                        type="text"
                        value={expForm.currentlyWorking ? "" : expForm.endDate}
                        onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                        placeholder={expForm.currentlyWorking ? "Present" : "e.g. 2026 or Dec 2024"}
                        disabled={expForm.currentlyWorking}
                        className="profile-form-input"
                        style={expForm.currentlyWorking ? { backgroundColor: 'var(--bg-color, #f1f5f9)', cursor: 'not-allowed', color: 'var(--text-muted, #94a3b8)' } : {}}
                      />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={expForm.currentlyWorking}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setExpForm((prev) => ({
                          ...prev,
                          currentlyWorking: checked,
                          endDate: checked ? "" : prev.endDate,
                        }));
                      }}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    <span>I am currently working in this role</span>
                  </label>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Description / Achievements</label>
                    <textarea
                      rows={3}
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                      placeholder="Describe your responsibilities, team impact, and technical accomplishments..."
                      className="profile-form-textarea"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Skills Used (comma-separated)</label>
                    <input
                      type="text"
                      value={expForm.skills}
                      onChange={(e) => setExpForm({ ...expForm, skills: e.target.value })}
                      placeholder="e.g. React, Node.js, AWS, Kubernetes"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-modal-footer" style={{ flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={resetExpModal}
                    className="profile-btn-secondary"
                    disabled={savingExp}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={savingExp}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: '150px', justifyContent: 'center' }}
                  >
                    {savingExp ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Experience</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE EXPERIENCE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteExpModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={handleCancelDeleteExperience}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '460px' }}
            >
              <div className="profile-modal-header" style={{ borderBottomColor: '#fee2e2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} />
                  </div>
                  <h3 className="profile-modal-title" style={{ fontSize: '1.15rem' }}>
                    Delete Experience
                  </h3>
                </div>
                <button type="button" onClick={handleCancelDeleteExperience} className="profile-modal-close" title="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="profile-modal-body" style={{ padding: '1.5rem 1.75rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main, #1e293b)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                  Are you sure you want to delete this experience record?
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', margin: '0.5rem 0 0', lineHeight: 1.4 }}>
                  This action cannot be undone and will permanently remove this position from your timeline.
                </p>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  onClick={handleCancelDeleteExperience}
                  className="profile-btn-secondary"
                  disabled={deletingExp}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteExperience}
                  className="profile-btn-danger"
                  disabled={deletingExp}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {deletingExp ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. EDUCATION MODAL */}
      <AnimatePresence>
        {showEduModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={() => setShowEduModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h3 className="profile-modal-title">
                  {editingEduIndex !== null ? "Edit Education" : "Add Education"}
                </h3>
                <button type="button" onClick={() => setShowEduModal(false)} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEducation} className="profile-modal-body">
                <div className="profile-form-group">
                  <label className="profile-form-label">School / University *</label>
                  <input
                    type="text"
                    value={eduForm.school}
                    onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                    placeholder="e.g. Sri Eshwar College of Engineering"
                    className="profile-form-input"
                    required
                  />
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Degree</label>
                    <input
                      type="text"
                      value={eduForm.degree}
                      onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                      placeholder="e.g. B.Tech / B.E. / M.S."
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Field of Study</label>
                    <input
                      type="text"
                      value={eduForm.fieldOfStudy}
                      onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                      placeholder="e.g. Computer Science & Engineering"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-grid-3">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Start Year</label>
                    <input
                      type="text"
                      value={eduForm.startYear}
                      onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })}
                      placeholder="e.g. 2020"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">End Year</label>
                    <input
                      type="text"
                      value={eduForm.endYear}
                      onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })}
                      placeholder="e.g. 2024"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Grade / CGPA</label>
                    <input
                      type="text"
                      value={eduForm.grade}
                      onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                      placeholder="e.g. 8.9 CGPA"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Description / Activities</label>
                  <textarea
                    rows={3}
                    value={eduForm.description}
                    onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                    placeholder="Relevant coursework, clubs, academic awards..."
                    className="profile-form-textarea"
                  />
                </div>

                <div className="profile-modal-footer" style={{ margin: '0 -1.75rem -1.75rem -1.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowEduModal(false)}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-primary"
                  >
                    <Save size={14} />
                    <span>Save Education</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. PROJECT MODAL */}
      <AnimatePresence>
        {showProjectModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={() => setShowProjectModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h3 className="profile-modal-title">
                  {editingProjectIndex !== null ? "Edit Project" : "Add Project"}
                </h3>
                <button type="button" onClick={() => setShowProjectModal(false)} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="profile-modal-body">
                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Project Name *</label>
                    <input
                      type="text"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      placeholder="e.g. AI Career Navigator"
                      className="profile-form-input"
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Role in Project</label>
                    <input
                      type="text"
                      value={projectForm.role}
                      onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                      placeholder="e.g. Lead Developer / Solo Creator"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Project URL / GitHub Link</label>
                  <input
                    type="text"
                    value={projectForm.link}
                    onChange={(e) => setProjectForm({ ...projectForm, link: e.target.value })}
                    placeholder="https://github.com/username/project"
                    className="profile-form-input"
                  />
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Start Date</label>
                    <input
                      type="text"
                      value={projectForm.startDate}
                      onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                      placeholder="e.g. Oct 2024"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">End Date</label>
                    <input
                      type="text"
                      value={projectForm.endDate}
                      onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                      placeholder="e.g. Dec 2024"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Technologies (comma-separated)</label>
                  <input
                    type="text"
                    value={projectForm.technologies}
                    onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                    placeholder="e.g. React, Node.js, MongoDB, Tailwind"
                    className="profile-form-input"
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Project Description</label>
                  <textarea
                    rows={3}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    placeholder="Describe problem solved, architecture, and impact..."
                    className="profile-form-textarea"
                  />
                </div>

                <div className="profile-modal-footer" style={{ margin: '0 -1.75rem -1.75rem -1.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-primary"
                  >
                    <Save size={14} />
                    <span>Save Project</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. CERTIFICATION MODAL */}
      <AnimatePresence>
        {showCertModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={resetCertModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h3 className="profile-modal-title">
                  {editingCertId ? "Edit Certification" : "Add License or Certification"}
                </h3>
                <button type="button" onClick={resetCertModal} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCertification} className="profile-modal-body">
                {certModalError && (
                  <div
                    className="profile-modal-error-banner"
                    style={{
                      marginBottom: '1rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{certModalError}</span>
                  </div>
                )}

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Certificate Name *</label>
                    <input
                      type="text"
                      value={certForm.name}
                      onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                      placeholder="e.g. AWS Certified Solutions Architect"
                      className="profile-form-input"
                      required
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Issuing Organization *</label>
                    <input
                      type="text"
                      value={certForm.organization}
                      onChange={(e) => setCertForm({ ...certForm, organization: e.target.value })}
                      placeholder="e.g. Amazon Web Services (AWS)"
                      className="profile-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Issue Date</label>
                    <input
                      type="text"
                      value={certForm.issueDate}
                      onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                      placeholder="e.g. May 2024"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Expiration Date</label>
                    <input
                      type="text"
                      value={certForm.expiryDate}
                      onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })}
                      placeholder="e.g. May 2027"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Credential ID</label>
                    <input
                      type="text"
                      value={certForm.credentialId}
                      onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                      placeholder="e.g. AWS-99281-PSA"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Credential URL</label>
                    <input
                      type="text"
                      value={certForm.credentialUrl}
                      onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                      placeholder="https://aws.amazon.com/verify/..."
                      className="profile-form-input"
                    />
                  </div>
                </div>

                {/* Upload Certificate File */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Certificate PDF / Image Proof</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={certFileInputRef}
                      onChange={handleCertFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden-file-input"
                    />
                    <button
                      type="button"
                      onClick={() => certFileInputRef.current?.click()}
                      disabled={uploadingCertFile}
                      className="profile-card-header-btn"
                    >
                      <Upload size={13} />
                      <span>{uploadingCertFile ? "Uploading..." : "Upload Certificate File"}</span>
                    </button>
                    {certForm.certificateFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={13} />
                          <span>File Attached</span>
                        </span>
                        <a
                          href={getImageUrl(certForm.certificateFile)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Eye size={12} /> Preview
                        </a>
                        <button
                          type="button"
                          onClick={() => setCertForm({ ...certForm, certificateFile: "" })}
                          style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-modal-footer" style={{ margin: '0 -1.75rem -1.75rem -1.75rem' }}>
                  <button
                    type="button"
                    onClick={resetCertModal}
                    disabled={savingCert}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCert || uploadingCertFile}
                    className="profile-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {savingCert ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>{editingCertId ? "Update Certification" : "Save Certification"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CERTIFICATION CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteCertModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={handleCancelDeleteCertification}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              style={{ maxWidth: '440px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="profile-modal-title" style={{ fontSize: '1.15rem' }}>Delete Certification</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>This action cannot be undone.</p>
                  </div>
                </div>
                <button type="button" onClick={handleCancelDeleteCertification} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <div className="profile-modal-body" style={{ paddingTop: '0.75rem', paddingBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                  Are you sure you want to remove <strong>{confirmDeleteCertName || "this certification"}</strong> from your profile?
                </p>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  onClick={handleCancelDeleteCertification}
                  disabled={deletingCert}
                  className="profile-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCertification}
                  disabled={deletingCert}
                  className="profile-btn-danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {deletingCert ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Delete Certification</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. PORTFOLIO DOCUMENT UPLOAD MODAL */}
      <AnimatePresence>
        {showDocUploadModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={() => setShowDocUploadModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              style={{ maxWidth: '500px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="profile-card-icon-chip" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="profile-modal-title">Upload Portfolio Document</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Share transcripts, reports, or credentials</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowDocUploadModal(false)} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="profile-modal-body">
                {docModalError && (
                  <div
                    className="profile-modal-error-banner"
                    style={{
                      marginBottom: '1rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{docModalError}</span>
                  </div>
                )}

                <div className="profile-form-group">
                  <label className="profile-form-label">Document Display Name *</label>
                  <input
                    type="text"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    placeholder="e.g. Capstone Project Report / Academic Transcript"
                    className="profile-form-input"
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Select Document (PDF, DOC, DOCX, PNG, JPG up to 10MB) *</label>
                  <input
                    type="file"
                    id="portfolio-document-file-input"
                    data-testid="doc-file-input"
                    ref={docFileInputRef}
                    onChange={handleDocFileSelect}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="profile-form-input"
                    disabled={uploadingDoc}
                  />
                  {selectedDocFile && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <FileText size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedDocFile.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          ({(selectedDocFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        <CheckCircle size={14} /> Ready
                      </span>
                    </div>
                  )}
                </div>

                <div className="profile-modal-footer" style={{ margin: '0 -1.75rem -1.75rem -1.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowDocUploadModal(false)}
                    disabled={uploadingDoc}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="profile-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {uploadingDoc ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Upload Document</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE DOCUMENT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteDocModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={handleCancelDeleteDocument}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              style={{ maxWidth: '440px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="profile-modal-title" style={{ fontSize: '1.15rem' }}>Delete Document</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>This action cannot be undone.</p>
                  </div>
                </div>
                <button type="button" onClick={handleCancelDeleteDocument} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <div className="profile-modal-body" style={{ paddingTop: '0.75rem', paddingBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                  Are you sure you want to remove <strong>{confirmDeleteDocName || "this document"}</strong> from your portfolio?
                </p>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  onClick={handleCancelDeleteDocument}
                  disabled={deletingDoc}
                  className="profile-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteDocument}
                  disabled={deletingDoc}
                  className="profile-btn-danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {deletingDoc ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Delete Document</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. ACHIEVEMENTS MODAL */}
      <AnimatePresence>
        {showAchievementModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={resetAchievementModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="profile-modal-title">
                      {editingAchievementId ? "Edit Achievement" : "Add Honor or Achievement"}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Showcase your competitions, hackathons, academic and professional honors.
                    </p>
                  </div>
                </div>
                <button type="button" onClick={resetAchievementModal} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              {achievementModalError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  margin: '1rem 1.75rem 0'
                }}>
                  <AlertCircle size={16} />
                  <span>{achievementModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAchievement} className="profile-modal-body">
                <div className="profile-form-group">
                  <label className="profile-form-label">Honor / Award Title *</label>
                  <input
                    type="text"
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                    placeholder="e.g. 1st Place National Hackathon"
                    className="profile-form-input"
                    required
                  />
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Organization / Issuer</label>
                    <input
                      type="text"
                      value={achievementForm.organization}
                      onChange={(e) => setAchievementForm({ ...achievementForm, organization: e.target.value })}
                      placeholder="e.g. ACM / IEEE / Google"
                      className="profile-form-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Award Date</label>
                    <input
                      type="text"
                      value={achievementForm.date}
                      onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })}
                      placeholder="e.g. Nov 2025"
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-grid-2">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Category</label>
                    <select
                      value={achievementForm.category || "Award"}
                      onChange={(e) => setAchievementForm({ ...achievementForm, category: e.target.value })}
                      className="profile-form-input"
                    >
                      <option value="Hackathon">Hackathon</option>
                      <option value="Competition">Competition</option>
                      <option value="Academic">Academic</option>
                      <option value="Award">Award</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Credential / Verification URL</label>
                    <input
                      type="url"
                      value={achievementForm.credentialUrl}
                      onChange={(e) => setAchievementForm({ ...achievementForm, credentialUrl: e.target.value })}
                      placeholder="https://..."
                      className="profile-form-input"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Description</label>
                  <textarea
                    rows={3}
                    value={achievementForm.description}
                    onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                    placeholder="Details about the competition, team, problem solved, or significance..."
                    className="profile-form-textarea"
                  />
                </div>

                {/* Proof Document / Certificate Upload */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Certificate or Proof Document</label>
                  <input
                    type="file"
                    ref={achievementFileInputRef}
                    onChange={handleAchievementProofUpload}
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    style={{ display: "none" }}
                  />

                  {achievementForm.proofFile ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <FileText size={18} style={{ color: '#6d28d9', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Proof Document Attached
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setCertPreviewModal({ open: true, url: getImageUrl(achievementForm.proofFile), title: achievementForm.title || "Achievement Proof" })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.78rem',
                            color: '#6d28d9',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAchievementForm((prev) => ({ ...prev, proofFile: "" }))}
                          style={{
                            fontSize: '0.78rem',
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingAchievementProof}
                      onClick={() => achievementFileInputRef.current?.click()}
                      className="profile-btn-secondary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        borderStyle: 'dashed',
                        borderColor: '#cbd5e1',
                        padding: '0.75rem'
                      }}
                    >
                      {uploadingAchievementProof ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Uploading proof file...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={15} />
                          <span>Upload Proof Document or Certificate (PDF / Image)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="profile-modal-footer" style={{ margin: '0 -1.75rem -1.75rem -1.75rem' }}>
                  <button
                    type="button"
                    onClick={resetAchievementModal}
                    disabled={savingAchievement}
                    className="profile-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAchievement}
                    className="profile-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {savingAchievement ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>{editingAchievementId ? "Update Achievement" : "Save Achievement"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE ACHIEVEMENT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteAchievementModal && isOwner && (
          <div className="profile-modal-backdrop" onClick={handleCancelDeleteAchievement}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="profile-modal-dialog"
              style={{ maxWidth: '440px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="profile-modal-title" style={{ fontSize: '1.15rem' }}>Delete Achievement</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>This action cannot be undone.</p>
                  </div>
                </div>
                <button type="button" onClick={handleCancelDeleteAchievement} className="profile-modal-close">
                  <X size={18} />
                </button>
              </div>

              <div className="profile-modal-body" style={{ paddingTop: '0.75rem', paddingBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
                  Are you sure you want to remove <strong>{confirmDeleteAchievementTitle || "this achievement"}</strong> from your profile?
                </p>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  onClick={handleCancelDeleteAchievement}
                  disabled={deletingAchievement}
                  className="profile-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAchievement}
                  disabled={deletingAchievement}
                  className="profile-btn-danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {deletingAchievement ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Delete Achievement</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. CERTIFICATE LIGHTBOX PREVIEW MODAL */}
      <AnimatePresence>
        {certPreviewModal.open && (
          <div
            className="profile-modal-backdrop"
            onClick={() => setCertPreviewModal({ open: false, url: "", title: "" })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="profile-modal-dialog"
              style={{ maxWidth: '800px' }}
            >
              <div className="profile-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={18} style={{ color: '#b45309' }} />
                  <h4 className="profile-modal-title" style={{ fontSize: '1rem' }}>{certPreviewModal.title || "Certificate Preview"}</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <a
                    href={certPreviewModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-card-header-btn"
                    title="Open in new window"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setCertPreviewModal({ open: false, url: "", title: "" })}
                    className="profile-modal-close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '75vh', overflow: 'auto' }}>
                {certPreviewModal.url.endsWith(".pdf") ? (
                  <iframe
                    src={certPreviewModal.url}
                    title="Certificate PDF"
                    style={{ width: '100%', height: '65vh', borderRadius: '8px', border: 'none', background: 'white' }}
                  />
                ) : (
                  <img
                    src={certPreviewModal.url}
                    alt={certPreviewModal.title}
                    style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Profile;
