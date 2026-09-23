const Domain = require("../models/Domain");
const Blog = require("../models/Blog");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { logAdminAction } = require("../models/AuditLog");

// Helper to generate a clean URL slug
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ==========================================
// 1. PUBLIC DOMAIN ENDPOINTS
// ==========================================

// @desc    Get published domains with search, category filtering & pagination
// @route   GET /api/domains
// @access  Public
const getPublicDomains = async (req, res) => {
  try {
    const { search = "", category = "All", page = 1, limit = 12, sort = "featured" } = req.query;

    const query = {
      status: "PUBLISHED",
      visibility: "public",
    };

    if (category && category !== "All" && category !== "All Categories") {
      query.category = category;
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: sRegex },
        { shortDescription: sRegex },
        { skills: sRegex },
        { technologies: sRegex },
        { careerRoles: sRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { name: 1 };
    if (sort === "popular" || sort === "views") {
      sortOption = { views: -1 };
    } else if (sort === "newest") {
      sortOption = { publishedAt: -1, createdAt: -1 };
    }

    const [total, domains] = await Promise.all([
      Domain.countDocuments(query),
      Domain.find(query)
        .populate("createdBy", "name avatar role")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      domains,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Public Domains Error:", error);
    return res.status(500).json({ success: false, message: "Server error retrieving engineering domains" });
  }
};

// @desc    Get single domain by slug (or ID) with related articles & alumni stories
// @route   GET /api/domains/:slug
// @access  Public
const getPublicDomainBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    let domain = await Domain.findOne({
      $or: [{ slug: slug.toLowerCase().trim() }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }],
    })
      .populate("createdBy", "name email avatar role headline company")
      .populate("publishedBy", "name email");

    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    // Increment views asynchronously
    Domain.findByIdAndUpdate(domain._id, { $inc: { views: 1 } }).exec();

    // Query related technical articles and community stories from Blog
    const domainNameRegex = new RegExp(domain.name, "i");
    const [relatedArticles, communityStories] = await Promise.all([
      Blog.find({
        status: "published",
        $or: [{ domain: domainNameRegex }, { tags: domainNameRegex }],
      })
        .select("title slug shortDescription category bannerImage author createdAt views readTime tags")
        .populate("author", "name avatar headline role")
        .sort({ createdAt: -1 })
        .limit(6),
      Blog.find({
        status: "published",
        category: { $in: ["Career Journey", "Alumni Achievement", "Interview Preparation", "Project Experience"] },
        $or: [{ domain: domainNameRegex }, { tags: domainNameRegex }],
      })
        .populate("author", "name avatar headline company jobTitle role")
        .sort({ createdAt: -1 })
        .limit(4),
    ]);

    return res.status(200).json({
      success: true,
      domain,
      relatedArticles,
      communityStories,
    });
  } catch (error) {
    console.error("Get Public Domain By Slug Error:", error);
    return res.status(500).json({ success: false, message: "Server error retrieving domain details" });
  }
};

// @desc    Get category summary counts for filtering
// @route   GET /api/domains/categories/summary
// @access  Public
const getDomainCategoriesSummary = async (req, res) => {
  try {
    const standardCategories = [
      "Development",
      "AI & Data",
      "Cloud & DevOps",
      "Cybersecurity",
      "Design",
      "Mobile",
      "Emerging Technology",
      "Software Engineering",
    ];

    const counts = await Domain.aggregate([
      { $match: { status: "PUBLISHED", visibility: "public" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      if (c._id) {
        countMap[c._id] = c.count;
      }
    });

    // Merge standard categories and any extra categories present in published domains
    const allCategoryNames = Array.from(
      new Set([...standardCategories, ...Object.keys(countMap)])
    ).filter(Boolean);

    const categoriesWithCount = allCategoryNames
      .map((name) => ({
        id: name,
        label: name,
        value: name,
        name,
        category: name,
        count: countMap[name] || 0,
      }))
      .filter((cat) => cat.count > 0);

    const totalPublished = await Domain.countDocuments({ status: "PUBLISHED", visibility: "public" });

    return res.status(200).json({
      success: true,
      totalDomains: totalPublished,
      categories: categoriesWithCount,
    });
  } catch (error) {
    console.error("Get Domain Categories Summary Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching category summary" });
  }
};

// ==========================================
// 2. ALUMNI CONTRIBUTION WORKFLOW
// ==========================================

// @desc    Alumni submits a new domain contribution
// @route   POST /api/domains/suggest
// @access  Private (Alumni or Admin)
const suggestDomainByAlumni = async (req, res) => {
  try {
    const {
      name,
      shortDescription,
      description,
      category = "Development",
      skills = [],
      technologies = [],
      careerRoles = [],
      tools = [],
      learningPath,
      industry,
      difficultyLevel,
      salaryRange,
      marketDemand,
      futureScope,
      icon,
      coverImage,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Domain name is required" });
    }
    if (!shortDescription || !shortDescription.trim()) {
      return res.status(400).json({ success: false, message: "Short description is required" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: "Detailed description is required" });
    }

    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    const existing = await Domain.findOne({ slug });
    if (existing) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const isAlumni = req.user.role === "alumni" || req.user.userType === "Alumni";
    // Alumni can share technical domains without requiring Admin approval
    const initialStatus = "PUBLISHED";
    const creatorRole = isAlumni ? "alumni" : req.user.role;

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const parsedTechnologies = Array.isArray(technologies)
      ? technologies
      : typeof technologies === "string"
      ? technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const parsedCareerRoles = Array.isArray(careerRoles)
      ? careerRoles
      : typeof careerRoles === "string"
      ? careerRoles.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

    const parsedTools = Array.isArray(tools)
      ? tools
      : typeof tools === "string"
      ? tools.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newDomain = await Domain.create({
      name: name.trim(),
      slug,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      category,
      icon: icon || "Layers",
      coverImage: coverImage || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
      skills: parsedSkills,
      technologies: parsedTechnologies,
      careerRoles: parsedCareerRoles,
      tools: parsedTools,
      learningPath: learningPath || undefined,
      industry: industry ? industry.trim() : "Information Technology",
      difficultyLevel: difficultyLevel || "Intermediate",
      salaryRange: salaryRange || "₹6 - ₹24 LPA / $70k - $140k",
      marketDemand: marketDemand || "High",
      futureScope: futureScope ? futureScope.trim() : "",
      createdBy: req.user._id,
      createdByRole: creatorRole,
      status: initialStatus,
      visibility: initialStatus === "PUBLISHED" ? "public" : "private",
      publishedAt: initialStatus === "PUBLISHED" ? new Date() : null,
      publishedBy: initialStatus === "PUBLISHED" ? req.user._id : null,
    });

    await logAdminAction({
      req,
      action: "DOMAIN_SUBMITTED",
      targetResource: newDomain.name,
      targetType: "Domain",
      description: `Alumni ${req.user.name} (${req.user.email}) submitted domain proposal: "${newDomain.name}". Status: ${newDomain.status}.`,
      details: { domainId: newDomain._id, status: newDomain.status, category: newDomain.category },
    });

    return res.status(201).json({
      success: true,
      message: isAlumni
        ? "Domain contribution published successfully! It is now live in the engineering directory."
        : "Domain created and published successfully.",
      domain: newDomain,
    });
  } catch (error) {
    console.error("Suggest Domain Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "A domain with this name already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error submitting domain proposal" });
  }
};

// @desc    Get logged in alumni's submitted domain contributions
// @route   GET /api/domains/my/submissions
// @access  Private (Alumni)
const getAlumniSubmissions = async (req, res) => {
  try {
    const submissions = await Domain.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error("Get Alumni Submissions Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching your domain submissions" });
  }
};

// @desc    Update pending submission before admin review
// @route   PUT /api/domains/my/submissions/:id
// @access  Private (Alumni owner)
const updateAlumniSubmission = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain submission not found" });
    }

    const isOwner = domain.createdBy.toString() === req.user._id.toString();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You are not authorized to edit this submission" });
    }

    if (domain.status !== "PENDING" && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Only pending submissions can be edited. Contact an administrator to update published content.",
      });
    }

    const { name, shortDescription, description, category, skills, technologies, careerRoles, tools } = req.body;

    if (name && name.trim()) domain.name = name.trim();
    if (shortDescription && shortDescription.trim()) domain.shortDescription = shortDescription.trim();
    if (description && description.trim()) domain.description = description.trim();
    if (category) domain.category = category;
    if (skills) domain.skills = Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (technologies) domain.technologies = Array.isArray(technologies) ? technologies : technologies.split(",").map((t) => t.trim()).filter(Boolean);
    if (careerRoles) domain.careerRoles = Array.isArray(careerRoles) ? careerRoles : careerRoles.split(",").map((r) => r.trim()).filter(Boolean);
    if (tools) domain.tools = Array.isArray(tools) ? tools : tools.split(",").map((t) => t.trim()).filter(Boolean);

    domain.updatedBy = req.user._id;
    await domain.save();

    return res.status(200).json({
      success: true,
      message: "Domain submission updated successfully",
      domain,
    });
  } catch (error) {
    console.error("Update Alumni Submission Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating domain submission" });
  }
};

// ==========================================
// 3. ADMIN DOMAIN MANAGEMENT ENDPOINTS
// ==========================================

// @desc    Get all domains with comprehensive filtering, stats & pagination (Admin)
// @route   GET /api/admin/domains
// @access  Private/Admin
const getAdminDomains = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all", source = "all", category = "all" } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (source && source !== "all") {
      if (source === "alumni") query.createdByRole = "alumni";
      else if (source === "admin") query.createdByRole = { $in: ["admin", "superadmin", "subadmin"] };
    }

    if (category && category !== "all" && category !== "All") {
      query.category = category;
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: sRegex }, { shortDescription: sRegex }, { category: sRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [
      total,
      domains,
      totalDomains,
      publishedDomains,
      pendingDomains,
      draftDomains,
      alumniSubmittedDomains,
    ] = await Promise.all([
      Domain.countDocuments(query),
      Domain.find(query)
        .populate("createdBy", "name email role userType avatar")
        .populate("updatedBy", "name email")
        .populate("publishedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Domain.countDocuments(),
      Domain.countDocuments({ status: "PUBLISHED" }),
      Domain.countDocuments({ status: "PENDING" }),
      Domain.countDocuments({ status: "UNPUBLISHED" }),
      Domain.countDocuments({ createdByRole: "alumni" }),
    ]);

    return res.status(200).json({
      success: true,
      domains,
      stats: {
        totalDomains,
        publishedDomains,
        pendingDomains,
        draftDomains,
        alumniSubmittedDomains,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Admin Domains Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching admin domains" });
  }
};

// @desc    Admin creates new domain directly
// @route   POST /api/admin/domains
// @access  Private/Admin
const createDomainByAdmin = async (req, res) => {
  try {
    const {
      name,
      shortDescription,
      description,
      category = "Development",
      icon,
      coverImage,
      bannerImage,
      skills,
      technologies,
      careerRoles,
      tools,
      learningPath,
      industry,
      difficultyLevel,
      salaryRange,
      marketDemand,
      futureScope,
      relatedProjects,
      status = "PUBLISHED",
      visibility = "public",
    } = req.body;

    const actualName = (name || req.body.title || "").trim();
    const actualShortDesc = (shortDescription || req.body.description || (actualName ? `Comprehensive engineering guide for ${actualName}` : "")).trim();
    const actualDesc = (description || req.body.content || actualShortDesc).trim();

    if (!actualName) {
      return res.status(400).json({ success: false, message: "Domain name is required" });
    }

    let baseSlug = generateSlug(actualName);
    let slug = baseSlug;
    const existing = await Domain.findOne({ slug });
    if (existing) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const parsedTechnologies = Array.isArray(technologies)
      ? technologies
      : typeof technologies === "string"
      ? technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const parsedCareerRoles = Array.isArray(careerRoles)
      ? careerRoles
      : typeof careerRoles === "string"
      ? careerRoles.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

    const parsedTools = Array.isArray(tools)
      ? tools
      : typeof tools === "string"
      ? tools.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newDomain = await Domain.create({
      name: actualName,
      slug,
      shortDescription: actualShortDesc,
      description: actualDesc,
      category,
      icon: icon || "Layers",
      coverImage: coverImage || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80",
      bannerImage: bannerImage || "",
      skills: parsedSkills,
      technologies: parsedTechnologies,
      careerRoles: parsedCareerRoles,
      tools: parsedTools,
      learningPath: learningPath || undefined,
      industry: industry ? industry.trim() : "Information Technology",
      difficultyLevel: difficultyLevel || "Intermediate",
      salaryRange: salaryRange || "₹6 - ₹24 LPA / $70k - $140k",
      marketDemand: marketDemand || "High",
      futureScope: futureScope ? futureScope.trim() : "",
      relatedProjects: Array.isArray(relatedProjects) ? relatedProjects : [],
      createdBy: req.user._id,
      createdByRole: req.user.role,
      status: status || "PUBLISHED",
      visibility: visibility || "public",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      publishedBy: status === "PUBLISHED" ? req.user._id : null,
    });

    await logAdminAction({
      req,
      action: "DOMAIN_CREATED",
      targetResource: newDomain.name,
      targetType: "Domain",
      description: `Admin ${req.user.name} created domain: "${newDomain.name}" in category [${newDomain.category}]. Status: ${newDomain.status}.`,
      details: { domainId: newDomain._id, status: newDomain.status, slug: newDomain.slug },
    });

    return res.status(201).json({
      success: true,
      message: "Domain created successfully",
      domain: newDomain,
      article: newDomain, // alias for backwards compatibility
    });
  } catch (error) {
    console.error("Create Domain By Admin Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "A domain with this name already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error creating domain" });
  }
};

// @desc    Get single domain by ID for admin editing/review
// @route   GET /api/admin/domains/:id
// @access  Private/Admin
const getDomainByIdAdmin = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id)
      .populate("createdBy", "name email role userType avatar")
      .populate("updatedBy", "name email")
      .populate("publishedBy", "name email");

    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    return res.status(200).json({ success: true, domain });
  } catch (error) {
    console.error("Get Domain By ID Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error retrieving domain" });
  }
};

// @desc    Admin updates any domain (both admin and alumni created)
// @route   PUT /api/admin/domains/:id
// @access  Private/Admin
const updateDomainByAdmin = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    const {
      name,
      shortDescription,
      description,
      category,
      icon,
      coverImage,
      bannerImage,
      skills,
      technologies,
      careerRoles,
      tools,
      learningPath,
      industry,
      difficultyLevel,
      salaryRange,
      marketDemand,
      futureScope,
      relatedProjects,
      status,
      visibility,
    } = req.body;

    const previousStatus = domain.status;

    if (name && name.trim() && name.trim() !== domain.name) {
      domain.name = name.trim();
      let newSlug = generateSlug(domain.name);
      const slugExists = await Domain.findOne({ slug: newSlug, _id: { $ne: domain._id } });
      if (slugExists) {
        newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
      }
      domain.slug = newSlug;
    }

    if (shortDescription !== undefined) domain.shortDescription = shortDescription.trim();
    else if (req.body.description && !description) domain.shortDescription = req.body.description.trim();

    if (description !== undefined) domain.description = description.trim();
    if (category) domain.category = category;
    if (icon) domain.icon = icon;
    if (coverImage) domain.coverImage = coverImage;
    if (bannerImage !== undefined) domain.bannerImage = bannerImage;

    if (skills !== undefined) {
      domain.skills = Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (technologies !== undefined) {
      domain.technologies = Array.isArray(technologies)
        ? technologies
        : typeof technologies === "string"
        ? technologies.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    if (careerRoles !== undefined) {
      domain.careerRoles = Array.isArray(careerRoles)
        ? careerRoles
        : typeof careerRoles === "string"
        ? careerRoles.split(",").map((r) => r.trim()).filter(Boolean)
        : [];
    }

    if (tools !== undefined) {
      domain.tools = Array.isArray(tools)
        ? tools
        : typeof tools === "string"
        ? tools.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    if (learningPath) domain.learningPath = learningPath;
    if (industry) domain.industry = industry.trim();
    if (difficultyLevel) domain.difficultyLevel = difficultyLevel;
    if (salaryRange) domain.salaryRange = salaryRange.trim();
    if (marketDemand) domain.marketDemand = marketDemand;
    if (futureScope !== undefined) domain.futureScope = futureScope.trim();
    if (Array.isArray(relatedProjects)) domain.relatedProjects = relatedProjects;

    if (status) {
      domain.status = status;
      if (status === "PUBLISHED" && previousStatus !== "PUBLISHED") {
        domain.publishedAt = new Date();
        domain.publishedBy = req.user._id;
        domain.visibility = "public";
      } else if (status === "UNPUBLISHED") {
        domain.visibility = "private";
      }
    }

    if (visibility) domain.visibility = visibility;

    domain.updatedBy = req.user._id;
    await domain.save();

    await logAdminAction({
      req,
      action: "DOMAIN_UPDATED",
      targetResource: domain.name,
      targetType: "Domain",
      description: `Admin ${req.user.name} updated domain: "${domain.name}".`,
      details: { domainId: domain._id, status: domain.status },
    });

    return res.status(200).json({
      success: true,
      message: "Domain updated successfully",
      domain,
      article: domain, // alias for backwards compatibility
    });
  } catch (error) {
    console.error("Update Domain By Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating domain" });
  }
};

// @desc    Admin deletes domain
// @route   DELETE /api/admin/domains/:id
// @access  Private/Admin
const deleteDomainByAdmin = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    const domainName = domain.name;
    await Domain.findByIdAndDelete(domain._id);

    await logAdminAction({
      req,
      action: "DOMAIN_DELETED",
      targetResource: domainName,
      targetType: "Domain",
      description: `Admin ${req.user.name} deleted domain: "${domainName}".`,
    });

    return res.status(200).json({
      success: true,
      message: `Domain "${domainName}" deleted successfully`,
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete Domain By Admin Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting domain" });
  }
};

// @desc    Admin toggles domain status (Publish / Unpublish / Archive)
// @route   PATCH /api/admin/domains/:id/status
// @access  Private/Admin
const toggleDomainStatus = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    const { status } = req.body;
    const nextStatus = status || (domain.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED");

    domain.status = nextStatus;
    if (nextStatus === "PUBLISHED") {
      domain.publishedAt = new Date();
      domain.publishedBy = req.user._id;
      domain.visibility = "public";
    } else {
      domain.visibility = "private";
    }

    domain.updatedBy = req.user._id;
    await domain.save();

    await logAdminAction({
      req,
      action: "DOMAIN_STATUS_CHANGED",
      targetResource: domain.name,
      targetType: "Domain",
      description: `Admin ${req.user.name} changed status of domain "${domain.name}" to ${nextStatus}.`,
      details: { status: nextStatus },
    });

    return res.status(200).json({
      success: true,
      message: `Domain status updated to ${nextStatus}`,
      domain,
    });
  } catch (error) {
    console.error("Toggle Domain Status Error:", error);
    return res.status(500).json({ success: false, message: "Server error toggling domain status" });
  }
};

// @desc    Admin approves alumni submission
// @route   PATCH /api/admin/domains/:id/approve
// @access  Private/Admin
const approveDomainSubmission = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    domain.status = "PUBLISHED";
    domain.visibility = "public";
    domain.publishedAt = new Date();
    domain.publishedBy = req.user._id;
    domain.updatedBy = req.user._id;
    domain.rejectionReason = "";
    await domain.save();

    try {
      await Notification.create({
        recipient: domain.createdBy,
        sender: req.user._id,
        type: "domain_approved",
        message: `Congratulations! Your domain contribution "${domain.name}" has been approved and published on GradConnect.`,
      });
    } catch (nErr) {
      console.warn("Could not send notification:", nErr.message);
    }

    await logAdminAction({
      req,
      action: "DOMAIN_APPROVED",
      targetResource: domain.name,
      targetType: "Domain",
      description: `Admin ${req.user.name} approved alumni submission: "${domain.name}". Domain is now PUBLISHED.`,
      details: { domainId: domain._id, createdBy: domain.createdBy },
    });

    return res.status(200).json({
      success: true,
      message: `Domain "${domain.name}" approved and published successfully.`,
      domain,
    });
  } catch (error) {
    console.error("Approve Domain Error:", error);
    return res.status(500).json({ success: false, message: "Server error approving domain" });
  }
};

// @desc    Admin rejects alumni submission with mandatory reason
// @route   PATCH /api/admin/domains/:id/reject
// @access  Private/Admin
const rejectDomainSubmission = async (req, res) => {
  try {
    const reason = (req.body.reason || req.body.rejectionReason || "").trim();
    if (!reason) {
      return res.status(400).json({ success: false, message: "A clear rejection reason is required" });
    }

    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    domain.status = "REJECTED";
    domain.visibility = "private";
    domain.rejectionReason = reason;
    domain.updatedBy = req.user._id;
    await domain.save();

    try {
      await Notification.create({
        recipient: domain.createdBy,
        sender: req.user._id,
        type: "domain_rejected",
        message: `Your domain submission "${domain.name}" was not approved. Reason: ${reason}`,
      });
    } catch (nErr) {
      console.warn("Could not send notification:", nErr.message);
    }

    await logAdminAction({
      req,
      action: "DOMAIN_REJECTED",
      targetResource: domain.name,
      targetType: "Domain",
      description: `Admin ${req.user.name} rejected domain submission: "${domain.name}". Reason: ${reason}`,
      details: { domainId: domain._id, rejectionReason: reason },
    });

    return res.status(200).json({
      success: true,
      message: `Domain submission "${domain.name}" rejected.`,
      domain,
    });
  } catch (error) {
    console.error("Reject Domain Error:", error);
    return res.status(500).json({ success: false, message: "Server error rejecting domain submission" });
  }
};

module.exports = {
  getPublicDomains,
  getPublicDomainBySlug,
  getDomainCategoriesSummary,
  suggestDomainByAlumni,
  getAlumniSubmissions,
  updateAlumniSubmission,
  getAdminDomains,
  createDomainByAdmin,
  getDomainByIdAdmin,
  updateDomainByAdmin,
  deleteDomainByAdmin,
  toggleDomainStatus,
  approveDomainSubmission,
  rejectDomainSubmission,
};
