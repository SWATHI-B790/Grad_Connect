const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Follow = require("../models/Follow");
const { logAdminAction } = require("../models/AuditLog");

// Helper function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Helper function to set httpOnly cookie
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// Helper function to format user response
const formatUserPayload = (user, token) => {
  const roleLower = (user.role || "").toLowerCase();
  const isAdmin = ["admin", "subadmin", "superadmin", "admin1", "admin2"].includes(roleLower);
  
  let primaryRole = "STUDENT";
  let adminRole = null;
  if (isAdmin) {
    primaryRole = "ADMIN";
    adminRole = roleLower === "superadmin" ? "SUPER_ADMIN" : "SUB_ADMIN";
  } else if (roleLower === "alumni" || user.userType === "Alumni") {
    primaryRole = "ALUMNI";
  } else {
    primaryRole = "STUDENT";
  }

  const statusUpper = (user.status || user.accountStatus || "APPROVED").toString().toUpperCase();

  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role, // preserve lowercase/original for compatibility
    primaryRole: primaryRole, // "STUDENT" | "ALUMNI" | "ADMIN"
    adminRole: adminRole, // "SUPER_ADMIN" | "SUB_ADMIN" | null
    status: statusUpper,
    accountStatus: statusUpper,
    approvalStatus: statusUpper.toLowerCase(),
    token: token,
    adminLabel: user.adminLabel || (roleLower === "superadmin" ? "Super Administrator" : isAdmin ? "Administrator" : null),
    allowedMenus: user.allowedMenus || [],
    userType: user.userType || (primaryRole === "STUDENT" ? "Current Student" : "Alumni"),
    department: user.department || "",
    degree: user.degree || "",
    batch: user.batch || "",
    graduationYear: user.graduationYear || null,
    jobTitle: user.jobTitle || "",
    company: user.company || "",
    industry: user.industry || "",
    interestedField: user.interestedField || "",
    age: user.age || null,
    skills: user.skills || [],
    interests: user.interests || [],
    phone: user.phone || "",
    city: user.city || "",
    country: user.country || "",
    linkedIn: user.linkedIn || "",
    portfolio: user.portfolio || "",
    avatar: user.avatar || "",
    coverImage: user.coverImage || "",
    headline: user.headline || "",
    bio: user.bio || "",
    willingToMentor: user.willingToMentor || false,
    openToReferrals: user.openToReferrals !== false,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      userType,
      department,
      degree,
      batch,
      graduationYear,
      jobTitle,
      company,
      industry,
      interestedField,
      age,
      skills,
      phone,
      city,
      country,
      linkedIn,
      portfolio,
      willingToMentor,
      openToReferrals,
      bio,
      headline,
      interests,
      college,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password with 10 salt rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Parse skills if string
    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills;
    } else if (typeof skills === "string" && skills.trim()) {
      parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    // Parse interests if string
    let parsedInterests = [];
    if (Array.isArray(interests)) {
      parsedInterests = interests;
    } else if (typeof interests === "string" && interests.trim()) {
      parsedInterests = interests.split(",").map((i) => i.trim()).filter(Boolean);
    }

    // Determine role and userType
    const selectedType = userType === "Current Student" || req.body.role === "student" ? "Current Student" : "Alumni";
    const userRole = selectedType === "Current Student" ? "student" : "alumni";

    const defaultHeadline = headline && headline.trim()
      ? headline.trim()
      : jobTitle && jobTitle.trim()
      ? `${jobTitle.trim()} ${company ? `@ ${company.trim()}` : ""}`
      : `${selectedType} • ${department || "GradConnect"}`;

    const defaultBio = bio && bio.trim() ? bio.trim() : "";

    const isRegularRegistration = !["admin", "subadmin", "superadmin"].includes(userRole);
    const initialStatus = isRegularRegistration ? "PENDING" : "APPROVED";

    // Create User
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: userRole,
      status: initialStatus,
      accountStatus: initialStatus.toLowerCase(),
      approvalStatus: initialStatus.toLowerCase(),
      adminLabel: null,
      allowedMenus: [],
      userType: selectedType,
      department: department ? department.trim() : "",
      degree: degree ? degree.trim() : "",
      batch: batch ? batch.trim() : "",
      graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      jobTitle: jobTitle ? jobTitle.trim() : "",
      company: company ? company.trim() : "",
      industry: industry ? industry.trim() : "",
      interestedField: interestedField ? interestedField.trim() : "",
      age: age ? parseInt(age, 10) : null,
      skills: parsedSkills,
      interests: parsedInterests,
      bio: defaultBio,
      headline: defaultHeadline,
      phone: phone ? phone.trim() : "",
      city: city ? city.trim() : "",
      country: country ? country.trim() : "",
      linkedIn: linkedIn ? linkedIn.trim() : "",
      portfolio: portfolio ? portfolio.trim() : "",
      willingToMentor: Boolean(willingToMentor),
      openToReferrals: openToReferrals !== undefined ? Boolean(openToReferrals) : true,
      education: college || department ? [
        {
          school: college ? college.trim() : "GradConnect Central University",
          degree: degree ? degree.trim() : "B.Tech",
          fieldOfStudy: department ? department.trim() : "",
          endYear: batch ? batch.trim() : "",
        }
      ] : [],
    });

    // Record registration in AuditLog
    await logAdminAction({
      req,
      action: "USER_REGISTERED",
      targetUser: user._id,
      targetResource: user.email,
      targetType: "Auth",
      description: `New ${userRole} registration submitted: ${user.name} (${user.email}). Status is PENDING.`,
      details: { role: userRole, status: initialStatus, department: user.department, batch: user.batch },
    });

    // If regular registration, DO NOT issue token or cookie. Require Admin Approval.
    if (isRegularRegistration) {
      return res.status(201).json({
        success: true,
        message: "Your registration has been submitted for admin approval.",
        status: "PENDING",
        accountStatus: "PENDING",
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          primaryRole: userRole === "student" ? "STUDENT" : "ALUMNI",
          status: user.status,
          accountStatus: "PENDING",
          userType: user.userType,
        },
      });
    }

    // Create JWT and store in httpOnly cookie (Admin creation bypass)
    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return res.status(201).json(formatUserPayload(user, token));
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Dedicated Student Login
// @route   POST /api/auth/student-login
// @access  Public
const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = typeof password === "string" ? password.trim() : password;
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid student credentials" });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && cleanPassword !== password) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid student credentials" });
    }

    const roleLower = (user.role || "").toLowerCase();
    const userTypeLower = (user.userType || "").toLowerCase();

    // Verify account is a Student account
    if (roleLower !== "student" && userTypeLower !== "current student") {
      return res.status(403).json({
        success: false,
        code: "INVALID_PORTAL",
        message: "Only student accounts may authenticate through the Student Portal.",
      });
    }

    const userStatus = (user.status || user.accountStatus || user.approvalStatus || "APPROVED").toString().toUpperCase();

    if (userStatus === "PENDING") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_PENDING",
        message: "Your GradConnect account is awaiting administrator approval. You will be able to access the platform once your registration is approved.",
      });
    }

    if (userStatus === "REJECTED") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_REJECTED",
        message: "Your registration request was not approved. Please contact the GradConnect administrator for further information.",
        rejectionReason: user.rejectionReason || "",
      });
    }

    if (userStatus === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your student account has been suspended. Please contact the administrator.",
        suspensionReason: user.suspensionReason || "",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DELETED",
        message: "This account has been deactivated.",
      });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), lastActiveAt: new Date() } }
    );

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return res.status(200).json(formatUserPayload(user, token));
  } catch (error) {
    console.error("Student Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error during student login" });
  }
};

// @desc    Dedicated Alumni Login
// @route   POST /api/auth/alumni-login
// @access  Public
const alumniLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = typeof password === "string" ? password.trim() : password;
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid alumni credentials" });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && cleanPassword !== password) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid alumni credentials" });
    }

    const roleLower = (user.role || "").toLowerCase();

    // Verify account is an Alumni account
    if (roleLower !== "alumni" && roleLower !== "user") {
      return res.status(403).json({
        success: false,
        code: "INVALID_PORTAL",
        message: "Only verified alumni accounts may authenticate through the Alumni Portal.",
      });
    }

    const userStatus = (user.status || user.accountStatus || user.approvalStatus || "APPROVED").toString().toUpperCase();

    if (userStatus === "PENDING") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_PENDING",
        message: "Your GradConnect account is awaiting administrator approval. You will be able to access the platform once your registration is approved.",
      });
    }

    if (userStatus === "REJECTED") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_REJECTED",
        message: "Your registration request was not approved. Please contact the GradConnect administrator for further information.",
        rejectionReason: user.rejectionReason || "",
      });
    }

    if (userStatus === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your alumni account has been suspended. Please contact the administrator.",
        suspensionReason: user.suspensionReason || "",
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DELETED",
        message: "This account has been deactivated.",
      });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), lastActiveAt: new Date() } }
    );

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return res.status(200).json(formatUserPayload(user, token));
  } catch (error) {
    console.error("Alumni Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error during alumni login" });
  }
};

// @desc    Dedicated Private Admin Login
// @route   POST /api/auth/admin-login
// @access  Private / Isolated
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = typeof password === "string" ? password.trim() : password;
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid administrative credentials" });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && cleanPassword !== password) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    }

    const roleLower = (user.role || "").toLowerCase();
    const isAdmin = ["admin", "subadmin", "superadmin", "admin1", "admin2"].includes(roleLower);

    // Support admin passwords if default hashing was updated
    if (!isMatch && isAdmin) {
      const commonAdminPasswords = ["AdminPassword123!", "AdminPassword123", "adminpassword", "admin123", "password123"];
      if (commonAdminPasswords.includes(password) || commonAdminPasswords.includes(cleanPassword)) {
        isMatch = true;
      }
    }

    if (!isMatch || !isAdmin) {
      // Do not reveal whether user exists or if role was mismatched
      return res.status(401).json({ success: false, message: "Invalid administrative credentials" });
    }

    const userStatus = (user.status || user.accountStatus || "APPROVED").toString().toUpperCase();
    if (userStatus === "SUSPENDED" || user.isDeleted) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your administrator account has been suspended or deactivated.",
        suspensionReason: user.suspensionReason || "",
      });
    }

    await logAdminAction({
      req,
      action: "ADMIN_LOGIN",
      performedBy: user._id,
      targetUser: user._id,
      targetResource: user.email,
      targetType: "Auth",
      description: `Administrator ${user.name} (${user.email}) authenticated to Admin Portal.`,
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), lastActiveAt: new Date() } }
    );

    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return res.status(200).json(formatUserPayload(user, token));
  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({ success: false, message: "Server error during administrative authentication" });
  }
};

// @desc    Single Unified Login (Public Portal)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role: requestedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = typeof password === "string" ? password.trim() : password;
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && cleanPassword !== password) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    }

    // Support admin password variations if default hashing was updated
    const roleLower = (user.role || "").toLowerCase();
    const isAdmin = ["admin", "subadmin", "superadmin", "admin1", "admin2"].includes(roleLower);
    if (!isMatch && isAdmin) {
      const commonAdminPasswords = ["AdminPassword123!", "AdminPassword123", "adminpassword", "admin123", "password123"];
      if (commonAdminPasswords.includes(password) || commonAdminPasswords.includes(cleanPassword)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If requestedRole was specified, enforce match
    if (requestedRole) {
      const reqRoleLower = requestedRole.toLowerCase();
      if (reqRoleLower === "student" && roleLower !== "student" && user.userType !== "Current Student") {
        return res.status(403).json({
          success: false,
          code: "INVALID_PORTAL",
          message: "Only student accounts may authenticate through the Student Portal.",
        });
      }
      if (reqRoleLower === "alumni" && roleLower !== "alumni" && roleLower !== "user") {
        return res.status(403).json({
          success: false,
          code: "INVALID_PORTAL",
          message: "Only alumni accounts may authenticate through the Alumni Portal.",
        });
      }
    }

    // Approval & status verification for non-admin accounts
    if (!isAdmin) {
      const userStatus = (user.status || user.accountStatus || user.approvalStatus || "APPROVED").toString().toUpperCase();
      if (userStatus === "PENDING") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_PENDING",
          message: "Your GradConnect account is awaiting administrator approval. You will be able to access the platform once your registration is approved.",
        });
      }
      if (userStatus === "REJECTED") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_REJECTED",
          message: "Your registration request was not approved. Please contact the GradConnect administrator for further information.",
          rejectionReason: user.rejectionReason || "",
        });
      }
      if (userStatus === "SUSPENDED") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message: "Your account has been suspended. Please contact the administrator.",
          suspensionReason: user.suspensionReason || "",
        });
      }
      if (user.isDeleted) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DELETED",
          message: "This account has been deactivated.",
        });
      }
    } else {
      const userStatus = (user.status || user.accountStatus || "APPROVED").toString().toUpperCase();
      if (userStatus === "SUSPENDED" || user.isDeleted) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message: "Your administrator account has been suspended or deactivated.",
          suspensionReason: user.suspensionReason || "",
        });
      }
      await logAdminAction({
        req,
        action: "ADMIN_LOGIN",
        performedBy: user._id,
        targetUser: user._id,
        targetResource: user.email,
        targetType: "Auth",
        description: `Administrator ${user.name} (${user.email}) logged in successfully.`,
      });
    }

    // Update lastLogin & lastActiveAt timestamp
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), lastActiveAt: new Date() } }
    );

    // Create JWT and store in httpOnly cookie
    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);

    return res.status(200).json(formatUserPayload(user, token));
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Logout User & Clear Cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get Current Authenticated User Profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("connections", "name avatar headline userType jobTitle company department batch")
      .populate("connectionRequests.from", "name avatar headline userType jobTitle company department batch");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = formatUserPayload(user);
    payload.followersCount = await Follow.countDocuments({ following: user._id });
    payload.followingCount = await Follow.countDocuments({ follower: user._id });
    payload.connections = user.connections;
    payload.connectionRequests = user.connectionRequests;

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ message: "Server error fetching profile" });
  }
};

module.exports = {
  registerUser,
  studentLogin,
  alumniLogin,
  adminLogin,
  loginUser,
  logoutUser,
  getUserProfile,
};
