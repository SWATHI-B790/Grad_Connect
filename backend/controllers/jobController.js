const Job = require("../models/Job");
const User = require("../models/User");

// @desc    Get all published jobs for public view
// @route   GET /api/jobs
// @access  Public
const getAllJobs = async (req, res) => {
  try {
    const { search, type, workMode, page = 1, limit = 50, mine, status } = req.query;

    // Normal public listing must only see PUBLISHED jobs
    let query = {
      status: { $in: ["PUBLISHED", "published"] },
    };

    // If request explicitly asks for "mine" and user is authenticated
    if (mine === "true" && req.user) {
      query = {
        $or: [{ createdBy: req.user._id }, { postedBy: req.user._id }],
      };
    } else if (status && req.user && ["admin", "superadmin"].includes(req.user.role?.toLowerCase())) {
      if (status !== "All") query.status = status.toUpperCase();
    }

    if (type && type !== "All") {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ type: type }, { jobType: new RegExp(type, "i") }],
      });
    }

    if (workMode && workMode !== "All") {
      query.$and = query.$and || [];
      query.$and.push({
        workMode: { $regex: new RegExp(`^${workMode}$`, "i") },
      });
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: searchRegex },
          { company: searchRegex },
          { skills: searchRegex },
          { requirements: searchRegex },
          { location: searchRegex },
          { description: searchRegex },
        ],
      });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const totalJobs = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate("createdBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .populate("postedBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      totalJobs,
      currentPage: pageNum,
      totalPages: Math.ceil(totalJobs / limitNum) || 1,
      jobs,
    });
  } catch (error) {
    console.error("Get All Jobs Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching jobs" });
  }
};

// @desc    Get jobs created by logged-in user (Alumni or Admin)
// @route   GET /api/jobs/my
// @access  Private (Alumni / Admin)
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      $or: [{ createdBy: req.user._id }, { postedBy: req.user._id }],
    })
      .populate("createdBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .populate("postedBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get My Jobs Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching personal jobs" });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public for PUBLISHED; Private for drafts/unpublished
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id)
      .populate("createdBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .populate("postedBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job opportunity not found" });
    }

    if (job.status !== "PUBLISHED") {
      const userId = req.user?._id?.toString();
      const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
        req.user?.role?.toLowerCase()
      );
      const isOwner =
        (job.createdBy && job.createdBy._id.toString() === userId) ||
        (job.postedBy && job.postedBy._id.toString() === userId);

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this unpublished job posting.",
        });
      }
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    console.error("Get Job By ID Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching job details" });
  }
};

// @desc    Create new job posting (Alumni or Admin)
// @route   POST /api/jobs
// @access  Private (Alumni / Admin only, Student forbidden)
const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      companyLogo,
      companyWebsite,
      companyDescription,
      type,
      jobType,
      workMode,
      location,
      experience,
      experienceLevel,
      openings,
      description,
      responsibilities,
      skills,
      requiredSkills,
      preferredSkills,
      qualifications,
      preferredQualifications,
      salary,
      salaryRange,
      deadline,
      applyUrl,
      applicationUrl,
      contactEmail,
      instructions,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Job title is required." });
    }
    if (!company || !company.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required." });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: "Job description is required." });
    }

    // Parse required skills
    const rawSkills = skills || requiredSkills;
    let parsedSkills = [];
    if (Array.isArray(rawSkills)) {
      parsedSkills = rawSkills.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
    } else if (typeof rawSkills === "string" && rawSkills.trim()) {
      parsedSkills = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (parsedSkills.length === 0) {
      return res.status(400).json({ success: false, message: "Please specify at least one required skill." });
    }

    // Parse preferred skills
    let parsedPreferredSkills = [];
    if (Array.isArray(preferredSkills)) {
      parsedPreferredSkills = preferredSkills.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
    } else if (typeof preferredSkills === "string" && preferredSkills.trim()) {
      parsedPreferredSkills = preferredSkills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const effectiveApplyUrl = (applyUrl || applicationUrl || "").trim();

    const roleLower = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(roleLower);
    const createdByRole = isAdmin ? "admin" : "alumni";

    const jobStatus =
      status && ["DRAFT", "PUBLISHED", "UNPUBLISHED", "CLOSED"].includes(status.toUpperCase())
        ? status.toUpperCase()
        : "PUBLISHED";

    const effectiveType = type || jobType || "Full-Time";
    const effectiveExperience = (experience || experienceLevel || "0-2 Years").trim();
    const effectiveSalary = (salary || salaryRange || "").trim();

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      companyLogo: (companyLogo || "").trim(),
      companyWebsite: (companyWebsite || "").trim(),
      companyDescription: (companyDescription || "").trim(),
      type: effectiveType,
      jobType: effectiveType,
      workMode: workMode || "Remote",
      location: (location || "Remote").trim(),
      experience: effectiveExperience,
      experienceLevel: effectiveExperience,
      openings: Number(openings) > 0 ? Number(openings) : 1,
      description: description.trim(),
      responsibilities: (responsibilities || "").trim(),
      skills: parsedSkills,
      requirements: parsedSkills,
      preferredSkills: parsedPreferredSkills,
      qualifications: (qualifications || "").trim(),
      preferredQualifications: (preferredQualifications || "").trim(),
      salary: effectiveSalary,
      salaryRange: effectiveSalary,
      deadline: deadline ? new Date(deadline) : null,
      applyUrl: effectiveApplyUrl,
      applicationUrl: effectiveApplyUrl,
      contactEmail: (contactEmail || "").trim(),
      instructions: (instructions || "").trim(),
      createdBy: req.user._id,
      postedBy: req.user._id,
      postedByName: req.user.name || "",
      isVerifiedAlumniPost: !isAdmin,
      createdByRole,
      status: jobStatus,
      publishedAt: jobStatus === "PUBLISHED" ? new Date() : null,
    });

    const populatedJob = await Job.findById(job._id)
      .populate("createdBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .populate("postedBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel");

    return res.status(201).json({
      success: true,
      message:
        jobStatus === "PUBLISHED"
          ? "Job opportunity posted successfully!"
          : "Job draft saved successfully.",
      job: populatedJob,
    });
  } catch (error) {
    console.error("Create Job Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error creating job" });
  }
};

// @desc    Update job posting
// @route   PUT /api/jobs/:id
// @access  Private (Owner Alumni or Admin only)
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job opportunity not found." });
    }

    const userId = req.user._id.toString();
    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      req.user.role?.toLowerCase()
    );
    const isOwner =
      (job.createdBy && job.createdBy.toString() === userId) ||
      (job.postedBy && job.postedBy.toString() === userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this job posting.",
      });
    }

    const {
      title,
      company,
      companyLogo,
      companyWebsite,
      companyDescription,
      type,
      jobType,
      workMode,
      location,
      experience,
      experienceLevel,
      openings,
      description,
      responsibilities,
      skills,
      requiredSkills,
      preferredSkills,
      qualifications,
      preferredQualifications,
      salary,
      salaryRange,
      deadline,
      applyUrl,
      applicationUrl,
      contactEmail,
      instructions,
      status,
    } = req.body;

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, message: "Job title cannot be empty." });
      job.title = title.trim();
    }

    if (company !== undefined) {
      if (!company.trim()) return res.status(400).json({ success: false, message: "Company name cannot be empty." });
      job.company = company.trim();
    }

    if (companyLogo !== undefined) job.companyLogo = companyLogo.trim();
    if (companyWebsite !== undefined) job.companyWebsite = companyWebsite.trim();
    if (companyDescription !== undefined) job.companyDescription = companyDescription.trim();

    if (type !== undefined || jobType !== undefined) {
      const t = type || jobType;
      job.type = t;
      job.jobType = t;
    }

    if (workMode !== undefined) job.workMode = workMode;
    if (location !== undefined) job.location = location.trim();

    if (experience !== undefined || experienceLevel !== undefined) {
      const exp = experience || experienceLevel;
      job.experience = exp.trim();
      job.experienceLevel = exp.trim();
    }

    if (openings !== undefined) job.openings = Number(openings) > 0 ? Number(openings) : 1;

    if (description !== undefined) {
      if (!description.trim()) return res.status(400).json({ success: false, message: "Job description cannot be empty." });
      job.description = description.trim();
    }

    if (responsibilities !== undefined) job.responsibilities = responsibilities.trim();
    if (qualifications !== undefined) job.qualifications = qualifications.trim();
    if (preferredQualifications !== undefined) job.preferredQualifications = preferredQualifications.trim();

    if (salary !== undefined || salaryRange !== undefined) {
      const s = salary || salaryRange;
      job.salary = s.trim();
      job.salaryRange = s.trim();
    }

    if (deadline !== undefined) job.deadline = deadline ? new Date(deadline) : null;

    if (applyUrl !== undefined || applicationUrl !== undefined) {
      const url = (applyUrl || applicationUrl || "").trim();
      job.applyUrl = url;
      job.applicationUrl = url;
    }

    if (contactEmail !== undefined) job.contactEmail = contactEmail.trim();
    if (instructions !== undefined) job.instructions = instructions.trim();

    const rawSkills = skills !== undefined ? skills : requiredSkills;
    if (rawSkills !== undefined) {
      let parsed = [];
      if (Array.isArray(rawSkills)) {
        parsed = rawSkills.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
      } else if (typeof rawSkills === "string" && rawSkills.trim()) {
        parsed = rawSkills.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (parsed.length > 0) {
        job.skills = parsed;
        job.requirements = parsed;
      }
    }

    if (preferredSkills !== undefined) {
      let parsed = [];
      if (Array.isArray(preferredSkills)) {
        parsed = preferredSkills.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
      } else if (typeof preferredSkills === "string" && preferredSkills.trim()) {
        parsed = preferredSkills.split(",").map((s) => s.trim()).filter(Boolean);
      }
      job.preferredSkills = parsed;
    }

    if (status !== undefined) {
      const upperStatus = status.toUpperCase();
      if (["DRAFT", "PUBLISHED", "UNPUBLISHED", "CLOSED"].includes(upperStatus)) {
        if (upperStatus === "PUBLISHED" && job.status !== "PUBLISHED") {
          job.publishedAt = new Date();
        }
        job.status = upperStatus;
      }
    }

    await job.save();

    const updatedJob = await Job.findById(job._id)
      .populate("createdBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .populate("postedBy", "name role userType avatar company jobTitle isVerifiedAlumni adminLabel");

    return res.status(200).json({
      success: true,
      message: "Job opportunity updated successfully.",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Update Job Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error updating job" });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Owner Alumni or Admin only)
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job opportunity not found." });
    }

    const userId = req.user._id.toString();
    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      req.user.role?.toLowerCase()
    );
    const isOwner =
      (job.createdBy && job.createdBy.toString() === userId) ||
      (job.postedBy && job.postedBy.toString() === userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this job posting.",
      });
    }

    await Job.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Job opportunity deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting job" });
  }
};

// @desc    Toggle / update job status (e.g. PUBLISHED, UNPUBLISHED, CLOSED)
// @route   PATCH /api/jobs/:id/status
// @access  Private (Owner Alumni or Admin only)
const toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job opportunity not found." });
    }

    const userId = req.user._id.toString();
    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      req.user.role?.toLowerCase()
    );
    const isOwner =
      (job.createdBy && job.createdBy.toString() === userId) ||
      (job.postedBy && job.postedBy.toString() === userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to change the status of this job.",
      });
    }

    const upperStatus = (status || "").toUpperCase();
    if (!["DRAFT", "PUBLISHED", "UNPUBLISHED", "CLOSED"].includes(upperStatus)) {
      return res.status(400).json({ success: false, message: "Invalid job status specified." });
    }

    job.status = upperStatus;
    if (upperStatus === "PUBLISHED" && !job.publishedAt) {
      job.publishedAt = new Date();
    }
    await job.save();

    return res.status(200).json({
      success: true,
      message: `Job status updated to ${upperStatus}.`,
      job,
    });
  } catch (error) {
    console.error("Toggle Job Status Error:", error);
    return res.status(500).json({ success: false, message: "Server error changing job status" });
  }
};

// @desc    Admin: Get all jobs with full metadata & stats
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
const getAllJobsAdmin = async (req, res) => {
  try {
    const { search, status, type, workMode } = req.query;

    const query = {};

    if (status && status !== "All") {
      query.status = status.toUpperCase();
    }

    if (type && type !== "All") {
      query.type = type;
    }

    if (workMode && workMode !== "All") {
      query.workMode = workMode;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex },
      ];
    }

    const jobs = await Job.find(query)
      .populate("createdBy", "name email role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .populate("postedBy", "name email role userType avatar company jobTitle isVerifiedAlumni adminLabel")
      .sort({ createdAt: -1 });

    const totalJobs = await Job.countDocuments();
    const publishedCount = await Job.countDocuments({ status: { $in: ["PUBLISHED", "published"] } });
    const draftCount = await Job.countDocuments({ status: "DRAFT" });
    const unpublishedCount = await Job.countDocuments({ status: "UNPUBLISHED" });
    const closedCount = await Job.countDocuments({ status: "CLOSED" });

    return res.status(200).json({
      success: true,
      stats: {
        total: totalJobs,
        published: publishedCount,
        draft: draftCount,
        unpublished: unpublishedCount,
        closed: closedCount,
      },
      jobs,
    });
  } catch (error) {
    console.error("Get Admin Jobs Error:", error);
    return res.status(500).json({ success: false, message: "Server error retrieving admin jobs" });
  }
};

module.exports = {
  getAllJobs,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getAllJobsAdmin,
};
