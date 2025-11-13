import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// serve uploaded files if needed
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Auth routes
app.use("/api/auth", authRoutes);

// AI routes (protected with optionalAuth - allows anonymous users)
app.use("/api/ai", aiRoutes);

// create uploads folder if missing
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// create history directory if missing (user-specific history)
const historyDir = path.join(process.cwd(), "history");
if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

// create users.json file if missing (for JSON-based user storage)
const usersPath = path.join(process.cwd(), "users.json");
if (!fs.existsSync(usersPath)) {
  fs.writeFileSync(usersPath, JSON.stringify([], null, 2), "utf-8");
}

const PORT = process.env.PORT || 5000;

// Function to find and use the next available port
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`📍 API endpoint: http://localhost:${port}/api/ai`);
    console.log(`🔐 Auth endpoint: http://localhost:${port}/api/auth`);
    console.log(`📝 Using local JSON storage (users.json, history/)`);
    console.log(`🚀 Ready to enhance resumes!`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1); // Try next port
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
