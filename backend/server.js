const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local frontend dev origins (5173, 5174, etc.)
      if (!origin || origin.startsWith("http://localhost:")) {
        return callback(null, origin || true);
      }
      return callback(null, origin);
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Route Definitions
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/follow", require("./routes/followRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/domains", require("./routes/domainRoutes"));
app.get("/api/stats/summary", require("./controllers/userController").getSummaryStats);
app.use("/api", require("./routes/bannerRoutes"));
app.use("/api", require("./routes/blogRoutes"));
app.use("/api", require("./routes/jobRoutes"));


// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`CORS allowed origin: Dynamic localhost origins`);
});
