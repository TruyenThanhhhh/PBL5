const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const upload = require("./middleware/upload");

const app = express();

const normalizeRole = (role) => {
  if (typeof role !== "string") return "viewer";
  const r = role.trim().toLowerCase();
  if (r === "user") return "poster";
  return r;
};

// Cấu hình CORS mở cửa cho Frontend (Vite)
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/DB_PBL5fix";
console.log("🌍 Using MONGO_URI:", mongoUri);

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// 🛠️ SỬA LỖI Ở ĐÂY: Viết hoa chữ 'U' cho khớp chuẩn với file models/User.js
const User = require("./models/User"); 

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "123456789");
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ─── Routes ────────────────────────────────────────────────
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { requireAdmin } = require("./middleware/auth");

app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);  
app.use("/api/chat", chatRoutes);

// ─── Profile ───────────────────────────────────────────────
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = normalizeRole(user.role);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/profile", authMiddleware, (req, res, next) => {
  upload.fields([{ name: "avatar", maxCount: 1 }, { name: "cover", maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.error('[API] PUT /api/profile upload error:', err);
      return res.status(400).json({ message: err.message || 'Upload error', error: err });
    }
    next();
  });
}, async (req, res) => {
  console.log("[API] PUT /api/profile", { userId: req.user?.id, body: req.body, files: req.files });
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("[API] PUT /api/profile user not found", { userId: req.user?.id });
      return res.status(404).json({ message: "User not found" });
    }

    const { username, bio } = req.body;
    if (username) user.username = username.trim();
    if (bio) user.bio = bio.trim();

    if (req.files && req.files.avatar && req.files.avatar[0]) {
      user.avatar = req.files.avatar[0].path || req.files.avatar[0].filename || user.avatar;
    }

    if (req.files && req.files.cover && req.files.cover[0]) {
      user.cover = req.files.cover[0].path || req.files.cover[0].filename || user.cover;
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;
    updatedUser.role = normalizeRole(user.role);

    console.log("[API] PUT /api/profile success", { userId: req.user?.id });
    res.json({ message: "Cập nhật profile thành công", user: updatedUser });
  } catch (error) {
    console.error("[API] PUT /api/profile error", error);
    res.status(500).json({ message: error.message, error });
  }
});

// Global error JSON handler
app.use((err, req, res, next) => {
  console.error('[API] Global error handler:', err);
  if (res.headersSent) return next(err);
  const message = err?.message || 'Internal server error';
  res.status(err?.status || 500).json({ message, error: err });
});

// ─── Change Password ───────────────────────────────────────
app.put("/api/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running perfectly on http://localhost:${PORT}`);
});