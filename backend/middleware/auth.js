import { verifyToken, getTokenFromHeader } from "../utils/auth.js";
import fs from "fs";
import path from "path";

// For JSON-based user storage (when MongoDB is not available)
const usersFilePath = path.join(process.cwd(), "users.json");

export function readUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, "utf-8");
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error("Error reading users:", err);
    return [];
  }
}

export function writeUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users:", err);
  }
}

async function getUserFromToken(userId) {
  // Try MongoDB first (dynamic import)
  try {
    const mongoose = await import("mongoose");
    const userModule = await import("../models/User.js");
    const User = userModule.default;
    
    if (mongoose.default.connection.readyState === 1) {
      try {
        const user = await User.findById(userId);
        if (user) {
          const userObj = user.toObject();
          delete userObj.password;
          return userObj;
        }
      } catch (err) {
        // MongoDB query failed, fallback to JSON
      }
    }
  } catch (err) {
    // MongoDB not available, will use JSON storage
  }

  // Fallback to JSON storage
  const users = readUsers();
  const user = users.find((u) => u.id === userId || u._id === userId);
  if (user) {
    // Remove password before returning
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// Authentication middleware
export async function authenticate(req, res, next) {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user from database or JSON file
    const user = await getUserFromToken(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        const user = await getUserFromToken(decoded.userId);
        if (user) {
          req.user = user;
          req.userId = decoded.userId;
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

// readUsers and writeUsers are already exported above
// getUserFromToken is used internally and doesn't need to be exported

