const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Follow = require("../models/Follow");

// Helper: Ensure authenticated user is the owner of target profile
const checkOwnership = (req, targetUserId) => {
  if (!req.user || !req.user._id) return false;
  return req.user._id.toString() === targetUserId.toString();
};

// @desc    Get user profile by ID
// @route   GET /api/profile/:id
// @access  Private
const getProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("connections", "name avatar headline userType jobTitle company department batch")
      .populate("connectionRequests.from", "name avatar headline userType jobTitle company department batch");

    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Administrators do not have a public member profile
    const ADMIN_ROLES = ["admin", "superadmin", "subadmin", "admin1", "admin2", "ADMIN", "SUPER_ADMIN", "SUB_ADMIN"];
    const userRole = (user.role || "").toLowerCase();
    const primaryRole = (user.primaryRole || "").toUpperCase();
    const isAdmin =
      ADMIN_ROLES.includes(user.role) ||
      ADMIN_ROLES.includes(userRole) ||
      ADMIN_ROLES.includes(primaryRole) ||
      Boolean(user.adminRole) ||
      userRole.includes("admin");

    if (isAdmin) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const userData = user.toObject();
    const loggedInUserId = req.user && req.user._id ? req.user._id.toString() : null;
    const isSelf = loggedInUserId ? loggedInUserId === user._id.toString() : false;

    const isConnected = loggedInUserId && user.connections
      ? user.connections.some((c) => (c._id ? c._id.toString() === loggedInUserId : c.toString() === loggedInUserId))
      : false;

    const pendingSent = loggedInUserId && user.connectionRequests
      ? user.connectionRequests.some(
          (r) => r.from && (r.from._id ? r.from._id.toString() === loggedInUserId : r.from.toString() === loggedInUserId) && r.status === "pending"
        )
      : false;

    const pendingReceived = loggedInUserId && req.user?.connectionRequests
      ? req.user.connectionRequests.some(
          (r) => r.from && (r.from._id ? r.from._id.toString() === user._id.toString() : r.from.toString() === user._id.toString()) && r.status === "pending"
        )
      : false;

    userData.connectionStatus = isSelf
      ? "self"
      : isConnected
      ? "connected"
      : pendingSent
      ? "pending_sent"
      : pendingReceived
      ? "pending_received"
      : "none";

    userData.followersCount = await Follow.countDocuments({ following: user._id });
    userData.followingCount = await Follow.countDocuments({ follower: user._id });

    return res.status(200).json(userData);
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ message: "Server error retrieving profile" });
  }
};

// @desc    Update profile info
// @route   PUT /api/profile/:id
// @access  Private (Owner Only)
const updateProfile = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowedUpdates = [
      "name",
      "college",
      "userType",
      "role",
      "department",
      "degree",
      "batch",
      "graduationYear",
      "jobTitle",
      "company",
      "industry",
      "interestedField",
      "age",
      "phone",
      "city",
      "country",
      "linkedIn",
      "portfolio",
      "willingToMentor",
      "openToReferrals",
      "headline",
      "bio",
      "avatar",
      "coverImage",
      "skills",
      "interests",
      "resume",
      "achievements",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "age" || field === "graduationYear") {
          user[field] = req.body[field] ? parseInt(req.body[field], 10) : null;
        } else if (field === "willingToMentor" || field === "openToReferrals") {
          user[field] = Boolean(req.body[field]);
        } else if (field === "skills" || field === "interests") {
          user[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : String(req.body[field]).split(",").map((s) => s.trim()).filter(Boolean);
        } else if (field === "achievements") {
          if (Array.isArray(req.body[field])) user[field] = req.body[field];
        } else {
          user[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
        }
      }
    });

    await user.save();
    return res.status(200).json({ message: "Profile updated successfully", user: user.toJSON() });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Server error updating profile" });
  }
};

// @desc    Add Experience
// @route   POST /api/profile/:id/experience
// @access  Private (Owner Only)
const addExperience = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const title = (req.body.title || req.body.jobTitle || "").trim();
    const company = (req.body.company || "").trim();

    if (!title || !company) {
      return res.status(400).json({ message: "Job Title and Company are required" });
    }

    const currentlyWorking = Boolean(req.body.currentlyWorking);
    const startDate = (req.body.startDate || "").trim();
    const endDate = currentlyWorking ? "" : (req.body.endDate || "").trim();

    // Numeric year validation if both start and end dates look like years
    if (!currentlyWorking && /^\d{4}$/.test(startDate) && /^\d{4}$/.test(endDate)) {
      if (parseInt(endDate, 10) < parseInt(startDate, 10)) {
        return res.status(400).json({ message: "End date cannot be earlier than start date" });
      }
    }

    let skills = [];
    if (Array.isArray(req.body.skills)) {
      skills = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof req.body.skills === "string") {
      skills = req.body.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const newExp = {
      title,
      company,
      employmentType: req.body.employmentType || "Full-Time",
      location: (req.body.location || "").trim(),
      startDate,
      endDate,
      currentlyWorking,
      description: (req.body.description || "").trim(),
      skills,
    };

    user.experience.unshift(newExp);
    await user.save();

    return res.status(201).json({
      message: "Experience added successfully",
      experience: user.experience,
      addedExperience: user.experience[0],
    });
  } catch (error) {
    console.error("Add Experience Error:", error);
    return res.status(500).json({ message: "Server error adding experience" });
  }
};

// @desc    Update Experience
// @route   PUT /api/profile/:id/experience/:experienceId
// @access  Private (Owner Only)
const updateExperience = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.experienceId)) {
      return res.status(400).json({ message: "Invalid experience ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const exp = user.experience.id(req.params.experienceId);
    if (!exp) return res.status(404).json({ message: "Experience record not found" });

    const title = (
      req.body.title !== undefined
        ? req.body.title
        : req.body.jobTitle !== undefined
        ? req.body.jobTitle
        : exp.title
    ).trim();

    const company = (
      req.body.company !== undefined ? req.body.company : exp.company
    ).trim();

    if (!title || !company) {
      return res.status(400).json({ message: "Job Title and Company are required" });
    }

    const startDate = (
      req.body.startDate !== undefined ? req.body.startDate : exp.startDate
    ).trim();

    const currentlyWorking =
      req.body.currentlyWorking !== undefined
        ? Boolean(req.body.currentlyWorking)
        : exp.currentlyWorking;

    const endDate = currentlyWorking
      ? ""
      : (req.body.endDate !== undefined ? req.body.endDate : exp.endDate).trim();

    // Numeric year validation if both start and end dates look like years
    if (!currentlyWorking && /^\d{4}$/.test(startDate) && /^\d{4}$/.test(endDate)) {
      if (parseInt(endDate, 10) < parseInt(startDate, 10)) {
        return res.status(400).json({ message: "End date cannot be earlier than start date" });
      }
    }

    exp.title = title;
    exp.company = company;

    if (req.body.employmentType !== undefined) {
      exp.employmentType = req.body.employmentType || "Full-Time";
    }

    if (req.body.location !== undefined) {
      exp.location = (req.body.location || "").trim();
    }

    exp.startDate = startDate;
    exp.currentlyWorking = currentlyWorking;
    exp.endDate = endDate;

    if (req.body.description !== undefined) {
      exp.description = (req.body.description || "").trim();
    }

    if (req.body.skills !== undefined) {
      if (Array.isArray(req.body.skills)) {
        exp.skills = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof req.body.skills === "string") {
        exp.skills = req.body.skills.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    await user.save();

    return res.status(200).json({
      message: "Experience updated successfully",
      experience: user.experience,
      updatedExperience: exp,
    });
  } catch (error) {
    console.error("Update Experience Error:", error);
    return res.status(500).json({ message: "Server error updating experience" });
  }
};

// @desc    Delete Experience
// @route   DELETE /api/profile/:id/experience/:experienceId
// @access  Private (Owner Only)
const deleteExperience = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.experienceId)) {
      return res.status(400).json({ message: "Invalid experience ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const exists = user.experience.some(
      (e) => e._id.toString() === req.params.experienceId
    );
    if (!exists) {
      return res.status(404).json({ message: "Experience record not found" });
    }

    user.experience = user.experience.filter(
      (e) => e._id.toString() !== req.params.experienceId
    );
    await user.save();

    return res.status(200).json({
      message: "Experience removed successfully",
      experience: user.experience,
    });
  } catch (error) {
    console.error("Delete Experience Error:", error);
    return res.status(500).json({ message: "Server error removing experience" });
  }
};

// @desc    Add Education
// @route   POST /api/profile/:id/education
// @access  Private (Owner Only)
const addEducation = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newEdu = {
      school: req.body.school || "",
      degree: req.body.degree || "",
      fieldOfStudy: req.body.fieldOfStudy || "",
      startYear: req.body.startYear || "",
      endYear: req.body.endYear || "",
      grade: req.body.grade || "",
      description: req.body.description || "",
    };

    user.education.unshift(newEdu);
    await user.save();

    return res.status(201).json({ message: "Education added", education: user.education });
  } catch (error) {
    console.error("Add Education Error:", error);
    return res.status(500).json({ message: "Server error adding education" });
  }
};

// @desc    Update Education
// @route   PUT /api/profile/:id/education/:educationId
// @access  Private (Owner Only)
const updateEducation = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const edu = user.education.id(req.params.educationId);
    if (!edu) return res.status(404).json({ message: "Education record not found" });

    Object.assign(edu, req.body);
    await user.save();

    return res.status(200).json({ message: "Education updated", education: user.education });
  } catch (error) {
    console.error("Update Education Error:", error);
    return res.status(500).json({ message: "Server error updating education" });
  }
};

// @desc    Delete Education
// @route   DELETE /api/profile/:id/education/:educationId
// @access  Private (Owner Only)
const deleteEducation = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.education = user.education.filter(
      (e) => e._id.toString() !== req.params.educationId
    );
    await user.save();

    return res.status(200).json({ message: "Education removed", education: user.education });
  } catch (error) {
    console.error("Delete Education Error:", error);
    return res.status(500).json({ message: "Server error removing education" });
  }
};

// @desc    Add Project
// @route   POST /api/profile/:id/projects
// @access  Private (Owner Only)
const addProject = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newProj = {
      name: req.body.name || "",
      description: req.body.description || "",
      technologies: Array.isArray(req.body.technologies)
        ? req.body.technologies
        : typeof req.body.technologies === "string"
        ? req.body.technologies.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      role: req.body.role || "",
      startDate: req.body.startDate || "",
      endDate: req.body.endDate || "",
      link: req.body.link || "",
    };

    user.projects.unshift(newProj);
    await user.save();

    return res.status(201).json({ message: "Project added", projects: user.projects });
  } catch (error) {
    console.error("Add Project Error:", error);
    return res.status(500).json({ message: "Server error adding project" });
  }
};

// @desc    Update Project
// @route   PUT /api/profile/:id/projects/:projectId
// @access  Private (Owner Only)
const updateProject = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const proj = user.projects.id(req.params.projectId);
    if (!proj) return res.status(404).json({ message: "Project not found" });

    if (req.body.technologies !== undefined && typeof req.body.technologies === "string") {
      req.body.technologies = req.body.technologies.split(",").map((t) => t.trim()).filter(Boolean);
    }

    Object.assign(proj, req.body);
    await user.save();

    return res.status(200).json({ message: "Project updated", projects: user.projects });
  } catch (error) {
    console.error("Update Project Error:", error);
    return res.status(500).json({ message: "Server error updating project" });
  }
};

// @desc    Delete Project
// @route   DELETE /api/profile/:id/projects/:projectId
// @access  Private (Owner Only)
const deleteProject = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.projects = user.projects.filter(
      (p) => p._id.toString() !== req.params.projectId
    );
    await user.save();

    return res.status(200).json({ message: "Project removed", projects: user.projects });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return res.status(500).json({ message: "Server error removing project" });
  }
};

// @desc    Add Skill
// @route   POST /api/profile/:id/skills
// @access  Private (Owner Only)
const addSkill = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const skill = (req.body.skill || "").trim();
    if (!skill) return res.status(400).json({ message: "Skill name is required" });

    if (!user.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      user.skills.push(skill);
      await user.save();
    }

    return res.status(200).json({ message: "Skill added", skills: user.skills });
  } catch (error) {
    console.error("Add Skill Error:", error);
    return res.status(500).json({ message: "Server error adding skill" });
  }
};

// @desc    Delete Skill
// @route   DELETE /api/profile/:id/skills/:skill
// @access  Private (Owner Only)
const deleteSkill = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const skillToRemove = decodeURIComponent(req.params.skill);
    user.skills = user.skills.filter((s) => s !== skillToRemove);
    await user.save();

    return res.status(200).json({ message: "Skill removed", skills: user.skills });
  } catch (error) {
    console.error("Delete Skill Error:", error);
    return res.status(500).json({ message: "Server error removing skill" });
  }
};

// @desc    Add Certification
// @route   POST /api/profile/:id/certifications
// @access  Private (Owner Only)
const addCertification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const name = (req.body.name || req.body.certificateName || "").trim();
    const organization = (req.body.organization || req.body.issuingOrganization || "").trim();

    if (!name || !organization) {
      return res.status(400).json({ message: "Certificate Name and Issuing Organization are required" });
    }

    const newCert = {
      name,
      organization,
      issueDate: (req.body.issueDate || "").trim(),
      expiryDate: (req.body.expiryDate || "").trim(),
      credentialId: (req.body.credentialId || "").trim(),
      credentialUrl: (req.body.credentialUrl || "").trim(),
      certificateFile: (req.body.certificateFile || "").trim(),
    };

    user.certifications = user.certifications || [];
    user.certifications.unshift(newCert);
    await user.save();

    return res.status(201).json({
      message: "Certification added successfully",
      certifications: user.certifications,
      addedCertification: user.certifications[0],
    });
  } catch (error) {
    console.error("Add Certification Error:", error);
    return res.status(500).json({ message: "Server error adding certification" });
  }
};

// @desc    Update Certification
// @route   PUT /api/profile/:id/certifications/:certificateId
// @access  Private (Owner Only)
const updateCertification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.certificateId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let cert = user.certifications.id(req.params.certificateId);
    if (!cert) {
      cert = user.certifications.find(
        (c) => c._id && c._id.toString() === req.params.certificateId.toString()
      );
    }
    if (!cert) return res.status(404).json({ message: "Certification record not found" });

    const name = (
      req.body.name !== undefined
        ? req.body.name
        : req.body.certificateName !== undefined
        ? req.body.certificateName
        : cert.name
    ).trim();

    const organization = (
      req.body.organization !== undefined
        ? req.body.organization
        : req.body.issuingOrganization !== undefined
        ? req.body.issuingOrganization
        : cert.organization
    ).trim();

    if (!name || !organization) {
      return res.status(400).json({ message: "Certificate Name and Issuing Organization are required" });
    }

    cert.name = name;
    cert.organization = organization;

    if (req.body.issueDate !== undefined) {
      cert.issueDate = (req.body.issueDate || "").trim();
    }
    if (req.body.expiryDate !== undefined) {
      cert.expiryDate = (req.body.expiryDate || "").trim();
    }
    if (req.body.credentialId !== undefined) {
      cert.credentialId = (req.body.credentialId || "").trim();
    }
    if (req.body.credentialUrl !== undefined) {
      cert.credentialUrl = (req.body.credentialUrl || "").trim();
    }
    if (req.body.certificateFile !== undefined) {
      cert.certificateFile = (req.body.certificateFile || "").trim();
    }

    await user.save();

    return res.status(200).json({
      message: "Certification updated successfully",
      certifications: user.certifications,
      updatedCertification: cert,
    });
  } catch (error) {
    console.error("Update Certification Error:", error);
    return res.status(500).json({ message: "Server error updating certification" });
  }
};

// @desc    Delete Certification
// @route   DELETE /api/profile/:id/certifications/:certificateId
// @access  Private (Owner Only)
const deleteCertification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.certificateId)) {
      return res.status(400).json({ message: "Invalid certification ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const certToDelete = (user.certifications || []).find(
      (c) => c._id && c._id.toString() === req.params.certificateId.toString()
    );

    if (!certToDelete) {
      return res.status(404).json({ message: "Certification record not found" });
    }

    // Clean up local certificate proof file if stored locally in uploads
    if (certToDelete.certificateFile && typeof certToDelete.certificateFile === "string") {
      const match = certToDelete.certificateFile.match(/\/uploads\/([^/?#]+)$/);
      if (match && match[1]) {
        const filePath = path.join(__dirname, "../uploads", match[1]);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn("Could not delete cert proof file:", e.message);
          }
        }
      }
    }

    user.certifications = (user.certifications || []).filter(
      (c) => c._id && c._id.toString() !== req.params.certificateId.toString()
    );
    await user.save();

    return res.status(200).json({
      message: "Certification removed successfully",
      certifications: user.certifications,
    });
  } catch (error) {
    console.error("Delete Certification Error:", error);
    return res.status(500).json({ message: "Server error removing certification" });
  }
};

// @desc    Upload Resume
// @route   POST /api/profile/:id/resume
// @access  Private (Owner Only)
const uploadResume = async (req, res) => {
  try {
    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please select a resume file to upload (PDF, DOC, DOCX)" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.resume = `/uploads/${req.file.filename}`;
    await user.save();

    return res.status(200).json({
      message: "Resume uploaded successfully",
      resumeUrl: user.resume,
    });
  } catch (error) {
    console.error("Upload Resume Error:", error);
    return res.status(500).json({ message: "Server error uploading resume" });
  }
};

// @desc    Add Achievement / Honor
// @route   POST /api/profile/:id/achievements
// @access  Private (Owner Only)
const addAchievement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    const { title, organization, date, category, description, credentialUrl, proofFile } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Achievement Title is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.achievements)) {
      user.achievements = [];
    }

    const newAchievement = {
      title: title.trim(),
      organization: organization ? organization.trim() : "",
      date: date ? date.trim() : "",
      category: category ? category.trim() : "Award",
      description: description ? description.trim() : "",
      credentialUrl: credentialUrl ? credentialUrl.trim() : "",
      proofFile: proofFile ? proofFile.trim() : "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    user.achievements.unshift(newAchievement);
    await user.save();

    const createdAchievement = user.achievements[0];

    return res.status(201).json({
      message: "Achievement added successfully",
      achievements: user.achievements,
      achievement: createdAchievement,
    });
  } catch (error) {
    console.error("Add Achievement Error:", error);
    return res.status(500).json({ message: "Server error adding achievement" });
  }
};

// @desc    Update Achievement / Honor
// @route   PUT /api/profile/:id/achievements/:achievementId
// @access  Private (Owner Only)
const updateAchievement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.achievementId)) {
      return res.status(400).json({ message: "Invalid achievement ID" });
    }

    const { title, organization, date, category, description, credentialUrl, proofFile } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Achievement Title is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Dual-method lookup: .id() and fallback .find()
    let ach = user.achievements.id(req.params.achievementId);
    if (!ach) {
      ach = user.achievements.find(
        (a) => a._id && a._id.toString() === req.params.achievementId.toString()
      );
    }

    if (!ach) {
      return res.status(404).json({ message: "Achievement record not found" });
    }

    // Clean up previous local proof file if replaced by a different file
    if (proofFile !== undefined && ach.proofFile && ach.proofFile !== proofFile && typeof ach.proofFile === "string") {
      const match = ach.proofFile.match(/\/uploads\/([^/?#]+)$/);
      if (match && match[1]) {
        const filePath = path.join(__dirname, "../uploads", match[1]);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn("Could not delete previous achievement proof file:", e.message);
          }
        }
      }
    }

    ach.title = title.trim();
    if (organization !== undefined) ach.organization = organization.trim();
    if (date !== undefined) ach.date = date.trim();
    if (category !== undefined) ach.category = category.trim();
    if (description !== undefined) ach.description = description.trim();
    if (credentialUrl !== undefined) ach.credentialUrl = credentialUrl.trim();
    if (proofFile !== undefined) ach.proofFile = proofFile.trim();
    ach.updatedAt = new Date();

    await user.save();

    return res.status(200).json({
      message: "Achievement updated successfully",
      achievements: user.achievements,
      updatedAchievement: ach,
    });
  } catch (error) {
    console.error("Update Achievement Error:", error);
    return res.status(500).json({ message: "Server error updating achievement" });
  }
};

// @desc    Delete Achievement / Honor
// @route   DELETE /api/profile/:id/achievements/:achievementId
// @access  Private (Owner Only)
const deleteAchievement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!checkOwnership(req, req.params.id)) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.achievementId)) {
      return res.status(400).json({ message: "Invalid achievement ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const achToDelete = (user.achievements || []).find(
      (a) => a._id && a._id.toString() === req.params.achievementId.toString()
    );

    if (!achToDelete) {
      return res.status(404).json({ message: "Achievement record not found" });
    }

    // Clean up local proof file if stored locally in uploads
    if (achToDelete.proofFile && typeof achToDelete.proofFile === "string") {
      const match = achToDelete.proofFile.match(/\/uploads\/([^/?#]+)$/);
      if (match && match[1]) {
        const filePath = path.join(__dirname, "../uploads", match[1]);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn("Could not delete achievement proof file:", e.message);
          }
        }
      }
    }

    user.achievements = (user.achievements || []).filter(
      (a) => a._id && a._id.toString() !== req.params.achievementId.toString()
    );
    await user.save();

    return res.status(200).json({
      message: "Achievement removed successfully",
      achievements: user.achievements,
    });
  } catch (error) {
    console.error("Delete Achievement Error:", error);
    return res.status(500).json({ message: "Server error removing achievement" });
  }
};

module.exports = {
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
};
