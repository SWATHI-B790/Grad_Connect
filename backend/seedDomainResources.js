const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/.env" });
const Blog = require("./models/Blog");
const User = require("./models/User");

const technicalResources = [
  {
    title: "Building Production RAG Applications with LangChain, Vector Databases & OpenAI",
    slug: "production-rag-applications-langchain-vector-db",
    shortDescription: "A comprehensive architectural guide to building production-ready Retrieval-Augmented Generation (RAG) systems with vector embeddings, chunking strategies, and hybrid search.",
    category: "Architecture & System",
    domain: "Generative AI",
    tags: ["Generative AI", "LLMs", "RAG", "Vector DB", "LangChain", "OpenAI", "Python"],
    bannerImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
    readTime: "8 min read",
    isFeatured: true,
    content: `Retrieval-Augmented Generation (RAG) has emerged as the definitive enterprise architecture for connecting Large Language Models (LLMs) to proprietary knowledge bases without requiring continuous fine-tuning.

### Why Standard Prompts Fall Short
Standard LLMs suffer from knowledge cutoffs and hallucinations. In production systems, enterprise compliance and data timeliness demand determinism and source citations.

### 1. Document Ingestion & Chunking
Choosing the right chunk size is critical:
- **Small chunks (200-400 tokens)**: High precision, lower context.
- **Large chunks (800-1200 tokens)**: Rich context, higher token cost.
- **Recursive character splitting** with overlap prevents boundary truncation.

### 2. Embedding Generation & Vector Stores
Use production-grade embeddings (such as text-embedding-3-small) stored in vector databases (Pinecone, Qdrant, or pgvector).

### 3. Hybrid Search & Re-Ranking
Combine dense semantic retrieval with sparse BM25 keyword search, followed by a cross-encoder re-ranker (like Cohere Re-rank) to maximize retrieval precision before prompt injection.`,
  },
  {
    title: "Prompt Engineering Playbook: Few-Shot, Chain-of-Thought & Structured Output",
    slug: "prompt-engineering-playbook-few-shot-chain-of-thought",
    shortDescription: "Master deterministic prompt engineering patterns, few-shot conditioning, and JSON schema validation for production AI workflows.",
    category: "Guide & Tutorial",
    domain: "Generative AI",
    tags: ["Generative AI", "Prompt Engineering", "LLMs", "Structured Outputs", "AI Workflows"],
    bannerImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    readTime: "6 min read",
    isFeatured: false,
    content: `Prompt engineering in production is not about conversational flair; it is about programmatic determinism, JSON extraction, and robust error recovery.

### The Anatomy of an Enterprise Prompt
1. **System Directive**: Definitive persona, constraint rules, and output schema.
2. **Context Block**: Ground truth retrieved from enterprise search or user data.
3. **Few-Shot Demonstrations**: Balanced input/output pairs highlighting edge cases.
4. **Task Instruction**: Explicit call to action.

### Enforcing Structured JSON Outputs
Always pass strict JSON schemas via function calling or structured output APIs to guarantee machine-readable payloads.`,
  },
  {
    title: "Mastering Dynamic Programming: The 5-Step Framework for Technical Interviews",
    slug: "mastering-dynamic-programming-framework-technical-interviews",
    shortDescription: "A bulletproof 5-step framework to identify recurrence relations, memoize recursive solutions, and optimize space to O(1) in coding interviews.",
    category: "Interview Preparation",
    domain: "Data Structures & Algorithms",
    tags: ["DSA", "Dynamic Programming", "Algorithms", "Interview Prep", "Problem Solving", "LeetCode"],
    bannerImage: "https://images.unsplash.com/photo-1516116211227-bbc13c726352?q=80&w=1200&auto=format&fit=crop",
    readTime: "9 min read",
    isFeatured: true,
    content: `Dynamic Programming (DP) is universally recognized as the most intimidating category in technical interviews. However, every DP problem can be solved predictably with a structured framework.

### The 5-Step DP Framework
1. **Define the State in Plain English**: E.g., \`dp[i]\` represents the minimum cost to climb to step \`i\`.
2. **Formulate the Recurrence Relation**: Express \`dp[i]\` in terms of smaller subproblems (\`dp[i-1]\`, \`dp[i-2]\`).
3. **Establish Base Cases**: Identify boundary conditions that cannot be broken down further.
4. **Top-Down with Memoization**: Write clear recursive code with a cache table.
5. **Bottom-Up Tabulation & Space Optimization**: Invert into an iterative loop and eliminate unnecessary state history.`,
  },
  {
    title: "Graph Algorithms Demystified: BFS, DFS, Dijkstra, and Topological Sort",
    slug: "graph-algorithms-bfs-dfs-dijkstra-topological-sort",
    shortDescription: "Practical guide to modeling real-world software problems as graphs and implementing fundamental graph traversals and shortest path algorithms.",
    category: "Technical Roadmap",
    domain: "Data Structures & Algorithms",
    tags: ["DSA", "Graph Algorithms", "Dijkstra", "BFS", "DFS", "Computer Science"],
    bannerImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop",
    readTime: "7 min read",
    isFeatured: false,
    content: `Graphs represent relationships: dependency graphs in package managers, social networks, and routing engines.

### Essential Graph Representations
- **Adjacency List**: Space-efficient \`O(V + E)\` for sparse graphs.
- **Adjacency Matrix**: Fast edge lookup \`O(1)\` for dense graphs.

### When to Use Which Algorithm
- **BFS (Breadth-First Search)**: Shortest path in unweighted graphs, level-order traversal.
- **DFS (Depth-First Search)**: Cycle detection, backtracking, connected components.
- **Topological Sort**: Task scheduling, build dependency resolution (Kahn's Algorithm).
- **Dijkstra's Algorithm**: Shortest path with non-negative edge weights using a priority queue.`,
  },
  {
    title: "Advanced Git Branching Strategies & GitHub Actions CI/CD for Engineering Teams",
    slug: "advanced-git-branching-github-actions-ci-cd",
    shortDescription: "Learn trunk-based development, semantic release automation, rebase vs merge trade-offs, and multi-environment GitHub Actions workflows.",
    category: "Guide & Tutorial",
    domain: "Git & GitHub",
    tags: ["Git", "GitHub", "Version Control", "CI/CD", "DevOps", "GitHub Actions"],
    bannerImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=1200&auto=format&fit=crop",
    readTime: "6 min read",
    isFeatured: true,
    content: `Scaling software development across engineering teams requires discipline in version control and automated continuous integration.

### Trunk-Based Development vs GitFlow
While GitFlow was popular for scheduled release cycles, modern high-velocity engineering organizations favor **Trunk-Based Development**:
- Short-lived feature branches (< 24 hours).
- Frequent merges into main protected branch.
- Feature flags decouple deployment from release.

### Interactive Rebasing and Clean Commit Histories
Use \`git rebase -i\` to squash atomic WIP commits before opening Pull Requests, ensuring bisectability and pristine audit trails.

### Automating CI with GitHub Actions
Configure workflow triggers on pull requests to run linters, TypeScript type checks, unit tests, and security vulnerability scans before merge approval.`,
  },
  {
    title: "Resolving Complex Git Merge Conflicts: A Step-by-Step Practical Survival Guide",
    slug: "resolving-complex-git-merge-conflicts-guide",
    shortDescription: "Demystify 3-way merges, git diff3 conflict markers, rerere (reuse recorded resolution), and emergency git reflog recovery.",
    category: "Guide & Tutorial",
    domain: "Git & GitHub",
    tags: ["Git", "GitHub", "Merge Conflicts", "Reflog", "Developer Tools"],
    bannerImage: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?q=80&w=1200&auto=format&fit=crop",
    readTime: "5 min read",
    isFeatured: false,
    content: `Merge conflicts are not mistakes; they are Git asking for human intent when two branches diverge on overlapping lines.

### Enabling \`merge.conflictstyle diff3\`
Run \`git config --global merge.conflictstyle diff3\`. This shows not only *ours* and *theirs*, but also the *common ancestor* base commit, making resolution obvious.

### The Reflog Safety Net
Never panic when a merge goes wrong. \`git reflog\` tracks every HEAD pointer movement. Run \`git reset --hard HEAD@{n}\` to restore your exact previous branch state instantaneously.`,
  },
];

async function seedResources() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/gradconnect";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for domain resource seeding");

    let authorUser = await User.findOne({
      role: { $in: ["admin", "superadmin", "subadmin"] },
    });

    if (!authorUser) {
      authorUser = await User.findOne({});
    }

    if (!authorUser) {
      console.error("No user found to assign as author");
      process.exit(1);
    }

    console.log("Author assigned:", authorUser.name, "(", authorUser.role, ")");

    for (const resData of technicalResources) {
      const existing = await Blog.findOne({ slug: resData.slug });
      if (existing) {
        console.log("Resource already exists:", resData.title);
        continue;
      }

      await Blog.create({
        ...resData,
        author: authorUser._id,
        status: "published",
        views: Math.floor(Math.random() * 80) + 20,
      });

      console.log("Created technical resource:", resData.title, "->", resData.domain);
    }

    console.log("All technical domain resources seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedResources();
