const Blog = require("../models/Blog");
const BlogView = require("../models/BlogView");
const path = require("path");
const fs = require("fs");

// Technical & Career Domain definitions
const DOMAIN_DEFINITIONS = [
  {
    id: "mern-stack",
    name: "MERN Stack",
    stack: "MongoDB • Express • React • Node.js",
    icon: "Layers",
    description: "Full-stack web applications, REST APIs, JWT authentication, deployment, and modern web application architecture.",
    keywords: ["mern", "react", "node", "mongodb", "express", "fullstack", "full stack"],
    aliases: ["MERN", "MERN Stack", "mern-stack"],
  },
  {
    id: "frontend-development",
    name: "Frontend Development",
    stack: "HTML • CSS • JavaScript • React • UI",
    icon: "Code2",
    description: "Responsive interfaces, component architecture, state management, modern CSS, and web performance optimization.",
    keywords: ["frontend", "javascript", "react", "html", "css", "tailwind", "responsive"],
    aliases: ["Frontend", "Frontend Development", "frontend-development", "Web Development", "UI Development"],
  },
  {
    id: "backend-development",
    name: "Backend Development",
    stack: "Node.js • Express • APIs • Databases",
    icon: "Server",
    description: "Server architectures, RESTful API design, database modeling, authentication services, and microservices.",
    keywords: ["backend", "node", "express", "api", "rest api", "databases", "microservices"],
    aliases: ["Backend", "Backend Development", "backend-development", "Server Architecture"],
  },
  {
    id: "ui-ux-design",
    name: "UI/UX & Figma",
    stack: "Figma • Wireframes • Prototyping • Design Systems",
    icon: "Palette",
    description: "User research, wireframing, interactive prototyping, Figma design systems, and usability principles.",
    keywords: ["ui", "ux", "figma", "wireframes", "prototyping", "design systems", "design"],
    aliases: ["UI/UX & Figma", "UI/UX Design", "Figma & Design", "UI/UX", "Figma", "ui-ux-design"],
  },
  {
    id: "java-development",
    name: "Java Development",
    stack: "Java • OOP • Collections • Spring Boot",
    icon: "Coffee",
    description: "Enterprise backend engineering, object-oriented programming, Spring Boot microservices, and JVM internals.",
    keywords: ["java", "spring", "spring boot", "oop", "collections", "hibernate"],
    aliases: ["Java", "Java Development", "Spring Boot", "java-development"],
  },
  {
    id: "python-development",
    name: "Python Development",
    stack: "Python • Automation • Backend • Scripting",
    icon: "Terminal",
    description: "High-performance APIs, automation scripts, backend services, web scraping, and Python development patterns.",
    keywords: ["python", "django", "fastapi", "automation", "scripting", "flask"],
    aliases: ["Python", "Python Development", "FastAPI", "Django", "python-development"],
  },
  {
    id: "ai-ml",
    name: "AI & Machine Learning",
    stack: "ML • Deep Learning • NLP • Model Dev",
    icon: "Brain",
    description: "Machine learning algorithms, deep neural networks, computer vision, natural language processing, and evaluation.",
    keywords: ["ai", "machine learning", "deep learning", "nlp", "ml", "pytorch", "neural networks"],
    aliases: ["AI & Machine Learning", "AI / ML", "AI/ML", "Machine Learning", "ai-ml"],
  },
  {
    id: "generative-ai",
    name: "Generative AI",
    stack: "LLMs • Prompt Eng • RAG • AI Apps",
    icon: "Sparkles",
    description: "Large language models, prompt engineering, Retrieval-Augmented Generation (RAG), and production AI agents.",
    keywords: ["generative ai", "genai", "llm", "llms", "prompt engineering", "rag", "langchain"],
    aliases: ["Generative AI", "GenAI", "LLMs", "RAG", "generative-ai"],
  },
  {
    id: "data-science",
    name: "Data Science",
    stack: "Python • Statistics • Data Analysis • Viz",
    icon: "BarChart3",
    description: "Statistical modeling, exploratory data analysis, data visualization, feature engineering, and predictive pipelines.",
    keywords: ["data science", "data analysis", "statistics", "pandas", "numpy", "visualization"],
    aliases: ["Data Science", "Data Analytics", "data-science", "Data"],
  },
  {
    id: "dsa",
    name: "Data Structures & Algorithms",
    stack: "Arrays • Trees • Graphs • DP • Complexity",
    icon: "Binary",
    description: "Core algorithm design, problem-solving strategies, graph traversals, dynamic programming, and interview prep.",
    keywords: ["dsa", "data structures", "algorithms", "arrays", "trees", "graphs", "dynamic programming"],
    aliases: ["Data Structures & Algorithms", "DSA", "dsa", "Algorithms", "Data Structures"],
  },
  {
    id: "cloud-computing",
    name: "Cloud Computing",
    stack: "AWS • Azure • Architecture • Deployment",
    icon: "Cloud",
    description: "Cloud infrastructure, serverless architectures, multi-region deployments, storage, and cloud governance.",
    keywords: ["cloud", "aws", "azure", "cloud computing", "serverless", "gcp"],
    aliases: ["Cloud Computing", "Cloud", "AWS", "Azure", "cloud-computing"],
  },
  {
    id: "devops",
    name: "DevOps",
    stack: "Docker • CI/CD • Git • Monitoring",
    icon: "GitBranch",
    description: "Automated build and test pipelines, containerization, deployment workflows, and infrastructure reliability.",
    keywords: ["devops", "docker", "kubernetes", "ci/cd", "monitoring", "terraform"],
    aliases: ["DevOps", "CI/CD", "Docker", "Kubernetes", "devops"],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    stack: "Web Security • Auth • Network Security",
    icon: "ShieldCheck",
    description: "Threat modeling, authentication protocols, penetration testing, OWASP standards, and secure coding practices.",
    keywords: ["security", "cybersecurity", "web security", "auth", "network security", "infosec"],
    aliases: ["Cybersecurity", "Security", "Web Security", "cybersecurity"],
  },
  {
    id: "database-technologies",
    name: "Database",
    stack: "MongoDB • MySQL • PostgreSQL • DB Design",
    icon: "Database",
    description: "Relational and document database design, query optimization, indexing strategies, transactions, and scaling.",
    keywords: ["database", "sql", "postgresql", "mysql", "mongodb", "redis", "db design", "database-sql"],
    aliases: ["Database", "Database Technologies", "Database & SQL", "SQL", "Databases", "database-technologies"],
  },
  {
    id: "mobile-development",
    name: "Mobile Development",
    stack: "Flutter • Android • React Native • iOS",
    icon: "Smartphone",
    description: "Cross-platform and native mobile app engineering, responsive UI, app stores, and native device APIs.",
    keywords: ["mobile", "flutter", "react native", "android", "ios", "mobile development"],
    aliases: ["Mobile Development", "Mobile App Development", "Flutter", "React Native", "Android", "iOS", "mobile-development"],
  },
  {
    id: "computer-networks",
    name: "Computer Networks",
    stack: "TCP/IP • HTTP • DNS • Fundamentals",
    icon: "Network",
    description: "Protocol architectures, socket programming, network layer routing, TLS handshakes, and WebSockets.",
    keywords: ["network", "networks", "tcp/ip", "http", "dns", "websockets", "computer networks"],
    aliases: ["Computer Networks", "Networking", "Protocols", "TCP/IP", "computer-networks"],
  },
  {
    id: "software-engineering",
    name: "Software Engineering",
    stack: "SDLC • Architecture • Testing • Clean Code",
    icon: "Cpu",
    description: "System design principles, clean architecture, automated testing, code reviews, and software craftmanship.",
    keywords: ["software engineering", "sdlc", "architecture", "testing", "clean code", "system design", "software-testing"],
    aliases: ["Software Engineering", "System Design", "Software Testing", "Software Architecture", "software-engineering"],
  },
  {
    id: "git-github",
    name: "Git & GitHub",
    stack: "Version Control • Branching • Collaboration",
    icon: "GitPullRequest",
    description: "Git branching strategies, pull requests, merge conflict resolution, open source workflows, and GitHub Actions.",
    keywords: ["git", "github", "version control", "branching", "collaboration", "pull requests"],
    aliases: ["Git & GitHub", "Git", "GitHub", "Version Control", "git-github"],
  },
];

// Helper to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// @desc    Create new blog post
// @route   POST /api/admin/blogs
// @access  Private/Admin
const createBlog = async (req, res) => {
  try {
    const { title, shortDescription, content, category, isFeatured, readTime } = req.body;

    if (!title || !shortDescription || !content || !category) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    let slug = generateSlug(title);

    // Check slug uniqueness
    const slugExists = await Blog.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    let bannerImage = "";
    if (req.file) {
      bannerImage = `/uploads/${req.file.filename}`;
    } else if (req.body.bannerImageUrl) {
      bannerImage = req.body.bannerImageUrl;
    }

    const blog = await Blog.create({
      title: title.trim(),
      slug,
      shortDescription: shortDescription.trim(),
      content,
      category,
      bannerImage,
      isFeatured: isFeatured === "true" || isFeatured === true,
      readTime: readTime || "5 min read",
      author: req.user._id,
      status: "published",
    });

    return res.status(201).json({
      message: "Blog post created successfully",
      blog,
    });
  } catch (error) {
    console.error("Create Blog Error:", error);
    return res.status(500).json({ message: "Server error creating blog post" });
  }
};

// @desc    Get all published blogs for public view
// @route   GET /api/blogs
// @access  Public
const getAllBlogs = async (req, res) => {
  try {
    const { category, domain, search, page = 1, limit = 12 } = req.query;

    const query = { status: "published" };

    if (category && category !== "All") {
      query.category = category;
    }

    if (domain && domain !== "All") {
      const trimmedDomain = domain.trim().toLowerCase();
      const foundDef = DOMAIN_DEFINITIONS.find(
        (d) =>
          d.id.toLowerCase() === trimmedDomain ||
          d.name.toLowerCase() === trimmedDomain ||
          (d.aliases && d.aliases.some((a) => a.toLowerCase() === trimmedDomain))
      );

      const targetNames = foundDef
        ? [foundDef.name, foundDef.id, ...(foundDef.aliases || [])]
        : [domain.trim()];

      const regexList = targetNames.map((n) => new RegExp(`^${n}$`, "i"));

      query.$or = [
        { domain: { $in: regexList } },
        {
          $and: [
            { domain: { $in: [null, ""] } },
            { tags: { $in: regexList } },
          ],
        },
      ];
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchConditions = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { domain: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limitNum) || 1;

    const blogs = await Blog.find(query)
      .populate("author", "name email adminLabel role userType jobTitle company graduationYear avatar isVerifiedAlumni")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      blogs,
      totalBlogs,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Get Public Blogs Error:", error);
    return res.status(500).json({ message: "Server error fetching blogs" });
  }
};

// @desc    Get blog by slug (Public)
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, status: "published" }).populate(
      "author",
      "name email adminLabel role userType jobTitle company graduationYear avatar isVerifiedAlumni"
    );

    if (!blog) {
      return res.status(404).json({ message: "Article not found" });
    }

    return res.status(200).json({ blog });
  } catch (error) {
    console.error("Get Blog By Slug Error:", error);
    return res.status(500).json({ message: "Server error fetching article" });
  }
};

// @desc    Record unique/authentic blog view (Logged in user)
// @route   POST /api/blogs/:id/view
// @access  Private
const recordBlogView = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog || blog.status !== "published") {
      return res.status(404).json({ message: "Article not found or unavailable" });
    }

    // Create a new view record in MongoDB
    await BlogView.create({
      blog: blog._id,
      user: req.user._id,
    });

    // Calculate real total views and unique viewers count
    const totalViews = await BlogView.countDocuments({ blog: blog._id });
    const uniqueViewersList = await BlogView.distinct("user", { blog: blog._id });
    const uniqueViewers = uniqueViewersList.length;

    // Update blog document's views count
    blog.views = totalViews;
    await blog.save();

    return res.status(200).json({
      success: true,
      totalViews,
      uniqueViewers,
    });
  } catch (error) {
    console.error("Record Blog View Error:", error);
    return res.status(500).json({ message: "Server error recording view analytics" });
  }
};

// @desc    Get all blogs (Admin view - published & drafts with analytics)
// @route   GET /api/admin/blogs
// @access  Private/Admin
const getAllBlogsAdmin = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { shortDescription: searchRegex }];
    }

    const blogs = await Blog.find(query)
      .populate("author", "name email adminLabel")
      .sort({ createdAt: -1 });

    // Attach real uniqueViewers analytics for each article
    const blogsWithAnalytics = await Promise.all(
      blogs.map(async (blog) => {
        const uniqueViewersList = await BlogView.distinct("user", { blog: blog._id });
        const obj = blog.toObject();
        obj.uniqueViewers = uniqueViewersList.length;
        return obj;
      })
    );

    return res.status(200).json({ blogs: blogsWithAnalytics });
  } catch (error) {
    console.error("Get Admin Blogs Error:", error);
    return res.status(500).json({ message: "Server error fetching admin blogs" });
  }
};

// @desc    Update blog post
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, content, category, isFeatured, readTime, status } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    if (title && title.trim() !== blog.title) {
      blog.title = title.trim();
      let newSlug = generateSlug(title);
      const slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: id } });
      if (slugExists) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
      blog.slug = newSlug;
    }

    if (shortDescription) blog.shortDescription = shortDescription.trim();
    if (content) blog.content = content;
    if (category) blog.category = category;
    if (readTime) blog.readTime = readTime;
    if (isFeatured !== undefined) blog.isFeatured = isFeatured === "true" || isFeatured === true;
    if (status) blog.status = status;

    if (req.file) {
      if (blog.bannerImage && blog.bannerImage.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", blog.bannerImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      blog.bannerImage = `/uploads/${req.file.filename}`;
    } else if (req.body.bannerImageUrl) {
      blog.bannerImage = req.body.bannerImageUrl;
    }

    await blog.save();

    return res.status(200).json({
      message: "Blog post updated successfully",
      blog,
    });
  } catch (error) {
    console.error("Update Blog Error:", error);
    return res.status(500).json({ message: "Server error updating blog post" });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    if (blog.bannerImage && blog.bannerImage.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", blog.bannerImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await BlogView.deleteMany({ blog: id });
    await Blog.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Blog post deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    return res.status(500).json({ message: "Server error deleting blog post" });
  }
};

// @desc    Toggle blog featured status
// @route   PATCH /api/admin/blogs/:id/feature
// @access  Private/Admin
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    blog.isFeatured = !blog.isFeatured;
    await blog.save();

    return res.status(200).json({
      message: `Blog ${blog.isFeatured ? "featured" : "unfeatured"} successfully`,
      blog,
    });
  } catch (error) {
    console.error("Toggle Featured Error:", error);
    return res.status(500).json({ message: "Server error toggling featured status" });
  }
};

// @desc    Get category summary & article counts (Public)
// @route   GET /api/blogs/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categoriesList = [
      "Career Advice",
      "Job Opportunity",
      "Internship",
      "Alumni Achievement",
      "Career Journey",
      "Announcement",
      "Mentorship",
      "Industry Insights",
    ];

    const counts = await Blog.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const categoriesWithCount = categoriesList.map((name) => ({
      name,
      count: countMap[name] || 0,
    }));

    return res.status(200).json({ categories: categoriesWithCount });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({ message: "Server error fetching categories" });
  }
};

// @desc    Get aggregated stats for live counter (total articles, categories, views)
// @route   GET /api/blogs/stats
// @access  Public
const getBlogStats = async (req, res) => {
  try {
    const totalArticles = await Blog.countDocuments({ status: "published" });

    const categoriesList = await Blog.distinct("category", { status: "published" });
    const totalCategories = categoriesList.length || 8;

    const viewsAggregation = await Blog.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    const totalViews = viewsAggregation[0]?.totalViews || 0;

    return res.status(200).json({
      totalArticles,
      totalCategories,
      totalViews,
    });
  } catch (error) {
    console.error("Get Blog Stats Error:", error);
    return res.status(500).json({ message: "Server error fetching blog stats" });
  }
};

// @desc    Get top 5 trending (most viewed) articles
// @route   GET /api/blogs/trending
// @access  Public
const getTrendingBlogs = async (req, res) => {
  try {
    const trending = await Blog.find({ status: "published" })
      .populate("author", "name email adminLabel")
      .sort({ views: -1, createdAt: -1 })
      .limit(5);

    return res.status(200).json({ blogs: trending });
  } catch (error) {
    console.error("Get Trending Blogs Error:", error);
    return res.status(500).json({ message: "Server error fetching trending articles" });
  }
};

// @desc    Get all technical & career domains with aggregated post counts
// @route   GET /api/blogs/domains
// @access  Public
const getDomains = async (req, res) => {
  try {
    const allBlogs = await Blog.find({ status: "published" });

    const domainsWithCounts = DOMAIN_DEFINITIONS.map((domain) => {
      const matchNames = [
        domain.name.toLowerCase(),
        domain.id.toLowerCase(),
        ...(domain.aliases ? domain.aliases.map((a) => a.toLowerCase()) : []),
      ];

      const matchingCount = allBlogs.filter((b) => {
        const bDomain = b.domain ? b.domain.trim().toLowerCase() : "";
        if (bDomain && matchNames.includes(bDomain)) {
          return true;
        }
        if (bDomain.length > 0) {
          return false;
        }
        if (Array.isArray(b.tags) && b.tags.some((t) => matchNames.includes(t.trim().toLowerCase()))) {
          return true;
        }
        return false;
      }).length;

      return {
        ...domain,
        count: matchingCount,
      };
    });

    return res.status(200).json({ domains: domainsWithCounts });
  } catch (error) {
    console.error("Get Domains Error:", error);
    return res.status(500).json({ message: "Server error fetching domains" });
  }
};

// @desc    Create new blog / experience article by Alumni
// @route   POST /api/blogs
// @access  Private (Alumni Only)
const createAlumniBlog = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      content,
      category,
      domain,
      tags,
      status,
      experienceType,
      company,
      jobRole,
      batch,
      readTime,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Please provide an article title." });
    }

    const isPublishing = status === "published";

    if (isPublishing) {
      if (!shortDescription || !shortDescription.trim()) {
        return res.status(400).json({ success: false, message: "Please provide a short summary before publishing." });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: "Please write your article content before publishing." });
      }
    }

    if (shortDescription && shortDescription.trim().length > 200) {
      return res.status(400).json({ success: false, message: "Short description cannot exceed 200 characters." });
    }

    let slug = generateSlug(title);
    const slugExists = await Blog.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    let bannerImage = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80";
    if (req.file) {
      bannerImage = `/uploads/${req.file.filename}`;
    } else if (req.body.bannerImageUrl && req.body.bannerImageUrl.trim()) {
      bannerImage = req.body.bannerImageUrl.trim();
    }

    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === "string" && tags.trim()) {
      parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const blog = await Blog.create({
      title: title.trim(),
      slug,
      shortDescription: (shortDescription || "").trim(),
      content: content || "",
      category: category || "Placement Journey",
      domain: (domain || "Software Development").trim(),
      tags: parsedTags,
      bannerImage,
      experienceType: (experienceType || category || "").trim(),
      company: (company || "").trim(),
      jobRole: (jobRole || req.body.role || "").trim(),
      batch: (batch || "").trim(),
      readTime: readTime || "5 min read",
      author: req.user._id,
      createdBy: req.user._id,
      status: isPublishing ? "published" : "draft",
      isFeatured: false,
      views: 0,
    });

    return res.status(201).json({
      success: true,
      message: isPublishing
        ? "Your experience article has been published successfully!"
        : "Draft saved successfully. You can continue editing anytime.",
      blog,
    });
  } catch (error) {
    console.error("Create Alumni Blog Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error submitting article",
    });
  }
};

// @desc    Get all blogs authored by logged-in Alumni (published + drafts)
// @route   GET /api/blogs/my
// @access  Private (Alumni Only)
const getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate("author", "name email userType role company jobTitle avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    console.error("Get My Blogs Error:", error);
    return res.status(500).json({ success: false, message: "Server error retrieving your articles" });
  }
};

// @desc    Get single blog by ID (for edit view, author or admin)
// @route   GET /api/blogs/id/:id
// @access  Private
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).populate(
      "author",
      "name email userType role company jobTitle avatar"
    );

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      req.user?.role?.toLowerCase()
    );
    const isAuthor = blog.author && blog.author._id.toString() === req.user?._id?.toString();

    if (blog.status !== "published" && !isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this draft article." });
    }

    return res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("Get Blog By ID Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching article" });
  }
};

// @desc    Update alumni's own experience article (or publish a draft)
// @route   PUT /api/blogs/:id
// @access  Private (Alumni Only)
const updateAlumniBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      req.user?.role?.toLowerCase()
    );
    const isAuthor = blog.author.toString() === req.user._id.toString();

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: "You can only edit your own articles." });
    }

    const {
      title,
      shortDescription,
      content,
      category,
      domain,
      tags,
      status,
      experienceType,
      company,
      jobRole,
      batch,
      readTime,
    } = req.body;

    const newStatus = status || blog.status;
    const isPublishing = newStatus === "published";

    if (title && title.trim() !== blog.title) {
      blog.title = title.trim();
      let newSlug = generateSlug(title);
      const slugExists = await Blog.findOne({ slug: newSlug, _id: { $ne: id } });
      if (slugExists) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
      blog.slug = newSlug;
    }

    if (shortDescription !== undefined) {
      if (shortDescription.trim().length > 200) {
        return res.status(400).json({ success: false, message: "Short description cannot exceed 200 characters." });
      }
      blog.shortDescription = shortDescription.trim();
    }

    if (isPublishing) {
      if (!blog.shortDescription || !blog.shortDescription.trim()) {
        return res.status(400).json({ success: false, message: "Please provide a short summary before publishing." });
      }
      if (content !== undefined) {
        if (!content.trim()) {
          return res.status(400).json({ success: false, message: "Please provide article content before publishing." });
        }
      } else if (!blog.content || !blog.content.trim()) {
        return res.status(400).json({ success: false, message: "Please provide article content before publishing." });
      }
    }

    if (content !== undefined) blog.content = content;
    if (category) blog.category = category;
    if (domain) blog.domain = domain.trim();
    if (readTime) blog.readTime = readTime;
    if (experienceType !== undefined) blog.experienceType = experienceType.trim();
    if (company !== undefined) blog.company = company.trim();
    if (jobRole !== undefined || req.body.role !== undefined) {
      blog.jobRole = (jobRole || req.body.role || "").trim();
    }
    if (batch !== undefined) blog.batch = batch.trim();
    if (status) blog.status = status;

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        blog.tags = tags;
      } else if (typeof tags === "string") {
        blog.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    if (req.file) {
      if (blog.bannerImage && blog.bannerImage.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", blog.bannerImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      blog.bannerImage = `/uploads/${req.file.filename}`;
    } else if (req.body.bannerImageUrl && req.body.bannerImageUrl.trim()) {
      blog.bannerImage = req.body.bannerImageUrl.trim();
    }

    blog.updatedBy = req.user._id;
    await blog.save();

    return res.status(200).json({
      success: true,
      message: isPublishing
        ? "Article updated and published successfully!"
        : "Draft updated successfully.",
      blog,
    });
  } catch (error) {
    console.error("Update Alumni Blog Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error updating article" });
  }
};

// @desc    Delete alumni's own experience article
// @route   DELETE /api/blogs/:id
// @access  Private (Alumni Only)
const deleteAlumniBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    const isAdmin = ["admin", "superadmin", "subadmin", "admin1", "admin2"].includes(
      req.user?.role?.toLowerCase()
    );
    const isAuthor = blog.author.toString() === req.user._id.toString();

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: "You can only delete your own articles." });
    }

    if (blog.bannerImage && blog.bannerImage.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", blog.bannerImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await BlogView.deleteMany({ blog: id });
    await Blog.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Delete Alumni Blog Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting article" });
  }
};

module.exports = {
  createBlog,
  createAlumniBlog,
  getAllBlogs,
  getBlogBySlug,
  recordBlogView,
  getAllBlogsAdmin,
  updateBlog,
  updateAlumniBlog,
  deleteBlog,
  deleteAlumniBlog,
  getMyBlogs,
  getBlogById,
  toggleFeatured,
  getCategories,
  getBlogStats,
  getTrendingBlogs,
  getDomains,
};
