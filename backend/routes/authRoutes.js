import express from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/auth.js";
import { readUsers, writeUsers } from "../middleware/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Helper function to check if MongoDB is available
async function checkMongoDB() {
  try {
    const mongoose = await import("mongoose");
    return mongoose.default.connection.readyState === 1;
  } catch (err) {
    return false;
  }
}

// Helper function to get User model
async function getUserModel() {
  try {
    const userModule = await import("../models/User.js");
    return userModule.default;
  } catch (err) {
    return null;
  }
}

// ====== SIGNUP ======
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if user already exists
    const isMongoConnected = await checkMongoDB();
    if (isMongoConnected) {
      try {
        const User = await getUserModel();
        if (User) {
          const existingUser = await User.findOne({ email: email.toLowerCase() });
          if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
          }
        }
      } catch (err) {
        // MongoDB query failed, fallback to JSON
      }
    }

    // Fallback to JSON storage
    const users = readUsers();
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    if (isMongoConnected) {
      try {
        const User = await getUserModel();
        if (User) {
          const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
          });
          await user.save();
          const userObj = user.toObject();
          delete userObj.password;

          // Generate token
          const token = generateToken(user._id.toString());

          return res.status(201).json({
            message: "User created successfully",
            user: userObj,
            token,
          });
        }
      } catch (err) {
        console.error("MongoDB signup error:", err);
        // Fallback to JSON storage
      }
    }

    // Fallback to JSON storage
    const newUser = {
      id: Date.now().toString(),
      _id: Date.now().toString(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    const token = generateToken(newUser.id);

    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
});

// ====== LOGIN ======
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Try MongoDB first
    const isMongoConnected = await checkMongoDB();
    if (isMongoConnected) {
      try {
        const User = await getUserModel();
        if (User) {
          const user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
              return res.status(401).json({ error: "Invalid credentials" });
            }
            const userObj = user.toObject();
            delete userObj.password;
            const token = generateToken(user._id.toString());
            return res.json({
              message: "Login successful",
              user: userObj,
              token,
            });
          }
        }
      } catch (err) {
        // MongoDB query failed, fallback to JSON
      }
    }

    // Fallback to JSON storage
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id || user._id);

    return res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login", details: err.message });
  }
});

// ====== GET CURRENT USER ======
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// ====== LOGOUT ======
router.post("/logout", authenticate, (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // This endpoint is here for consistency and future server-side token invalidation
  res.json({ message: "Logout successful" });
});

export default router;
