const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/.env" });
const Domain = require("./models/Domain");
const User = require("./models/User");

const initialDomains = [
  {
    name: "MERN Stack Development",
    slug: "mern-stack-development",
    shortDescription: "Architect production web applications with MongoDB, Express.js, React, and Node.js with state management, REST APIs, and authentication.",
    description: "The MERN stack is one of the most widely adopted full-stack JavaScript architectures in contemporary web development. It empowers engineers to build complete end-to-end applications entirely in JavaScript/TypeScript, leveraging React on the client-side, Node.js and Express for high-concurrency microservices, and MongoDB for flexible JSON-like document persistence. Mastering MERN prepares software engineers for fast-moving startups as well as scalable enterprise engineering teams.",
    category: "Development",
    icon: "Layers",
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop",
    skills: ["React.js", "Node.js", "Express.js", "MongoDB", "REST APIs", "JWT Authentication", "Redux Toolkit", "Mongoose ORM"],
    technologies: ["JavaScript (ES6+)", "TypeScript", "Tailwind CSS", "Axios", "Vite", "HTML5", "CSS3"],
    careerRoles: ["Full Stack Developer", "MERN Stack Engineer", "Frontend Specialist", "Backend API Engineer", "Web Applications Architect"],
    jobRoles: ["Junior Full Stack Engineer", "Senior MERN Developer", "Technical Lead"],
    tools: ["VS Code", "Postman", "MongoDB Compass", "Git / GitHub", "Docker", "Vercel", "Render"],
    learningPath: {
      beginner: {
        title: "HTML, CSS, Modern JS & React Basics",
        topics: ["ES6+ Syntax & Async/Await", "React Components & Hooks (useState, useEffect)", "State Management", "Tailwind CSS Styling"],
        duration: "4 Weeks",
      },
      intermediate: {
        title: "Server APIs, Middleware & MongoDB",
        topics: ["Node.js Event Loop", "Express RESTful Routing", "Mongoose Schemas & Population", "JWT & HttpOnly Cookie Auth", "Error Handling Middleware"],
        duration: "6 Weeks",
      },
      advanced: {
        title: "Production Scaling, Caching & Deployment",
        topics: ["Redis Caching", "Database Index Optimization", "Docker Containerization", "CI/CD Pipelines", "WebSockets Realtime Sync"],
        duration: "6 Weeks",
      },
    },
    industry: "SaaS, FinTech, E-Commerce, Enterprise Web Services",
    difficultyLevel: "Intermediate",
    salaryRange: "₹6 - ₹22 LPA / $75,000 - $135,000",
    marketDemand: "Very High",
    futureScope: "High longevity as TypeScript and Next.js continue to build on standard React and Node ecosystem foundations.",
    relatedProjects: [
      {
        title: "Real-time Collaborative Whiteboard",
        description: "Canvas drawing workspace with WebSockets synchronization and JWT-authenticated boards.",
        difficulty: "Intermediate",
        techStack: ["React", "Node.js", "Socket.io", "MongoDB"],
      },
      {
        title: "Enterprise E-Commerce Microservices",
        description: "Scalable marketplace with inventory tracking, Stripe payments, and order fulfillment queues.",
        difficulty: "Advanced",
        techStack: ["React", "Express", "MongoDB", "Redis", "Stripe API"],
      },
    ],
  },
  {
    name: "Generative AI & LLMs",
    slug: "generative-ai-llms",
    shortDescription: "Build intelligent AI agents, Retrieval-Augmented Generation (RAG) pipelines, and multimodal LLM workflows.",
    description: "Generative Artificial Intelligence is redefining software engineering paradigms. Engineers working with modern LLMs design Retrieval-Augmented Generation (RAG) architectures, fine-tune models, implement semantic search across vector databases, and build autonomous agents capable of tool usage and reasoning. This domain bridges deep learning foundations with production API integrations.",
    category: "AI & Data",
    icon: "Brain",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
    skills: ["LangChain", "LlamaIndex", "Vector Embeddings", "Prompt Engineering", "RAG Systems", "Python", "Model Fine-Tuning", "Hugging Face"],
    technologies: ["OpenAI API", "Anthropic Claude", "Ollama", "PyTorch", "FastAPI", "Pinecone", "ChromaDB", "Qdrant"],
    careerRoles: ["AI Engineer", "LLM Application Developer", "GenAI Solutions Architect", "Machine Learning Engineer"],
    jobRoles: ["Generative AI Specialist", "AI Research Engineer"],
    tools: ["Jupyter Notebooks", "LangSmith", "Google Colab", "Docker", "Hugging Face Hub"],
    learningPath: {
      beginner: {
        title: "Python Data Stack & API Prompting",
        topics: ["Python for AI", "OpenAI & Anthropic APIs", "Few-Shot Prompting", "JSON Structured Outputs"],
        duration: "4 Weeks",
      },
      intermediate: {
        title: "Embeddings, Vector Stores & RAG",
        topics: ["Vector Embeddings", "Pinecone & ChromaDB Integration", "Chunking Strategies", "Document Q&A Pipelines", "LangChain Chains"],
        duration: "6 Weeks",
      },
      advanced: {
        title: "Autonomous Agents & Local Model Serving",
        topics: ["ReAct Agent Frameworks", "Tool Calling & Function Invocation", "Local LLMs with vLLM / Ollama", "LoRA Fine-tuning", "Evaluation & Guardrails"],
        duration: "8 Weeks",
      },
    },
    industry: "Enterprise Automation, Healthcare, LegalTech, FinTech, Developer Tools",
    difficultyLevel: "Advanced",
    salaryRange: "₹10 - ₹35 LPA / $110,000 - $180,000",
    marketDemand: "Very High",
    futureScope: "Extremely rapid growth trajectory as enterprises embed generative agents into daily operational workflows.",
    relatedProjects: [
      {
        title: "Enterprise Knowledge Base RAG Assistant",
        description: "Internal documentation search engine with citation verification and source links.",
        difficulty: "Intermediate",
        techStack: ["FastAPI", "LangChain", "Pinecone", "React"],
      },
      {
        title: "Multi-Agent Research & Synthesis Engine",
        description: "Cooperating agents that perform web research, critique arguments, and produce publication-ready summaries.",
        difficulty: "Advanced",
        techStack: ["LangGraph", "Python", "ChromaDB", "Streamlit"],
      },
    ],
  },
  {
    name: "Cloud Computing & AWS",
    slug: "cloud-computing-aws",
    shortDescription: "Deploy, scale, and manage fault-tolerant infrastructure with Amazon Web Services, serverless computing, and IaC.",
    description: "Cloud computing forms the backbone of global digital infrastructure. Modern cloud engineers architect secure, highly available, and cost-efficient distributed systems across AWS and hybrid clouds. Core capabilities encompass compute orchestration (EC2, ECS, Lambda), serverless microservices, virtual networking (VPCs, Security Groups), and Infrastructure as Code (Terraform, CloudFormation).",
    category: "Cloud & DevOps",
    icon: "Cloud",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
    skills: ["AWS Core Services", "Serverless Architecture", "VPC Networking", "IAM Security", "Terraform", "Docker", "S3 Storage"],
    technologies: ["AWS EC2", "AWS Lambda", "AWS ECS", "Amazon S3", "AWS RDS", "CloudFront", "Terraform HCL"],
    careerRoles: ["Cloud Engineer", "AWS Solutions Architect", "Cloud Operations Specialist", "Site Reliability Engineer"],
    jobRoles: ["Cloud Infrastructure Engineer", "DevOps Cloud Consultant"],
    tools: ["AWS Management Console", "AWS CLI", "Terraform", "Postman", "Datadog", "CloudWatch"],
    learningPath: {
      beginner: {
        title: "Cloud Fundamentals & Core Compute",
        topics: ["Cloud Concepts (IaaS, PaaS, SaaS)", "AWS IAM Security & MFA", "EC2 Virtual Instances", "S3 Object Storage"],
        duration: "4 Weeks",
      },
      intermediate: {
        title: "Networking, Databases & High Availability",
        topics: ["VPCs, Subnets & Route Tables", "Application Load Balancers", "Auto Scaling Groups", "RDS & DynamoDB Management"],
        duration: "6 Weeks",
      },
      advanced: {
        title: "Infrastructure as Code & Serverless",
        topics: ["Terraform Modular Provisioning", "AWS Lambda & API Gateway", "ECS Container Deployments", "Cost Optimization & Security Audits"],
        duration: "6 Weeks",
      },
    },
    industry: "Cloud Services, Enterprise Banking, Telecom, E-Commerce, Government",
    difficultyLevel: "Intermediate",
    salaryRange: "₹8 - ₹26 LPA / $90,000 - $155,000",
    marketDemand: "Very High",
    futureScope: "Continuous cloud adoption guarantees resilient long-term demand for certified architects and engineers.",
    relatedProjects: [
      {
        title: "Automated Multi-Region Terraform VPC",
        description: "Production-ready Infrastructure as Code provisioning public/private subnets, NAT gateways, and bastion hosts.",
        difficulty: "Intermediate",
        techStack: ["Terraform", "AWS VPC", "AWS EC2", "Bash"],
      },
    ],
  },
  {
    name: "DevOps & CI/CD Engineering",
    slug: "devops-cicd-engineering",
    shortDescription: "Automate build pipelines, container orchestration with Kubernetes, and maintain resilient site reliability.",
    description: "DevOps bridges the gap between software development and IT operations, promoting continuous integration, delivery, and automated infrastructure management. DevOps engineers leverage Docker, Kubernetes, GitHub Actions, and GitOps to accelerate release velocity while ensuring system stability, zero-downtime deployments, and observability.",
    category: "Cloud & DevOps",
    icon: "Cpu",
    coverImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=1200&auto=format&fit=crop",
    skills: ["Docker", "Kubernetes", "CI/CD Pipelines", "GitHub Actions", "Linux Administration", "Monitoring & Logging", "GitOps"],
    technologies: ["Kubernetes", "Helm", "Prometheus", "Grafana", "ArgoCD", "Bash", "Ansible"],
    careerRoles: ["DevOps Engineer", "Site Reliability Engineer (SRE)", "Platform Engineer", "Release Automation Specialist"],
    jobRoles: ["Junior DevOps Engineer", "Lead Platform Architect"],
    tools: ["Docker Desktop", "kubectl", "Minikube", "GitHub", "Jenkins", "Grafana", "Prometheus"],
    learningPath: {
      beginner: {
        title: "Linux, Git & Docker Containers",
        topics: ["Linux Command Line Mastery", "Dockerfiles & Container Lifecycle", "Multi-stage Builds", "Docker Compose"],
        duration: "4 Weeks",
      },
      intermediate: {
        title: "CI/CD Automation & GitHub Actions",
        topics: ["Pipeline Triggers & Matrix Builds", "Automated Linting & Unit Testing", "Artifact Publishing", "Zero-downtime Staging Deployments"],
        duration: "5 Weeks",
      },
      advanced: {
        title: "Kubernetes Orchestration & Observability",
        topics: ["Pods, Deployments, Services & Ingress", "ConfigMaps & Secrets Management", "Prometheus & Grafana Monitoring", "Helm Charts & GitOps with ArgoCD"],
        duration: "8 Weeks",
      },
    },
    industry: "Software Engineering, FinTech, High-Volume Web Platforms, Telecom",
    difficultyLevel: "Advanced",
    salaryRange: "₹8 - ₹28 LPA / $95,000 - $160,000",
    marketDemand: "High",
    futureScope: "Platform engineering and internal developer platforms (IDPs) are elevating standard DevOps roles.",
    relatedProjects: [
      {
        title: "Microservices Kubernetes Cluster with Helm",
        description: "Zero-downtime deployment setup with rolling updates, liveness/readiness probes, and ingress routing.",
        difficulty: "Advanced",
        techStack: ["Kubernetes", "Helm", "Docker", "Prometheus"],
      },
    ],
  },
  {
    name: "Cybersecurity & Ethical Hacking",
    slug: "cybersecurity-ethical-hacking",
    shortDescription: "Protect critical digital assets, conduct vulnerability assessments, and implement zero-trust security postures.",
    description: "Cybersecurity professionals defend networks, cloud environments, and applications against sophisticated threat actors. This domain combines offensive security (penetration testing, ethical hacking, vulnerability scanning) with defensive postures (Security Operations Centers, incident response, SIEM, cryptography, and network traffic analysis).",
    category: "Cybersecurity",
    icon: "ShieldCheck",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
    skills: ["Penetration Testing", "Network Security", "OWASP Top 10", "Vulnerability Scanning", "Cryptography", "Incident Response"],
    technologies: ["Kali Linux", "Wireshark", "Burp Suite", "Nmap", "Metasploit", "Snort", "Splunk"],
    careerRoles: ["Security Analyst", "Ethical Hacker / Penetration Tester", "SOC Analyst", "Information Security Officer"],
    jobRoles: ["Cybersecurity Associate", "Security Architect"],
    tools: ["Burp Suite", "Nmap", "Wireshark", "Metasploit Framework", "Splunk SIEM"],
    learningPath: {
      beginner: {
        title: "Networking Protocols & Linux Security",
        topics: ["TCP/IP, DNS, SSL/TLS Handshakes", "Linux File Permissions & Hardening", "Network Scanning with Nmap", "Packet Inspection in Wireshark"],
        duration: "5 Weeks",
      },
      intermediate: {
        title: "Web App Vulnerabilities & OWASP Top 10",
        topics: ["SQL Injection & XSS Exploits", "Authentication Bypass", "Burp Suite Proxying", "CSRF & Broken Access Control"],
        duration: "6 Weeks",
      },
      advanced: {
        title: "Penetration Testing & Security Operations",
        topics: ["Metasploit Exploitation", "Privilege Escalation", "Active Directory Attacks", "SIEM Monitoring & Incident Handling"],
        duration: "8 Weeks",
      },
    },
    industry: "Defense, Financial Institutions, Cloud Providers, Healthcare, Enterprise Tech",
    difficultyLevel: "Advanced",
    salaryRange: "₹7 - ₹25 LPA / $85,000 - $150,000",
    marketDemand: "Very High",
    futureScope: "Strict international privacy laws and AI-driven cyber threats guarantee ever-growing demand.",
    relatedProjects: [
      {
        title: "Automated Web Vulnerability Scanner",
        description: "Python CLI tool testing for open ports, missing HTTP security headers, and common SQLi injection vectors.",
        difficulty: "Intermediate",
        techStack: ["Python", "Requests", "BeautifulSoup", "Nmap"],
      },
    ],
  },
  {
    name: "UI/UX Design & Systems",
    slug: "ui-ux-design-systems",
    shortDescription: "Design intuitive user journeys, wireframes, high-fidelity prototypes, and scalable design systems in Figma.",
    description: "User Interface and User Experience design sits at the intersection of human psychology, visual aesthetics, and product strategy. UI/UX designers conduct user interviews, map customer journeys, wireframe product workflows, and build comprehensive design systems with reusable typography, tokens, and accessible interactive prototypes.",
    category: "Design",
    icon: "Palette",
    coverImage: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=1200&auto=format&fit=crop",
    skills: ["Figma Design", "Design Systems", "User Research", "Wireframing", "Prototyping", "Information Architecture", "Usability Testing"],
    technologies: ["Figma", "Auto-layout", "Variants & Tokens", "FigJam", "Adobe Creative Suite"],
    careerRoles: ["Product Designer", "UI/UX Designer", "Design Systems Lead", "UX Researcher"],
    jobRoles: ["Junior Product Designer", "Senior UX Consultant"],
    tools: ["Figma", "FigJam", "Miro", "Notion", "Principle"],
    learningPath: {
      beginner: {
        title: "Design Principles & Figma Fundamentals",
        topics: ["Typography & Color Theory", "Visual Hierarchy & Spacing", "Figma Vectors & Components", "Auto-layout Basics"],
        duration: "3 Weeks",
      },
      intermediate: {
        title: "User Research & Product Wireframing",
        topics: ["User Persona Development", "Journey Mapping & User Flows", "Low-fidelity Wireframing", "High-fidelity Interactive Prototypes"],
        duration: "5 Weeks",
      },
      advanced: {
        title: "Scalable Design Systems & Hand-off",
        topics: ["Design Tokens & Variables", "Component Library Governance", "Accessibility (WCAG AA/AAA)", "Developer Hand-off & Specifications"],
        duration: "6 Weeks",
      },
    },
    industry: "Consumer Tech, Mobile Apps, SaaS, E-Commerce, Design Agencies",
    difficultyLevel: "Intermediate",
    salaryRange: "₹6 - ₹20 LPA / $70,000 - $130,000",
    marketDemand: "High",
    futureScope: "User-centric design remains indispensable as digital products compete on experience and accessibility.",
    relatedProjects: [
      {
        title: "Comprehensive SaaS Dashboard Design System",
        description: "Full Figma component library featuring dark/light modes, data tables, micro-interactions, and responsive layout grids.",
        difficulty: "Intermediate",
        techStack: ["Figma", "Design Tokens", "Auto-layout"],
      },
    ],
  },
  {
    name: "Data Science & Machine Learning",
    slug: "data-science-machine-learning",
    shortDescription: "Extract actionable insights, build predictive models, and deploy scalable analytics pipelines.",
    description: "Data Science combines statistical analysis, mathematics, and machine learning to derive predictive intelligence from structured and unstructured data. Practitioners use Python, Pandas, Scikit-Learn, and SQL to clean messy datasets, build feature engineering pipelines, train classification and regression algorithms, and visualize business conclusions.",
    category: "AI & Data",
    icon: "Brain",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    skills: ["Python", "Pandas & NumPy", "Scikit-Learn", "Exploratory Data Analysis", "Feature Engineering", "SQL Analytics", "Data Visualization"],
    technologies: ["Python", "Matplotlib", "Seaborn", "PostgreSQL", "Jupyter", "TensorFlow"],
    careerRoles: ["Data Scientist", "Machine Learning Engineer", "Business Intelligence Analyst", "Data Analyst"],
    jobRoles: ["Junior Data Scientist", "Senior ML Specialist"],
    tools: ["Jupyter Notebooks", "Google Colab", "DBeaver", "Tableau", "Git"],
    learningPath: {
      beginner: {
        title: "Python Data Analysis & SQL Foundations",
        topics: ["Python Data Structures", "Pandas DataFrames & Manipulation", "Exploratory Data Analysis", "SQL Joins & Window Functions"],
        duration: "4 Weeks",
      },
      intermediate: {
        title: "Statistical Modeling & Scikit-Learn",
        topics: ["Hypothesis Testing", "Linear & Logistic Regression", "Decision Trees & Random Forests", "Cross-Validation & Hyperparameter Tuning"],
        duration: "6 Weeks",
      },
      advanced: {
        title: "Deep Learning Foundations & Model Serving",
        topics: ["Neural Network Architectures", "PyTorch / TensorFlow Basics", "Model Serialization & FastAPI Endpoints", "MLflow Experiment Tracking"],
        duration: "8 Weeks",
      },
    },
    industry: "FinTech, Retail Analytics, Healthcare, Marketing Tech, Insurance",
    difficultyLevel: "Intermediate",
    salaryRange: "₹7 - ₹26 LPA / $85,000 - $145,000",
    marketDemand: "High",
    futureScope: "Persistent enterprise prioritization of data-driven decision making ensures strong sustained market appetite.",
    relatedProjects: [
      {
        title: "Customer Churn Prediction Engine",
        description: "End-to-end ML pipeline with feature preprocessing, XGBoost classification, and FastAPI inference service.",
        difficulty: "Intermediate",
        techStack: ["Python", "Pandas", "Scikit-Learn", "FastAPI"],
      },
    ],
  },
  {
    name: "Mobile App Development (Flutter)",
    slug: "mobile-app-development-flutter",
    shortDescription: "Build beautiful, native-performance iOS and Android cross-platform mobile applications with Dart and Flutter.",
    description: "Mobile engineering with Google's Flutter framework allows developers to craft pixel-perfect, native-compiled applications for iOS, Android, and web from a single shared codebase. Engineers master Dart object-oriented principles, reactive widget trees, state management solutions (Bloc, Provider, Riverpod), and mobile hardware integrations.",
    category: "Mobile",
    icon: "Layers",
    coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200&auto=format&fit=crop",
    skills: ["Flutter Framework", "Dart Language", "State Management (Bloc/Riverpod)", "REST API Integration", "Mobile UI Design", "App Store Publishing"],
    technologies: ["Dart", "Flutter SDK", "Firebase Auth & Firestore", "SQLite", "Google Maps SDK"],
    careerRoles: ["Flutter Developer", "Mobile Application Engineer", "Cross-Platform App Specialist", "Mobile Solutions Architect"],
    jobRoles: ["Junior Flutter Developer", "Lead Mobile Engineer"],
    tools: ["Android Studio", "VS Code", "Xcode", "Git", "Postman", "Firebase Console"],
    learningPath: {
      beginner: {
        title: "Dart Programming & Widget Architecture",
        topics: ["Dart OOP & Asynchronous Programming", "Stateless vs Stateful Widgets", "Layouts (Row, Column, Stack, ListView)", "Material Design & Navigation"],
        duration: "4 Weeks",
      },
      intermediate: {
        title: "State Management & REST API Consumption",
        topics: ["Riverpod / Provider Architecture", "Http & Dio Client Integration", "Local Storage with SharedPreferences & Hive", "Form Validation & Animations"],
        duration: "5 Weeks",
      },
      advanced: {
        title: "Native Device Bridges & Production Release",
        topics: ["Platform Channels for Native Code", "Push Notifications with FCM", "Offline Sync Architecture", "App Store & Play Store Deployment Pipelines"],
        duration: "6 Weeks",
      },
    },
    industry: "Consumer Tech, Delivery & Logistics, EdTech, Social Networking, Health & Fitness",
    difficultyLevel: "Intermediate",
    salaryRange: "₹6 - ₹20 LPA / $75,000 - $130,000",
    marketDemand: "High",
    futureScope: "Cross-platform mobile development remains highly favored by startups and medium enterprises optimizing time-to-market.",
    relatedProjects: [
      {
        title: "Campus Ride-sharing & Carpooling App",
        description: "Mobile app with interactive maps, student authentication, ride scheduling, and push notifications.",
        difficulty: "Intermediate",
        techStack: ["Flutter", "Dart", "Firebase", "Google Maps API"],
      },
    ],
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/gradconnect";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for domain seeding.");

    const adminUser = await User.findOne({ role: { $in: ["superadmin", "admin"] } });
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    for (const dom of initialDomains) {
      const exists = await Domain.findOne({ slug: dom.slug });
      if (!exists) {
        await Domain.create({
          ...dom,
          createdBy: adminId,
          createdByRole: "admin",
          status: "PUBLISHED",
          visibility: "public",
          publishedAt: new Date(),
          publishedBy: adminId,
        });
        console.log(`Seeded domain: ${dom.name}`);
      } else {
        console.log(`Domain already exists: ${dom.name}`);
      }
    }

    console.log("Domain seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Domain seed failed:", err);
    process.exit(1);
  }
}

seed();
