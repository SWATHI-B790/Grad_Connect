const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Notification = require("../models/Notification");
const { AuditLog, logAdminAction } = require("../models/AuditLog");
const UserActivityLog = require("../models/UserActivityLog");
const UsageLog = require("../models/UsageLog");
const Domain = require("../models/Domain");
const {
  createReportDocument,
  renderReportHeader,
  renderSummaryCards,
  renderSectionTitle,
  renderTable,
  finalizeReport,
  formatReportDateTime,
  formatShortDate,
} = require("../utils/pdfGenerator");

// ==========================================
// 1. DASHBOARD & OVERVIEW
// ==========================================

// @desc    Get aggregated dashboard statistics & overview
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardData = async (req, res) => {
  try {
    const nonDeletedFilter = { isDeleted: { $ne: true } };

    // Parallel metrics collection
    const [
      totalUsers,
      totalStudents,
      totalAlumni,
      totalAdmins,
      pendingApprovals,
      activeUsers,
      rejectedRegistrations,
      suspendedUsers,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalDomainArticles,
      totalDomains,
      totalEvents,
      recentRegistrations,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments(nonDeletedFilter),
      User.countDocuments({
        ...nonDeletedFilter,
        $or: [{ role: "student" }, { userType: "Current Student" }],
      }),
      User.countDocuments({
        ...nonDeletedFilter,
        $or: [{ role: "alumni" }, { userType: "Alumni" }],
      }),
      User.countDocuments({
        ...nonDeletedFilter,
        role: { $in: ["admin", "subadmin", "superadmin"] },
      }),
      User.countDocuments({ ...nonDeletedFilter, status: { $in: ["PENDING", "pending"] } }),
      User.countDocuments({
        ...nonDeletedFilter,
        status: { $in: ["APPROVED", "approved"] },
        role: { $nin: ["admin", "subadmin", "superadmin"] },
      }),
      User.countDocuments({ ...nonDeletedFilter, status: { $in: ["REJECTED", "rejected"] } }),
      User.countDocuments({ ...nonDeletedFilter, status: { $in: ["SUSPENDED", "suspended"] } }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: "published" }),
      Blog.countDocuments({ status: "draft" }),
      Blog.countDocuments({ domain: { $exists: true, $ne: "" } }),
      Domain.countDocuments({ status: "PUBLISHED" }),
      Event.countDocuments(),
      User.find({
        ...nonDeletedFilter,
        role: { $nin: ["admin", "subadmin", "superadmin"] },
      })
        .select("name email role status accountStatus approvalStatus userType department batch avatar college createdAt")
        .sort({ createdAt: -1 })
        .limit(6),
      AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(10),
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      stats: {
        totalUsers,
        totalStudents,
        totalAlumni,
        totalAdmins,
        pendingApprovals,
        activeUsers,
        approvedMembers: activeUsers,
        rejectedRegistrations,
        suspendedUsers,
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalDomainArticles,
        totalDomains,
        totalEvents,
      },
      counts: {
        totalUsers,
        totalStudents,
        totalAlumni,
        totalAdmins,
        pendingApprovals,
        activeUsers,
        approvedMembers: activeUsers,
        rejectedRegistrations,
        suspendedUsers,
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalDomainArticles,
        totalDomains,
        totalEvents,
      },
      recentRegistrations,
      recentActivities,
    });
  } catch (error) {
    console.error("Get Dashboard Data Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching dashboard metrics" });
  }
};

// @desc    Get administrative notifications (pending count & recent alerts)
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAdminNotifications = async (req, res) => {
  try {
    const pendingCount = await User.countDocuments({
      isDeleted: { $ne: true },
      $or: [
        { status: { $in: ["PENDING", "pending"] } },
        { accountStatus: { $in: ["PENDING", "pending"] } },
        { approvalStatus: { $in: ["PENDING", "pending"] } },
      ],
    });

    const recentPending = await User.find({
      isDeleted: { $ne: true },
      $or: [
        { status: { $in: ["PENDING", "pending"] } },
        { accountStatus: { $in: ["PENDING", "pending"] } },
        { approvalStatus: { $in: ["PENDING", "pending"] } },
      ],
    })
      .select("name email role userType department batch avatar createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      pendingCount,
      recentPending,
    });
  } catch (error) {
    console.error("Get Admin Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching notifications" });
  }
};

// ==========================================
// 2. REGISTRATIONS & APPROVAL GATE
// ==========================================

// @desc    Get registrations with filters & search
// @route   GET /api/admin/registrations
// @access  Private/Admin
const getRegistrations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "all",
      status = "PENDING",
      department = "",
      batch = "",
    } = req.query;

    const query = { isDeleted: { $ne: true } };

    // Status filter (default to PENDING for review queue)
    if (status && status.toLowerCase() !== "all") {
      const sUpper = status.toUpperCase();
      const sLower = status.toLowerCase();
      query.$or = [
        { status: sUpper },
        { status: sLower },
        { accountStatus: sUpper },
        { accountStatus: sLower },
        { approvalStatus: sUpper },
        { approvalStatus: sLower },
      ];
    }

    // Role filter
    if (role && role !== "all") {
      query.role = role.toLowerCase();
    } else {
      query.role = { $nin: ["admin", "subadmin", "superadmin"] };
    }

    // Department filter
    if (department && department.trim()) {
      query.department = { $regex: department.trim(), $options: "i" };
    }

    // Batch filter
    if (batch && batch.trim()) {
      query.batch = { $regex: batch.trim(), $options: "i" };
    }

    // Search filter across name, email, department, college, batch, company
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchCondition = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { department: searchRegex },
          { college: searchRegex },
          { batch: searchRegex },
          { company: searchRegex },
        ],
      };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchCondition];
        delete query.$or;
      } else {
        query.$or = searchCondition.$or;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, registrations] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password")
        .populate("approvedBy", "name email")
        .populate("rejectedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Registrations Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching registrations" });
  }
};

// @desc    Get single registration applicant details
// @route   GET /api/admin/registrations/:id
// @access  Private/Admin
const getRegistrationById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .populate("suspendedBy", "name email");

    if (!user) {
      return res.status(404).json({ success: false, message: "Registration applicant not found" });
    }

    return res.status(200).json({
      success: true,
      registration: user,
      user,
    });
  } catch (error) {
    console.error("Get Registration By ID Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching registration details" });
  }
};

// @desc    Approve a pending user registration
// @route   PATCH /api/admin/users/:id/approve or /api/admin/registrations/:id/approve
// @access  Private/Admin
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = "APPROVED";
    user.accountStatus = "approved";
    user.approvalStatus = "approved";
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    user.rejectionReason = "";
    await user.save();

    try {
      await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: "account_approved",
        message: "Your GradConnect membership has been approved. You can now access the platform.",
      });
    } catch (notifErr) {
      console.warn("Could not create approval notification:", notifErr.message);
    }

    await logAdminAction({
      req,
      action: "USER_APPROVED",
      targetUser: user._id,
      targetResource: user.email,
      targetType: "User",
      description: `Admin ${req.user.name} approved account: ${user.name} (${user.email}).`,
      details: { role: user.role, status: user.status },
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${user.name} has been approved successfully.`,
      user,
    });
  } catch (error) {
    console.error("Approve User Error:", error);
    return res.status(500).json({ success: false, message: "Server error approving user" });
  }
};

// @desc    Reject a user registration with mandatory reason
// @route   PATCH /api/admin/users/:id/reject or /api/admin/registrations/:id/reject
// @access  Private/Admin
const rejectUser = async (req, res) => {
  try {
    const rejectionReason = (req.body.rejectionReason || req.body.reason || "").trim();

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "A clear rejection reason is required.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = "REJECTED";
    user.accountStatus = "rejected";
    user.approvalStatus = "rejected";
    user.rejectedAt = new Date();
    user.rejectedBy = req.user._id;
    user.rejectionReason = rejectionReason.trim();
    await user.save();

    try {
      await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: "account_rejected",
        message: `Your GradConnect registration was not approved. Reason: ${rejectionReason.trim()}`,
      });
    } catch (notifErr) {
      console.warn("Could not create rejection notification:", notifErr.message);
    }

    await logAdminAction({
      req,
      action: "USER_REJECTED",
      targetUser: user._id,
      targetResource: user.email,
      targetType: "User",
      description: `Admin ${req.user.name} rejected account: ${user.name} (${user.email}). Reason: ${user.rejectionReason}`,
      details: { role: user.role, status: user.status, reason: user.rejectionReason },
    });

    return res.status(200).json({
      success: true,
      message: `Registration for ${user.name} has been rejected.`,
      user,
    });
  } catch (error) {
    console.error("Reject User Error:", error);
    return res.status(500).json({ success: false, message: "Server error rejecting user" });
  }
};

// @desc    Delete or dismiss registration application
// @route   DELETE /api/admin/registrations/:id
// @access  Private/Admin
const deleteRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Registration applicant not found" });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    await user.save();

    await logAdminAction({
      req,
      action: "USER_DELETED",
      targetUser: user._id,
      targetResource: user.email,
      targetType: "User",
      description: `Admin ${req.user.name} removed applicant: ${user.name} (${user.email}).`,
    });

    return res.status(200).json({
      success: true,
      message: `Registration for ${user.name} removed successfully`,
    });
  } catch (error) {
    console.error("Delete Registration Error:", error);
    return res.status(500).json({ success: false, message: "Server error removing registration" });
  }
};

// ==========================================
// 3. USER MANAGEMENT (CRUD, SUSPEND, ACTIVATE)
// ==========================================

// @desc    Get all users with pagination, filters, sorting & search
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "all",
      status = "all",
      department = "",
      batch = "",
      college = "",
      sort = "newest",
    } = req.query;

    const query = { isDeleted: { $ne: true } };

    if (role && role !== "all") {
      query.role = role.toLowerCase();
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (department && department.trim()) {
      query.department = { $regex: department.trim(), $options: "i" };
    }

    if (batch && batch.trim()) {
      query.batch = { $regex: batch.trim(), $options: "i" };
    }

    if (college && college.trim()) {
      query.college = { $regex: college.trim(), $options: "i" };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { college: searchRegex },
        { company: searchRegex },
        { jobTitle: searchRegex },
      ];
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    else if (sort === "name_asc") sortOptions = { name: 1 };
    else if (sort === "name_desc") sortOptions = { name: -1 };
    else if (sort === "recently_active") sortOptions = { lastActiveAt: -1, updatedAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching user list" });
  }
};

// @desc    Get single user details with full subdocuments and audit history
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("connections", "name email avatar headline department batch userType")
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .populate("suspendedBy", "name email");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch user-specific audit logs
    const auditLogs = await AuditLog.find({
      $or: [{ targetUser: user._id }, { performedBy: user._id }],
    })
      .sort({ timestamp: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      user,
      auditLogs,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching user details" });
  }
};

// @desc    Create new user manually (Student or Alumni) by Admin
// @route   POST /api/admin/users
// @access  Private/Admin
const createUserByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "student",
      phone,
      age,
      college = "GradConnect Central University",
      department,
      degree,
      batch,
      graduationYear,
      jobTitle,
      company,
      industry,
      headline,
      bio,
      skills,
      interests,
      avatar,
      resume,
      userType,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validRoles = ["user", "alumni", "student", "subadmin", "superadmin", "admin"];
    const targetRole = role && validRoles.includes(role) ? role : "student";
    const determinedUserType =
      userType || (targetRole === "student" ? "Current Student" : "Alumni");

    let parsedSkills = [];
    if (Array.isArray(skills)) parsedSkills = skills;
    else if (typeof skills === "string" && skills.trim()) {
      parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    let parsedInterests = [];
    if (Array.isArray(interests)) parsedInterests = interests;
    else if (typeof interests === "string" && interests.trim()) {
      parsedInterests = interests.split(",").map((i) => i.trim()).filter(Boolean);
    }

    const defaultHeadline = headline && headline.trim()
      ? headline.trim()
      : jobTitle && jobTitle.trim()
      ? `${jobTitle.trim()} ${company ? `@ ${company.trim()}` : ""}`
      : `${determinedUserType} • ${department || "GradConnect"}`;

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: targetRole,
      status: "APPROVED", // Admin-created users are auto-approved
      approvedAt: new Date(),
      approvedBy: req.user._id,
      userType: determinedUserType,
      college: college ? college.trim() : "GradConnect Central University",
      department: department ? department.trim() : "",
      degree: degree ? degree.trim() : "",
      batch: batch ? batch.trim() : "",
      graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      jobTitle: jobTitle ? jobTitle.trim() : "",
      company: company ? company.trim() : "",
      industry: industry ? industry.trim() : "",
      headline: defaultHeadline,
      bio: bio ? bio.trim() : "",
      phone: phone ? phone.trim() : "",
      age: age ? parseInt(age, 10) : null,
      skills: parsedSkills,
      interests: parsedInterests,
      avatar: avatar || "",
      resume: resume || "",
      education: college || department ? [
        {
          school: college ? college.trim() : "GradConnect Central University",
          degree: degree ? degree.trim() : "B.Tech",
          fieldOfStudy: department ? department.trim() : "",
          endYear: batch ? batch.trim() : "",
        },
      ] : [],
    });

    await logAdminAction({
      req,
      action: "USER_CREATED",
      targetUser: newUser._id,
      targetResource: newUser.email,
      targetType: "User",
      description: `Admin ${req.user.name} manually created ${targetRole} account: ${newUser.name} (${newUser.email}).`,
      details: { role: newUser.role, status: newUser.status, department: newUser.department },
    });

    return res.status(201).json({
      success: true,
      message: `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} account created successfully`,
      user: newUser,
    });
  } catch (error) {
    console.error("Create User By Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error creating user" });
  }
};

// @desc    Update user with safe partial updates & log diffs (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserByAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const {
      name,
      email,
      role,
      status,
      password,
      college,
      department,
      degree,
      batch,
      graduationYear,
      jobTitle,
      company,
      industry,
      headline,
      bio,
      phone,
      age,
      skills,
      interests,
      avatar,
      resume,
      userType,
    } = req.body;

    const changes = {};

    // Validate and update name
    if (name && name.trim() && name.trim() !== userToUpdate.name) {
      changes.name = { from: userToUpdate.name, to: name.trim() };
      userToUpdate.name = name.trim();
    }

    // Validate and update email
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== userToUpdate.email) {
        const emailExists = await User.findOne({
          email: cleanEmail,
          _id: { $ne: userId },
        });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Email is already taken by another account",
          });
        }
        changes.email = { from: userToUpdate.email, to: cleanEmail };
        userToUpdate.email = cleanEmail;
      }
    }

    // Role update with safety check
    const validRoles = ["user", "alumni", "student", "subadmin", "superadmin", "admin"];
    if (role && validRoles.includes(role) && role !== userToUpdate.role) {
      // Non-superadmins cannot grant superadmin or subadmin privileges
      if (
        (role === "superadmin" || role === "subadmin" || role === "admin") &&
        req.user.role !== "superadmin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Only superadmin can promote users to administrative roles",
        });
      }
      changes.role = { from: userToUpdate.role, to: role };
      userToUpdate.role = role;
    }

    // Status update
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
    if (status && validStatuses.includes(status) && status !== userToUpdate.status) {
      changes.status = { from: userToUpdate.status, to: status };
      userToUpdate.status = status;
    }

    // Optional password update
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }
      changes.password = { from: "******", to: "Updated Password" };
      const salt = await bcrypt.genSalt(10);
      userToUpdate.password = await bcrypt.hash(password, salt);
    }

    // Metadata updates
    const scalarFields = [
      "college",
      "department",
      "degree",
      "batch",
      "jobTitle",
      "company",
      "industry",
      "headline",
      "bio",
      "phone",
      "avatar",
      "resume",
      "userType",
    ];

    scalarFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== userToUpdate[field]) {
        changes[field] = { from: userToUpdate[field], to: req.body[field] };
        userToUpdate[field] = req.body[field];
      }
    });

    if (graduationYear !== undefined) {
      const parsedGrad = graduationYear ? parseInt(graduationYear, 10) : null;
      if (parsedGrad !== userToUpdate.graduationYear) {
        changes.graduationYear = { from: userToUpdate.graduationYear, to: parsedGrad };
        userToUpdate.graduationYear = parsedGrad;
      }
    }

    if (age !== undefined) {
      const parsedAge = age ? parseInt(age, 10) : null;
      if (parsedAge !== userToUpdate.age) {
        changes.age = { from: userToUpdate.age, to: parsedAge };
        userToUpdate.age = parsedAge;
      }
    }

    if (skills !== undefined) {
      let parsedSkills = [];
      if (Array.isArray(skills)) parsedSkills = skills;
      else if (typeof skills === "string") {
        parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
      }
      changes.skills = { from: userToUpdate.skills, to: parsedSkills };
      userToUpdate.skills = parsedSkills;
    }

    if (interests !== undefined) {
      let parsedInterests = [];
      if (Array.isArray(interests)) parsedInterests = interests;
      else if (typeof interests === "string") {
        parsedInterests = interests.split(",").map((i) => i.trim()).filter(Boolean);
      }
      changes.interests = { from: userToUpdate.interests, to: parsedInterests };
      userToUpdate.interests = parsedInterests;
    }

    await userToUpdate.save();

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        req,
        action: "USER_UPDATED",
        targetUser: userToUpdate._id,
        targetResource: userToUpdate.email,
        targetType: "User",
        description: `Admin ${req.user.name} updated account for ${userToUpdate.name} (${userToUpdate.email}). Fields: ${Object.keys(changes).join(", ")}.`,
        details: changes,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userToUpdate,
    });
  } catch (error) {
    console.error("Update User By Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating user" });
  }
};

// @desc    Suspend user
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot suspend your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const suspensionReason = req.body.suspensionReason || req.body.reason;

    user.status = "SUSPENDED";
    user.accountStatus = "suspended";
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;
    user.suspensionReason = suspensionReason ? suspensionReason.trim() : "Suspended by administrator";
    await user.save();

    try {
      await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: "account_suspended",
        message: `Your GradConnect account has been suspended. Reason: ${user.suspensionReason}`,
      });
    } catch (notifErr) {
      console.warn("Could not create suspension notification:", notifErr.message);
    }

    await logAdminAction({
      req,
      action: "USER_SUSPENDED",
      targetUser: user._id,
      targetResource: user.email,
      targetType: "User",
      description: `Admin ${req.user.name} suspended account: ${user.name} (${user.email}). Reason: ${user.suspensionReason}`,
      details: { suspensionReason: user.suspensionReason },
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${user.name} has been suspended.`,
      user,
    });
  } catch (error) {
    console.error("Suspend User Error:", error);
    return res.status(500).json({ success: false, message: "Server error suspending user" });
  }
};

// @desc    Activate suspended user
// @route   PATCH /api/admin/users/:id/activate
// @access  Private/Admin
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = "APPROVED";
    user.accountStatus = "approved";
    user.approvalStatus = "approved";
    user.suspensionReason = null;
    user.suspendedAt = null;
    user.suspendedBy = null;
    await user.save();

    try {
      await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: "account_activated",
        message: "Your GradConnect account has been reactivated. You can now access the platform.",
      });
    } catch (notifErr) {
      console.warn("Could not create reactivation notification:", notifErr.message);
    }

    await logAdminAction({
      req,
      action: "USER_ACTIVATED",
      targetUser: user._id,
      targetResource: user.email,
      targetType: "User",
      description: `Admin ${req.user.name} reactivated account: ${user.name} (${user.email}).`,
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${user.name} has been reactivated.`,
      user,
    });
  } catch (error) {
    console.error("Activate User Error:", error);
    return res.status(500).json({ success: false, message: "Server error activating user" });
  }
};

// @desc    Safe delete user (Soft delete & audit)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUserByAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Only superadmin can delete an admin account
    if (
      (userToDelete.role === "admin" || userToDelete.role === "subadmin" || userToDelete.role === "superadmin") &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can delete administrative accounts",
      });
    }

    userToDelete.isDeleted = true;
    userToDelete.deletedAt = new Date();
    userToDelete.deletedBy = req.user._id;
    await userToDelete.save();

    await logAdminAction({
      req,
      action: "USER_DELETED",
      targetUser: userToDelete._id,
      targetResource: userToDelete.email,
      targetType: "User",
      description: `Admin ${req.user.name} deleted user ${userToDelete.name} (${userToDelete.email}).`,
      details: { role: userToDelete.role },
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${userToDelete.name} deleted successfully`,
      id: userId,
    });
  } catch (error) {
    console.error("Delete User By Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting user" });
  }
};

// ==========================================
// 4. CONTENT MANAGEMENT: BLOGS
// ==========================================

// @desc    Get blogs for admin panel with search & filter
// @route   GET /api/admin/blogs
// @access  Private/Admin
const getAdminBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all", category = "", featured = "all", sort = "newest" } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category.trim() && category !== "All") {
      query.category = category.trim();
    }

    if (featured === "featured" || featured === "true") {
      query.isFeatured = true;
    } else if (featured === "standard" || featured === "false") {
      query.isFeatured = { $ne: true };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { shortDescription: searchRegex }, { domain: searchRegex }, { category: searchRegex }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "views") sortOption = { views: -1 };
    else if (sort === "title") sortOption = { title: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, blogs, totalBlogs, publishedCount, draftCount, featuredCount, viewsAgg] = await Promise.all([
      Blog.countDocuments(query),
      Blog.find(query)
        .populate("author", "name email avatar")
        .populate("createdBy", "name email")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Blog.countDocuments({}),
      Blog.countDocuments({ status: "published" }),
      Blog.countDocuments({ status: "draft" }),
      Blog.countDocuments({ isFeatured: true }),
      Blog.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]),
    ]);

    const totalViews = viewsAgg[0]?.totalViews || 0;

    return res.status(200).json({
      success: true,
      blogs,
      stats: {
        total: totalBlogs,
        published: publishedCount,
        drafts: draftCount,
        featured: featuredCount,
        totalViews,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Admin Blogs Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching blogs" });
  }
};

// Helper function to generate URL slug
const generateSlug = (text) => {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now().toString().slice(-4)
  );
};

// @desc    Create blog article by Admin
// @route   POST /api/admin/blogs
// @access  Private/Admin
const createBlogByAdmin = async (req, res) => {
  try {
    const { title, shortDescription, content, category, domain, tags, bannerImage, bannerImageUrl, status, isFeatured } = req.body;

    const actualTitle = title ? title.trim() : "";
    const actualStatus = status || "published";

    if (actualStatus === "published") {
      if (!actualTitle) {
        return res.status(400).json({ success: false, message: "Blog title is required" });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: "Article content is required to publish" });
      }
    } else {
      if (!actualTitle) {
        return res.status(400).json({ success: false, message: "Blog title is required to save a draft" });
      }
    }

    const actualContent = content ? content.trim() : (req.body.body || "");
    const actualShortDesc = shortDescription
      ? shortDescription.trim()
      : (req.body.summary || req.body.description || (actualContent ? actualContent.slice(0, 160) : actualTitle));
    const actualCategory = category || req.body.topic || "Career Journey";

    let slug = generateSlug(actualTitle);
    const slugExists = await Blog.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    let defaultBanner = "";
    if (req.file) {
      defaultBanner = `/uploads/${req.file.filename}`;
    } else if (bannerImage && bannerImage.trim()) {
      defaultBanner = bannerImage.trim();
    } else if (bannerImageUrl && bannerImageUrl.trim()) {
      defaultBanner = bannerImageUrl.trim();
    } else {
      defaultBanner = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80";
    }

    let parsedTags = [];
    if (Array.isArray(tags)) parsedTags = tags;
    else if (typeof tags === "string" && tags.trim()) {
      parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const newBlog = await Blog.create({
      title: actualTitle,
      slug,
      shortDescription: actualShortDesc,
      content: actualContent,
      category: actualCategory,
      domain: domain ? domain.trim() : "Software Development",
      tags: parsedTags,
      bannerImage: defaultBanner,
      author: req.user._id,
      createdBy: req.user._id,
      status: actualStatus,
      isFeatured: isFeatured === "true" || isFeatured === true,
    });

    await logAdminAction({
      req,
      action: "BLOG_CREATED",
      targetResource: newBlog.title,
      targetType: "Blog",
      description: `Admin ${req.user.name} created blog: "${newBlog.title}". Status: ${newBlog.status}.`,
      details: { slug: newBlog.slug, status: newBlog.status },
    });

    return res.status(201).json({
      success: true,
      message: actualStatus === "draft" ? "Draft saved successfully" : "Blog published successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Create Blog Error:", error);
    return res.status(500).json({ success: false, message: "Server error creating blog" });
  }
};

// @desc    Update blog article by Admin
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
const updateBlogByAdmin = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const { title, shortDescription, content, category, domain, tags, bannerImage, bannerImageUrl, status, isFeatured } = req.body;

    if (title && title.trim() && title.trim() !== blog.title) {
      blog.title = title.trim();
      let newSlug = generateSlug(title);
      const slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: blog._id } });
      if (slugExists) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
      blog.slug = newSlug;
    }

    if (shortDescription !== undefined) blog.shortDescription = shortDescription.trim();
    if (content !== undefined) blog.content = content.trim();
    if (category) blog.category = category;
    if (domain) blog.domain = domain.trim();
    if (status) blog.status = status;
    if (isFeatured !== undefined) blog.isFeatured = isFeatured === "true" || isFeatured === true;

    if (req.file) {
      blog.bannerImage = `/uploads/${req.file.filename}`;
    } else if (bannerImage && bannerImage.trim()) {
      blog.bannerImage = bannerImage.trim();
    } else if (bannerImageUrl && bannerImageUrl.trim()) {
      blog.bannerImage = bannerImageUrl.trim();
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) blog.tags = tags;
      else if (typeof tags === "string") {
        blog.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    blog.updatedBy = req.user._id;
    await blog.save();

    await logAdminAction({
      req,
      action: "BLOG_UPDATED",
      targetResource: blog.title,
      targetType: "Blog",
      description: `Admin ${req.user.name} updated blog: "${blog.title}".`,
      details: { status: blog.status },
    });

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    console.error("Update Blog Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating blog" });
  }
};

// @desc    Delete blog by Admin
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
const deleteBlogByAdmin = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const title = blog.title;
    await Blog.findByIdAndDelete(req.params.id);

    await logAdminAction({
      req,
      action: "BLOG_DELETED",
      targetResource: title,
      targetType: "Blog",
      description: `Admin ${req.user.name} deleted blog: "${title}".`,
    });

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting blog" });
  }
};

// @desc    Toggle blog publish / draft status
// @route   PATCH /api/admin/blogs/:id/status
// @access  Private/Admin
const toggleBlogStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const { status } = req.body;
    const nextStatus = status || (blog.status === "published" ? "draft" : "published");

    blog.status = nextStatus;
    blog.updatedBy = req.user._id;
    await blog.save();

    await logAdminAction({
      req,
      action: "BLOG_STATUS_CHANGED",
      targetResource: blog.title,
      targetType: "Blog",
      description: `Admin ${req.user.name} changed blog status to "${nextStatus}" for "${blog.title}".`,
      details: { status: nextStatus },
    });

    return res.status(200).json({
      success: true,
      message: `Blog status updated to ${nextStatus}`,
      blog,
    });
  } catch (error) {
    console.error("Toggle Blog Status Error:", error);
    return res.status(500).json({ success: false, message: "Server error changing blog status" });
  }
};

// @desc    Toggle blog featured status
// @route   PATCH /api/admin/blogs/:id/feature
// @access  Private/Admin
const toggleFeatured = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    blog.isFeatured = !blog.isFeatured;
    blog.updatedBy = req.user._id;
    await blog.save();

    await logAdminAction({
      req,
      action: blog.isFeatured ? "BLOG_FEATURED" : "BLOG_UNFEATURED",
      targetResource: blog.title,
      targetType: "Blog",
      description: `Admin ${req.user.name} ${blog.isFeatured ? "featured" : "unfeatured"} blog: "${blog.title}".`,
      details: { isFeatured: blog.isFeatured },
    });

    return res.status(200).json({
      success: true,
      message: `Article ${blog.isFeatured ? "featured" : "unfeatured"} successfully`,
      isFeatured: blog.isFeatured,
      blog,
    });
  } catch (error) {
    console.error("Toggle Featured Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating featured status" });
  }
};

// ==========================================
// 5. CONTENT MANAGEMENT: DOMAIN ARTICLES
// ==========================================

// @desc    Get domain articles for admin editorial panel
// @route   GET /api/admin/domains
// @access  Private/Admin
const getAdminDomains = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", domain = "all", status = "all" } = req.query;

    const query = { domain: { $exists: true, $ne: "" } };

    if (domain && domain !== "all") {
      query.domain = domain;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { shortDescription: searchRegex }, { domain: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, articles] = await Promise.all([
      Blog.countDocuments(query),
      Blog.find(query)
        .populate("author", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      articles,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Admin Domains Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching domain articles" });
  }
};

// @desc    Create domain article by Admin
// @route   POST /api/admin/domains
// @access  Private/Admin
const createDomainArticle = async (req, res) => {
  try {
    const { title, domain, shortDescription, content, category, tags, bannerImage, status } = req.body;

    const actualTitle = (title || req.body.name || "").trim();
    const actualDomain = (domain || req.body.category || "Software Development").trim();
    const actualContent = (content || req.body.description || actualTitle).trim();
    const actualShortDesc = (shortDescription || req.body.description || (actualContent ? actualContent.slice(0, 160) : actualTitle)).trim();

    if (!actualTitle) {
      return res.status(400).json({
        success: false,
        message: "Title is required for domain article",
      });
    }

    const slug = generateSlug(`${actualDomain}-${actualTitle}`);
    const defaultBanner =
      bannerImage ||
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80";

    let parsedTags = [];
    if (Array.isArray(tags)) parsedTags = tags;
    else if (typeof tags === "string" && tags.trim()) {
      parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const newArticle = await Blog.create({
      title: actualTitle,
      slug,
      shortDescription: actualShortDesc,
      content: actualContent,
      category: category || "Technical Roadmap",
      domain: actualDomain,
      tags: parsedTags,
      bannerImage: defaultBanner,
      author: req.user._id,
      createdBy: req.user._id,
      status: status || "published",
    });

    await logAdminAction({
      req,
      action: "DOMAIN_CREATED",
      targetResource: newArticle.title,
      targetType: "Domain",
      description: `Admin ${req.user.name} published domain article: "${newArticle.title}" in [${newArticle.domain}].`,
      details: { domain: newArticle.domain, slug: newArticle.slug },
    });

    return res.status(201).json({
      success: true,
      message: "Domain article created successfully",
      article: newArticle,
      domain: newArticle,
    });
  } catch (error) {
    console.error("Create Domain Article Error:", error);
    return res.status(500).json({ success: false, message: "Server error creating domain article" });
  }
};

// @desc    Update domain article by Admin
// @route   PUT /api/admin/domains/:id
// @access  Private/Admin
const updateDomainArticle = async (req, res) => {
  try {
    const article = await Blog.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Domain article not found" });
    }

    const { title, domain, shortDescription, content, category, tags, bannerImage, status } = req.body;

    if (title && title.trim()) article.title = title.trim();
    if (domain && domain.trim()) article.domain = domain.trim();
    if (shortDescription && shortDescription.trim()) article.shortDescription = shortDescription.trim();
    if (content) article.content = content;
    if (category) article.category = category;
    if (bannerImage) article.bannerImage = bannerImage;
    if (status) article.status = status;

    if (tags !== undefined) {
      if (Array.isArray(tags)) article.tags = tags;
      else if (typeof tags === "string") {
        article.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    article.updatedBy = req.user._id;
    await article.save();

    await logAdminAction({
      req,
      action: "DOMAIN_UPDATED",
      targetResource: article.title,
      targetType: "Domain",
      description: `Admin ${req.user.name} updated domain article: "${article.title}".`,
      details: { domain: article.domain, status: article.status },
    });

    return res.status(200).json({
      success: true,
      message: "Domain article updated successfully",
      article,
    });
  } catch (error) {
    console.error("Update Domain Article Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating domain article" });
  }
};

// @desc    Delete domain article by Admin
// @route   DELETE /api/admin/domains/:id
// @access  Private/Admin
const deleteDomainArticle = async (req, res) => {
  try {
    const article = await Blog.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Domain article not found" });
    }

    const title = article.title;
    await Blog.findByIdAndDelete(req.params.id);

    await logAdminAction({
      req,
      action: "DOMAIN_DELETED",
      targetResource: title,
      targetType: "Domain",
      description: `Admin ${req.user.name} deleted domain article: "${title}".`,
    });

    return res.status(200).json({
      success: true,
      message: "Domain article deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete Domain Article Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting domain article" });
  }
};

// ==========================================
// 6. CONTENT MANAGEMENT: EVENTS
// ==========================================

// @desc    Get all events for admin management with rich telemetry & filters
// @route   GET /api/admin/events
// @access  Private/Admin
const getAdminEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      eventType = "all",
      mode = "all",
      source = "all",
      dateFilter = "all",
    } = req.query;

    const query = { isDeleted: { $ne: true } };

    // Status filter
    if (status && status !== "all") {
      const sUpper = status.toUpperCase();
      if (sUpper === "PENDING" || sUpper === "PENDING_APPROVAL" || sUpper === "PENDING_ADMIN_APPROVAL") {
        query.status = { $in: ["PENDING", "PENDING_ADMIN_APPROVAL"] };
      } else if (sUpper === "APPROVED") {
        query.status = { $in: ["APPROVED", "PUBLISHED"] };
      } else if (sUpper === "PUBLISHED") {
        query.published = true;
        query.status = { $in: ["PUBLISHED", "APPROVED", "Open for Registration", "Almost Full"] };
      } else if (sUpper === "REJECTED") {
        query.status = "REJECTED";
      } else if (sUpper === "CANCELLED") {
        query.status = "CANCELLED";
      } else if (sUpper === "COMPLETED") {
        query.status = "COMPLETED";
      } else if (sUpper === "DRAFT") {
        query.$or = [{ status: "DRAFT" }, { published: false, status: { $nin: ["PENDING", "PENDING_ADMIN_APPROVAL", "REJECTED"] } }];
      } else {
        query.status = status;
      }
    }

    // Event Type filter
    if (eventType && eventType !== "all") {
      query.eventType = new RegExp(`^${eventType.trim()}$`, "i");
    }

    // Mode filter
    if (mode && mode !== "all") {
      if (mode.toLowerCase() === "offline" || mode.toLowerCase() === "in-person") {
        query.mode = { $in: ["Offline", "In-person"] };
      } else {
        query.mode = new RegExp(`^${mode.trim()}$`, "i");
      }
    }

    // Source filter (Admin vs Alumni)
    if (source && source !== "all") {
      if (source.toLowerCase() === "alumni") {
        query.createdByRole = "alumni";
      } else if (source.toLowerCase() === "admin") {
        query.createdByRole = { $in: ["admin", "superadmin", "subadmin"] };
      }
    }

    // Date filter
    const now = new Date();
    if (dateFilter && dateFilter !== "all") {
      const dLower = dateFilter.toLowerCase();
      if (dLower === "upcoming") {
        query.date = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
      } else if (dLower === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      } else if (dLower === "past") {
        query.date = { $lt: now };
      }
    }

    // Search by title, venue, organizer
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { venue: searchRegex },
        { venueName: searchRegex },
        { organizer: searchRegex },
        { organizerName: searchRegex },
        { category: searchRegex },
        { domain: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, events, allDbEvents, totalRegistrations] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .populate("createdBy", "name email role userType avatar")
        .populate("organizerId", "name email role userType avatar")
        .populate("domainId", "name slug category")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Event.find({ isDeleted: { $ne: true } }).select("status published date createdByRole adminApproved").lean(),
      EventRegistration.countDocuments({ status: { $in: ["PENDING", "APPROVED", "REGISTERED", "ATTENDED"] } }),
    ]);

    // Calculate real database stats for KPIs
    const stats = {
      totalEvents: allDbEvents.length,
      publishedEvents: allDbEvents.filter((e) => e.published === true || e.status === "PUBLISHED").length,
      pendingEvents: allDbEvents.filter((e) => e.status === "PENDING" || e.status === "PENDING_ADMIN_APPROVAL").length,
      pendingApproval: allDbEvents.filter((e) => e.status === "PENDING" || e.status === "PENDING_ADMIN_APPROVAL").length,
      approvedEvents: allDbEvents.filter((e) => e.status === "APPROVED" || e.status === "PUBLISHED" || e.adminApproved === true).length,
      rejectedEvents: allDbEvents.filter((e) => e.status === "REJECTED").length,
      draftEvents: allDbEvents.filter((e) => e.status === "DRAFT" || (!e.published && !["PENDING", "PENDING_ADMIN_APPROVAL", "REJECTED"].includes(e.status))).length,
      cancelledEvents: allDbEvents.filter((e) => e.status === "CANCELLED").length,
      upcomingEvents: allDbEvents.filter((e) => new Date(e.date) >= now).length,
      totalRegistrations,
    };

    return res.status(200).json({
      success: true,
      events,
      stats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Admin Events Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching events" });
  }
};

// @desc    Create event by Admin
// @route   POST /api/admin/events
// @access  Private/Admin
const createEventByAdmin = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      date,
      time,
      startTime,
      endTime,
      duration,
      venue,
      location,
      mode,
      eventType,
      category,
      domain,
      domainId,
      organizer,
      organizerId,
      maxAttendees,
      price,
      currency,
      image,
      bannerImage,
      status,
      registrationEnabled,
      registrationDeadline,
      topics,
      agenda,
    } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({
        success: false,
        message: "Event title, description, and event date are required",
      });
    }

    let formattedMode = "Online";
    if (mode) {
      const mLower = mode.toLowerCase();
      if (mLower.includes("hybrid")) formattedMode = "Hybrid";
      else if (mLower.includes("in-person") || mLower.includes("person")) formattedMode = "In-person";
      else if (mLower.includes("offline")) formattedMode = "Offline";
      else formattedMode = "Online";
    }

    let isPublished = true;
    let formattedStatus = "PUBLISHED";
    if (status && (status.toUpperCase() === "DRAFT" || status === "draft")) {
      formattedStatus = "DRAFT";
      isPublished = false;
    }

    const numPrice = typeof price === "number" ? price : parseFloat(price) || 0;
    const capacityNum = parseInt(req.body.capacity || maxAttendees, 10) || 100;
    const eventVenue = (venue || location || (formattedMode === "Online" ? "Virtual Meeting" : "Main Auditorium")).trim();

    const slugBase = title.toLowerCase().trim().replace(/[\s\W-]+/g, "-").replace(/^-+|-+$/g, "");
    let uniqueSlug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const newEvent = await Event.create({
      title: title.trim(),
      slug: uniqueSlug,
      description: description.trim(),
      shortDescription: shortDescription ? shortDescription.trim() : description.slice(0, 160).trim(),
      date: new Date(date),
      time: time || (startTime && endTime ? `${startTime} - ${endTime}` : "10:00 AM - 4:00 PM IST"),
      startTime: startTime || "10:00 AM",
      endTime: endTime || "4:00 PM",
      duration: duration || "1 Day",
      venue: eventVenue,
      location: eventVenue,
      mode: formattedMode,
      eventType: eventType || category || "Technical Workshop",
      category: category || eventType || "Technical Workshop",
      domain: domain || "Full Stack Development",
      domainId: domainId && mongoose.isValidObjectId(domainId) ? domainId : undefined,
      organizer: organizer ? organizer.trim() : req.user.name,
      organizerId: organizerId && mongoose.isValidObjectId(organizerId) ? organizerId : req.user._id,
      createdBy: req.user._id,
      createdByRole: req.user.role || "admin",
      maxAttendees: capacityNum,
      price: numPrice,
      priceType: numPrice > 0 ? "Paid" : "Free",
      currency: currency || "INR",
      bannerImage:
        image ||
        bannerImage ||
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      status: formattedStatus,
      visibility: isPublished ? "PUBLIC" : "UNPUBLISHED",
      published: isPublished,
      registrationEnabled: registrationEnabled !== false,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      topics: Array.isArray(topics) ? topics : [],
      agenda: Array.isArray(agenda) ? agenda : [],
      attendees: isPublished ? [req.user._id] : [],
      publishedAt: isPublished ? new Date() : undefined,
      publishedBy: isPublished ? req.user._id : undefined,
    });

    if (isPublished) {
      await EventRegistration.create({
        eventId: newEvent._id,
        userId: req.user._id,
        status: "REGISTERED",
        registeredAt: new Date(),
      });
    }

    await logAdminAction({
      req,
      action: "EVENT_CREATED",
      targetResource: newEvent.title,
      targetType: "Event",
      description: `Admin ${req.user.name} created event: "${newEvent.title}" (${formattedStatus}).`,
      details: { eventId: newEvent._id, status: formattedStatus, mode: newEvent.mode },
    });

    const populatedEvent = await Event.findById(newEvent._id)
      .populate("createdBy", "name email role userType avatar")
      .populate("organizerId", "name email role userType avatar")
      .populate("domainId", "name slug category");

    return res.status(201).json({
      success: true,
      message: isPublished ? "Event published successfully" : "Event saved as draft",
      event: populatedEvent,
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error creating event" });
  }
};

// @desc    Update event by Admin
// @route   PUT /api/admin/events/:id
// @access  Private/Admin
const updateEventByAdmin = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const {
      title,
      description,
      shortDescription,
      date,
      time,
      startTime,
      endTime,
      duration,
      venue,
      location,
      mode,
      eventType,
      category,
      domain,
      domainId,
      organizer,
      maxAttendees,
      price,
      image,
      bannerImage,
      status,
      registrationEnabled,
      registrationDeadline,
      topics,
      agenda,
    } = req.body;

    if (title && title.trim()) event.title = title.trim();
    if (description && description.trim()) event.description = description.trim();
    if (shortDescription !== undefined) event.shortDescription = shortDescription.trim();
    if (date) event.date = new Date(date);
    if (time) event.time = time;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (duration) event.duration = duration;
    if (venue || location) {
      event.venue = (venue || location).trim();
      event.location = event.venue;
    }
    if (mode) event.mode = mode;
    if (eventType) event.eventType = eventType;
    if (category) event.category = category;
    if (domain) event.domain = domain;
    if (domainId && mongoose.isValidObjectId(domainId)) event.domainId = domainId;
    if (organizer) event.organizer = organizer.trim();
    if (maxAttendees !== undefined) event.maxAttendees = parseInt(maxAttendees, 10);
    if (price !== undefined) {
      event.price = Number(price) || 0;
      event.priceType = event.price > 0 ? "Paid" : "Free";
    }
    if (image || bannerImage) event.bannerImage = image || bannerImage;
    if (registrationEnabled !== undefined) event.registrationEnabled = Boolean(registrationEnabled);
    if (registrationDeadline) event.registrationDeadline = new Date(registrationDeadline);
    if (Array.isArray(topics)) event.topics = topics;
    if (Array.isArray(agenda)) event.agenda = agenda;

    if (status) {
      event.status = status;
      if (status === "PUBLISHED") {
        event.published = true;
        event.visibility = "PUBLIC";
        if (!event.publishedAt) event.publishedAt = new Date();
      } else if (status === "DRAFT" || status === "UNPUBLISHED") {
        event.published = false;
        event.visibility = "UNPUBLISHED";
      }
    }

    event.updatedBy = req.user._id;
    await event.save();

    await logAdminAction({
      req,
      action: "EVENT_UPDATED",
      targetResource: event.title,
      targetType: "Event",
      description: `Admin ${req.user.name} updated event: "${event.title}".`,
      details: { eventId: event._id },
    });

    const populated = await Event.findById(event._id)
      .populate("createdBy", "name email role userType avatar")
      .populate("organizerId", "name email role userType avatar")
      .populate("domainId", "name slug category")
      .populate("attendees", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: populated,
    });
  } catch (error) {
    console.error("Update Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating event" });
  }
};

// @desc    Delete event by Admin
// @route   DELETE /api/admin/events/:id
// @access  Private/Admin
const deleteEventByAdmin = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const title = event.title;
    await EventRegistration.deleteMany({ eventId: event._id });
    await Event.findByIdAndDelete(req.params.id);

    await logAdminAction({
      req,
      action: "EVENT_DELETED",
      targetResource: title,
      targetType: "Event",
      description: `Admin ${req.user.name} permanently deleted event: "${title}".`,
      details: { eventId: req.params.id },
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting event" });
  }
};

// @desc    Toggle Publish status for an event
// @route   PATCH /api/admin/events/:id/publish
// @access  Private/Admin
const toggleEventPublish = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const nowPublished = !event.published;
    event.published = nowPublished;
    event.status = nowPublished ? "PUBLISHED" : "UNPUBLISHED";
    event.visibility = nowPublished ? "PUBLIC" : "UNPUBLISHED";
    if (nowPublished && !event.publishedAt) event.publishedAt = new Date();
    await event.save();

    await logAdminAction({
      req,
      action: nowPublished ? "EVENT_PUBLISHED" : "EVENT_UNPUBLISHED",
      targetResource: event.title,
      targetType: "Event",
      description: `Admin ${req.user.name} ${nowPublished ? "published" : "unpublished"} event "${event.title}".`,
      details: { eventId: event._id },
    });

    return res.status(200).json({
      success: true,
      message: `Event ${nowPublished ? "published" : "unpublished"} successfully`,
      event,
    });
  } catch (error) {
    console.error("Toggle Publish Error:", error);
    return res.status(500).json({ success: false, message: "Server error toggling event publish status" });
  }
};

// @desc    Approve alumni submitted event
// @route   PUT /api/admin/events/:id/approve
// @access  Private/Admin
const approveEventSubmission = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.status = "APPROVED";
    event.published = true;
    event.visibility = "PUBLIC";
    event.adminApproved = true;
    event.adminApprovedBy = req.user._id;
    event.adminApprovedAt = new Date();
    event.approvedAt = new Date();
    event.approvedBy = req.user._id;
    event.publishedAt = new Date();
    event.rejectionReason = "";
    await event.save();

    if (event.createdBy) {
      await Notification.create({
        recipient: event.createdBy,
        sender: req.user._id,
        type: "event_approved",
        message: `Congratulations! Your event "${event.title}" has been approved and published to the community.`,
      });
    }

    await logAdminAction({
      req,
      action: "EVENT_APPROVED",
      targetResource: event.title,
      targetType: "Event",
      description: `Admin ${req.user.name} approved and published alumni event: "${event.title}".`,
      details: { eventId: event._id },
    });

    return res.status(200).json({
      success: true,
      message: "Event approved and published successfully",
      event,
    });
  } catch (error) {
    console.error("Approve Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error approving event" });
  }
};

// @desc    Reject alumni submitted event
// @route   PUT /api/admin/events/:id/reject
// @access  Private/Admin
const rejectEventSubmission = async (req, res) => {
  try {
    const { rejectionReason, reason } = req.body;
    const finalReason = rejectionReason || reason;

    if (!finalReason || !finalReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required to provide actionable feedback to the organizer",
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.status = "REJECTED";
    event.published = false;
    event.visibility = "UNPUBLISHED";
    event.rejectionReason = finalReason.trim();
    await event.save();

    if (event.createdBy) {
      await Notification.create({
        recipient: event.createdBy,
        sender: req.user._id,
        type: "event_rejected",
        message: `Your event submission "${event.title}" was not approved. Feedback: "${finalReason.trim()}".`,
      });
    }

    await logAdminAction({
      req,
      action: "EVENT_REJECTED",
      targetResource: event.title,
      targetType: "Event",
      description: `Admin ${req.user.name} rejected event submission "${event.title}". Reason: "${finalReason.trim()}".`,
      details: { eventId: event._id, reason: finalReason.trim() },
    });

    return res.status(200).json({
      success: true,
      message: "Event rejected with feedback recorded",
      event,
    });
  } catch (error) {
    console.error("Reject Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error rejecting event" });
  }
};

// @desc    Cancel event by Admin
// @route   PATCH /api/admin/events/:id/cancel
// @access  Private/Admin
const cancelEventByAdmin = async (req, res) => {
  try {
    const { cancellationReason, reason } = req.body;
    const finalReason = (cancellationReason || reason || "Cancelled by university administration").trim();

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.status = "CANCELLED";
    event.cancelledAt = new Date();
    event.cancellationReason = finalReason;
    event.registrationEnabled = false;
    await event.save();

    // Broadcast cancellation notifications to all registered attendees
    const registrations = await EventRegistration.find({
      eventId: event._id,
      status: { $in: ["REGISTERED", "ATTENDED"] },
    });

    for (const reg of registrations) {
      await Notification.create({
        recipient: reg.userId,
        sender: req.user._id,
        type: "event_cancelled",
        message: `Notice: The event "${event.title}" has been cancelled. Reason: "${finalReason}".`,
      });
    }

    await logAdminAction({
      req,
      action: "EVENT_CANCELLED",
      targetResource: event.title,
      targetType: "Event",
      description: `Admin ${req.user.name} cancelled event "${event.title}". Reason: "${finalReason}".`,
      details: { eventId: event._id, attendeesNotified: registrations.length },
    });

    return res.status(200).json({
      success: true,
      message: `Event cancelled. ${registrations.length} registered attendees notified.`,
      event,
    });
  } catch (error) {
    console.error("Cancel Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error cancelling event" });
  }
};

// @desc    Get all attendees / registrations for an event (Admin)
// @route   GET /api/admin/events/:id/attendees
// @access  Private/Admin
const getAdminEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate("userId", "name email avatar department college batch role userType phone")
      .sort({ registeredAt: -1 });

    const totalRegistered = registrations.filter((r) => r.status === "REGISTERED").length;
    const attendedCount = registrations.filter((r) => r.status === "ATTENDED").length;
    const noShowCount = registrations.filter((r) => r.status === "NO_SHOW").length;
    const cancelledCount = registrations.filter((r) => r.status === "CANCELLED").length;

    return res.status(200).json({
      success: true,
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      maxAttendees: event.maxAttendees,
      counts: {
        total: registrations.length,
        registered: totalRegistered,
        attended: attendedCount,
        noShow: noShowCount,
        cancelled: cancelledCount,
      },
      attendees: registrations.map((r) => ({
        registrationId: r._id,
        user: r.userId,
        status: r.status,
        registeredAt: r.registeredAt,
        attendedAt: r.attendedAt,
        cancelledAt: r.cancelledAt,
        cancellationReason: r.cancellationReason,
        notes: r.notes,
      })),
    });
  } catch (error) {
    console.error("Get Event Attendees Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching attendees" });
  }
};

// @desc    Update attendee registration status (Admin marks ATTENDED, NO_SHOW, CANCELLED)
// @route   PATCH /api/admin/events/:id/attendees/:registrationId
// @access  Private/Admin
const updateAttendeeStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["REGISTERED", "ATTENDED", "NO_SHOW", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const registration = await EventRegistration.findById(registrationId).populate("userId", "name email");
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    registration.status = status;
    if (notes !== undefined) registration.notes = notes.trim();

    if (status === "ATTENDED") {
      registration.attendedAt = new Date();
    } else if (status === "CANCELLED") {
      registration.cancelledAt = new Date();
    }

    await registration.save();

    // Sync Event.attendees array
    const event = await Event.findById(registration.eventId);
    if (event) {
      const uStr = registration.userId._id.toString();
      if (status === "REGISTERED" || status === "ATTENDED") {
        if (!event.attendees.some((id) => id.toString() === uStr)) {
          event.attendees.push(registration.userId._id);
          await event.save();
        }
      } else {
        event.attendees = event.attendees.filter((id) => id.toString() !== uStr);
        await event.save();
      }
    }

    await logAdminAction({
      req,
      action: "ATTENDANCE_MARKED",
      targetResource: event ? event.title : "Event Registration",
      targetType: "Event",
      description: `Admin ${req.user.name} marked ${registration.userId?.name} as ${status}.`,
      details: { registrationId: registration._id, status },
    });

    return res.status(200).json({
      success: true,
      message: `Attendee status updated to ${status}`,
      registration,
    });
  } catch (error) {
    console.error("Update Attendee Status Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating attendee status" });
  }
};


// ==========================================
// 7. AUDIT / ACTIVITY LOGS
// ==========================================

// @desc    Get paginated audit logs with search, action filters & date range
// @route   GET /api/admin/activity
// @access  Private/Admin
const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      targetType = "all",
      dateRange = "all",
      startDate = "",
      endDate = "",
    } = req.query;

    const query = {};

    if (targetType && targetType !== "all") {
      query.targetType = targetType;
    }

    // Date range filter
    if (dateRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.timestamp = { $gte: today };
    } else if (dateRange === "7days") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      query.timestamp = { $gte: past7 };
    } else if (dateRange === "30days") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      query.timestamp = { $gte: past30 };
    } else if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Search filter across description, performedByName, targetResource, action
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { description: searchRegex },
        { performedByName: searchRegex },
        { performedByEmail: searchRegex },
        { targetResource: searchRegex },
        { action: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .populate("performedBy", "name email avatar role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Activity Logs Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching activity logs" });
  }
};

// ==========================================
// 8. SETTINGS & ADMIN PROFILE
// ==========================================

// @desc    Get admin settings & profile
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user._id).select("-password");

    return res.status(200).json({
      success: true,
      profile: adminUser,
      system: {
        systemName: "GradConnect Central Platform",
        version: "2.4.0",
        maintenanceMode: false,
        environment: process.env.NODE_ENV || "development",
        allowPublicRegistration: true,
        requireApprovalForStudents: true,
        requireApprovalForAlumni: true,
      },
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching settings" });
  }
};

// @desc    Update admin own profile
// @route   PUT /api/admin/settings/profile
// @access  Private/Admin
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, avatar, password } = req.body;
    const admin = await User.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    if (name && name.trim()) admin.name = name.trim();

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== admin.email) {
        const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: admin._id } });
        if (emailExists) {
          return res.status(400).json({ success: false, message: "Email is already taken" });
        }
        admin.email = cleanEmail;
      }
    }

    if (avatar !== undefined) admin.avatar = avatar;

    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    // Role is strictly preserved - never allow self-privilege tampering
    await admin.save();

    await logAdminAction({
      req,
      action: "ADMIN_PROFILE_UPDATED",
      targetResource: admin.email,
      targetType: "Settings",
      description: `Administrator ${admin.name} updated their own profile settings.`,
    });

    const updatedObj = admin.toObject();
    delete updatedObj.password;

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      profile: updatedObj,
      user: updatedObj,
    });
  } catch (error) {
    console.error("Update Admin Profile Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating admin profile" });
  }
};

// ==========================================
// 9. BACKWARD COMPATIBILITY ENDPOINTS
// ==========================================

// @desc    Get complete activity log history for a specific user
// @route   GET /api/admin/users/:id/history
// @access  Private/Admin
const getUserHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const history = await AuditLog.find({
      $or: [{ targetUser: userId }, { performedBy: userId }],
    })
      .populate("performedBy", "name email adminLabel role avatar")
      .sort({ timestamp: -1 });

    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error("Get User History Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching user history" });
  }
};

// @desc    Get subadmin feature usage status
// @route   GET /api/admin/usage-status
// @access  Private/Admin
const getUsageStatus = async (req, res) => {
  try {
    if (req.user.role === "superadmin" || req.user.role === "admin") {
      return res.status(200).json({ unlimited: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const logs = await UsageLog.find({
      admin: req.user._id,
      date: today,
    });

    const usageMap = {
      user_management: 0,
      reports: 0,
      activity_logs: 0,
      settings: 0,
      blogs: 0,
      banners: 0,
    };

    logs.forEach((log) => {
      if (Object.prototype.hasOwnProperty.call(usageMap, log.feature)) {
        usageMap[log.feature] = log.count;
      }
    });

    return res.status(200).json({
      unlimited: false,
      limit: 3,
      usage: usageMap,
    });
  } catch (error) {
    console.error("Get Usage Status Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching usage status" });
  }
};

// @desc    Get Reports section data
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newToday, pendingCount, totalUsers] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: today }, isDeleted: { $ne: true } }),
      User.countDocuments({ status: "PENDING", isDeleted: { $ne: true } }),
      User.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Reports generated successfully",
      reports: [
        {
          id: 1,
          key: "daily-registrations",
          name: "Daily Registrations Audit",
          filename: "daily-registrations-audit.pdf",
          downloadUrl: "/admin/reports/daily-registrations/pdf",
          detail: `${newToday} new registrations logged today`,
          generatedAt: new Date(),
        },
        {
          id: 2,
          key: "pending-approvals",
          name: "Pending Approvals Summary",
          filename: "pending-approvals-summary.pdf",
          downloadUrl: "/admin/reports/pending-approvals/pdf",
          detail: `${pendingCount} accounts waiting for admin review`,
          generatedAt: new Date(),
        },
        {
          id: 3,
          key: "membership",
          name: "Overall Membership Report",
          filename: "overall-membership-report.pdf",
          downloadUrl: "/admin/reports/membership/pdf",
          detail: `${totalUsers} total verified community members`,
          generatedAt: new Date(),
        },
      ],
    });
  } catch (error) {
    console.error("Get Reports Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching reports" });
  }
};

// @desc    Generate & Download Daily Registrations Audit PDF
// @route   GET /api/admin/reports/daily-registrations/pdf
// @access  Private/Admin
const generateDailyRegistrationsPdf = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query real data from MongoDB
    const [todayUsers, totalUsersCount, todayEventRegs, totalEventRegsCount, recentUsers, recentEventRegs] = await Promise.all([
      User.find({ createdAt: { $gte: today }, isDeleted: { $ne: true } }).sort({ createdAt: -1 }),
      User.countDocuments({ isDeleted: { $ne: true } }),
      EventRegistration.find({ createdAt: { $gte: today } }).populate("eventId", "title").sort({ createdAt: -1 }),
      EventRegistration.countDocuments(),
      User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(30),
      EventRegistration.find().populate("eventId", "title").sort({ createdAt: -1 }).limit(25),
    ]);

    const filename = "daily-registrations-audit.pdf";
    const doc = createReportDocument(res, filename);

    // 1. Header
    renderReportHeader(doc, {
      title: "Daily Registrations Audit",
      subtitle: "Comprehensive audit of user account activations and event participant enrollments.",
      generatedAt: new Date(),
    });

    // 2. Summary KPI Metrics
    renderSummaryCards(doc, [
      { label: "New Users Today", value: todayUsers.length, subtext: `Audit Date: ${formatShortDate(today)}` },
      { label: "Total Platform Users", value: totalUsersCount, subtext: "Lifetime registered members" },
      { label: "Event Signups Today", value: todayEventRegs.length, subtext: "Campus session signups" },
      { label: "Total Event Signups", value: totalEventRegsCount, subtext: "Platform-wide registrations" },
    ]);

    // 3. User Account Registrations Section
    if (todayUsers.length > 0) {
      renderSectionTitle(doc, "User Registrations Logged Today", todayUsers.length);
      const userRows = todayUsers.map((u) => [
        u.name || "N/A",
        u.email || "N/A",
        u.userType || u.role || "Alumni",
        u.department || u.college || "General",
        formatShortDate(u.createdAt),
        u.status || "APPROVED",
      ]);
      renderTable(doc, {
        headers: ["Name", "Email", "Role / Type", "Department / College", "Registered", "Status"],
        columnWidths: [105, 135, 75, 95, 55, 50],
        rows: userRows,
      });
    } else {
      renderSectionTitle(doc, "Recent User Account Registrations Audit", recentUsers.length);
      const userRows = recentUsers.map((u) => [
        u.name || "N/A",
        u.email || "N/A",
        u.userType || u.role || "Alumni",
        u.department || u.college || "General",
        formatShortDate(u.createdAt),
        u.status || "APPROVED",
      ]);
      renderTable(doc, {
        headers: ["Name", "Email", "Role / Type", "Department / College", "Registered", "Status"],
        columnWidths: [105, 135, 75, 95, 55, 50],
        rows: userRows,
        emptyMessage: "No user account registrations found in the system.",
      });
    }

    // 4. Event Registrations Section
    const activeEventList = todayEventRegs.length > 0 ? todayEventRegs : recentEventRegs;
    const eventSectionTitle = todayEventRegs.length > 0
      ? "Event Participant Enrollments Today"
      : "Recent Event Participant Registrations";

    renderSectionTitle(doc, eventSectionTitle, activeEventList.length);
    const eventRows = activeEventList.map((r) => [
      r.name || "Participant",
      r.email || "N/A",
      r.eventId?.title || "Workshop",
      formatShortDate(r.createdAt || r.registeredAt),
      r.status || "REGISTERED",
    ]);

    renderTable(doc, {
      headers: ["Participant", "Email", "Event Title", "Date", "Status"],
      columnWidths: [105, 135, 150, 60, 65],
      rows: eventRows,
      emptyMessage: "No event registrations found for this audit window.",
    });

    // 5. Finalize document & stream
    finalizeReport(doc);

    // Audit log
    if (req.user) {
      logAdminAction({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: "REPORT_DOWNLOADED",
        resource: "REPORTS",
        details: "Downloaded Daily Registrations Audit PDF",
        ipAddress: req.ip || req.connection?.remoteAddress,
      }).catch((err) => console.error("Audit log error:", err));
    }
  } catch (error) {
    console.error("Generate Daily Registrations PDF Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Unable to generate Daily Registrations Audit PDF" });
    }
  }
};

// @desc    Generate & Download Pending Approvals Summary PDF
// @route   GET /api/admin/reports/pending-approvals/pdf
// @access  Private/Admin
const generatePendingApprovalsPdf = async (req, res) => {
  try {
    // Parallel fetch of pending records across users, events, and event registrations
    const [pendingUsers, pendingEvents, pendingEventRegs] = await Promise.all([
      User.find({ status: "PENDING", isDeleted: { $ne: true } }).sort({ createdAt: -1 }),
      Event.find({ status: { $in: ["PENDING", "PENDING_ADMIN_APPROVAL"] } }).sort({ createdAt: -1 }),
      EventRegistration.find({ status: "PENDING" }).populate("eventId", "title").sort({ createdAt: -1 }),
    ]);

    const pendingStudents = pendingUsers.filter((u) => u.role === "student").length;
    const pendingAlumni = pendingUsers.filter((u) => u.role === "alumni" || u.role === "user").length;
    const totalPending = pendingUsers.length + pendingEvents.length + pendingEventRegs.length;

    const filename = "pending-approvals-summary.pdf";
    const doc = createReportDocument(res, filename);

    // 1. Header
    renderReportHeader(doc, {
      title: "Pending Approvals Summary",
      subtitle: "Summary of accounts, event submissions, and session applications requiring moderation.",
      generatedAt: new Date(),
    });

    // 2. Summary KPI Metrics
    renderSummaryCards(doc, [
      { label: "Total Pending", value: totalPending, subtext: "Awaiting administrator review" },
      { label: "Pending Students", value: pendingStudents, subtext: "Student account requests" },
      { label: "Pending Alumni", value: pendingAlumni, subtext: "Alumni verification requests" },
      { label: "Pending Events", value: pendingEvents.length, subtext: "Proposals awaiting publishing" },
    ]);

    // 3. Pending User Accounts Table
    renderSectionTitle(doc, "Pending User Account Verifications", pendingUsers.length);
    const userRows = pendingUsers.map((u) => [
      u.name || "N/A",
      u.email || "N/A",
      u.userType || u.role || "Alumni",
      u.department || u.college || "GradConnect Central",
      formatShortDate(u.createdAt),
      u.status || "PENDING",
    ]);

    renderTable(doc, {
      headers: ["Name", "Email", "Role / Type", "Department / College", "Submitted", "Status"],
      columnWidths: [105, 135, 75, 95, 55, 50],
      rows: userRows,
      emptyMessage: "No user accounts currently awaiting administrator approval.",
    });

    // 4. Pending Event Proposals Table
    renderSectionTitle(doc, "Pending Alumni Event Proposals", pendingEvents.length);
    const eventRows = pendingEvents.map((e) => [
      e.title || "Untitled Session",
      e.organizer || "Alumni Host",
      e.mode || "Online",
      formatShortDate(e.date),
      formatShortDate(e.createdAt),
      e.status || "PENDING",
    ]);

    renderTable(doc, {
      headers: ["Event Title", "Organizer", "Mode", "Event Date", "Submitted", "Status"],
      columnWidths: [140, 95, 60, 80, 70, 70],
      rows: eventRows,
      emptyMessage: "No event submissions currently awaiting admin moderation.",
    });

    // 5. Pending Event Participant Applications Table
    renderSectionTitle(doc, "Pending Attendee Applications", pendingEventRegs.length);
    const regRows = pendingEventRegs.map((r) => [
      r.name || "Participant",
      r.email || "N/A",
      r.eventId?.title || "Workshop Session",
      formatShortDate(r.createdAt || r.registeredAt),
      r.status || "PENDING",
    ]);

    renderTable(doc, {
      headers: ["Applicant", "Email", "Event Title", "Applied Date", "Status"],
      columnWidths: [105, 135, 150, 60, 65],
      rows: regRows,
      emptyMessage: "No event participant applications awaiting approval.",
    });

    // 6. Finalize document & stream
    finalizeReport(doc);

    // Audit log
    if (req.user) {
      logAdminAction({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: "REPORT_DOWNLOADED",
        resource: "REPORTS",
        details: "Downloaded Pending Approvals Summary PDF",
        ipAddress: req.ip || req.connection?.remoteAddress,
      }).catch((err) => console.error("Audit log error:", err));
    }
  } catch (error) {
    console.error("Generate Pending Approvals PDF Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Unable to generate Pending Approvals Summary PDF" });
    }
  }
};

// @desc    Generate & Download Overall Membership Report PDF
// @route   GET /api/admin/reports/membership/pdf
// @access  Private/Admin
const generateMembershipPdf = async (req, res) => {
  try {
    const allUsers = await User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    const totalUsers = allUsers.length;
    const studentsCount = allUsers.filter((u) => u.role === "student").length;
    const alumniCount = allUsers.filter((u) => u.role === "alumni" || u.role === "user").length;
    const approvedCount = allUsers.filter((u) => u.status === "APPROVED").length;
    const pendingCount = allUsers.filter((u) => u.status === "PENDING").length;
    const mentorsCount = allUsers.filter((u) => u.willingToMentor).length;

    const filename = "overall-membership-report.pdf";
    const doc = createReportDocument(res, filename);

    // 1. Header
    renderReportHeader(doc, {
      title: "Overall Membership Report",
      subtitle: "Platform demographic census, role breakdown, and membership verification directory.",
      generatedAt: new Date(),
    });

    // 2. Summary KPI Metrics
    renderSummaryCards(doc, [
      { label: "Total Members", value: totalUsers, subtext: `${approvedCount} Approved • ${pendingCount} Pending` },
      { label: "Alumni Network", value: alumniCount, subtext: `${mentorsCount} Registered Mentors` },
      { label: "Student Body", value: studentsCount, subtext: "Undergraduate & Postgraduates" },
      { label: "Active Rate", value: `${totalUsers > 0 ? Math.round((approvedCount / totalUsers) * 100) : 0}%`, subtext: "Verified user credentials" },
    ]);

    // 3. Complete Member Directory Table
    renderSectionTitle(doc, "Platform Membership Directory", allUsers.length);
    const memberRows = allUsers.map((u) => [
      u.name || "N/A",
      u.email || "N/A",
      u.userType || u.role || "Member",
      u.department || u.college || "GradConnect Central",
      formatShortDate(u.createdAt),
      u.status || "APPROVED",
    ]);

    renderTable(doc, {
      headers: ["Member Name", "Email", "Role / Type", "Department / College", "Joined", "Status"],
      columnWidths: [105, 135, 75, 95, 55, 50],
      rows: memberRows,
      emptyMessage: "No registered members found in the platform database.",
    });

    // 4. Finalize document & stream
    finalizeReport(doc);

    // Audit log
    if (req.user) {
      logAdminAction({
        adminId: req.user._id,
        adminName: req.user.name,
        adminEmail: req.user.email,
        action: "REPORT_DOWNLOADED",
        resource: "REPORTS",
        details: "Downloaded Overall Membership Report PDF",
        ipAddress: req.ip || req.connection?.remoteAddress,
      }).catch((err) => console.error("Audit log error:", err));
    }
  } catch (error) {
    console.error("Generate Membership PDF Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Unable to generate Overall Membership Report PDF" });
    }
  }
};

// @desc    Universal parametric report downloader
// @route   GET /api/admin/reports/:reportType/pdf
// @access  Private/Admin
const generateReportPdf = async (req, res) => {
  const { reportType } = req.params;
  if (reportType === "daily-registrations" || reportType === "daily-registrations-audit") {
    return generateDailyRegistrationsPdf(req, res);
  }
  if (reportType === "pending-approvals" || reportType === "pending-approvals-summary") {
    return generatePendingApprovalsPdf(req, res);
  }
  if (reportType === "membership" || reportType === "overall-membership" || reportType === "overall-membership-report") {
    return generateMembershipPdf(req, res);
  }
  return res.status(404).json({ success: false, message: `Report type '${reportType}' not found` });
};

module.exports = {
  updateAttendeeStatus,
  getAdminEventAttendees,
  cancelEventByAdmin,
  rejectEventSubmission,
  approveEventSubmission,
  toggleEventPublish,
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
};
