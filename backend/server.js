const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

// Normalize role values coming from client/DB to keep consistent comparisons.
const normalizeRole = (role) => {
  if (typeof role !== "string") return "viewer";
  const r = role.trim().toLowerCase();
  // Backward compatibility: legacy role "user" in this project maps to "poster".
  if (r === "user") return "poster";
  return r;
};

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/DB_PBL5fix";
console.log("🌍 Using MONGO_URI:", mongoUri);

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const User = require("./models/user"); // ✅ đúng tên file

// ─── Auth Middleware (dùng nội bộ trong server.js) ─────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ─── Routes ────────────────────────────────────────────────
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const { requireAdmin } = require("./middleware/auth"); // ✅ chỉ import những gì cần

app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// ─── Register ──────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  try {
    
    const { username, email, password, confirmPassword, role } = req.body;

    console.log("📝 Register request:", { username, email, role }); // ✅ debug

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email đã được sử dụng" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const allowedRoles = ["viewer", "poster"];
    const normalizedRole = normalizeRole(role);
    const assignedRole = allowedRoles.includes(normalizedRole) ? normalizedRole : "viewer";

    console.log("✅ Assigned role:", assignedRole); // ✅ debug

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: assignedRole,
    });
    console.log("RAW BODY:", JSON.stringify(req.body));

    console.log("✅ User created:", { id: newUser._id, role: newUser.role }); // ✅ debug

    res.status(201).json({ message: "Đăng ký thành công", userId: newUser._id, role: assignedRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Login ─────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // ✅ token có đủ id + role
    const normalizedRole = normalizeRole(user.role);
    const token = jwt.sign(
      { id: user._id, role: normalizedRole },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Profile ───────────────────────────────────────────────
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    // Ensure returned role is consistent for the frontend.
    user.role = normalizeRole(user.role);
    res.json(user); // ✅ trả về đủ username, email, role
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// ─── Admin: lấy tất cả users ───────────────────────────────
app.get("/api/admin/users", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    // Normalize role for legacy records so Admin UI stays consistent.
    users.forEach((u) => {
      u.role = normalizeRole(u.role);
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin: đổi role user ──────────────────────────────────
app.put("/api/admin/users/:id/role", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const normalizedRole = normalizeRole(role);
    if (!["viewer", "poster", "admin"].includes(normalizedRole))
      return res.status(400).json({ message: "Role không hợp lệ" });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: normalizedRole },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    res.json({ message: `Đã đổi role thành ${normalizedRole}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Start ─────────────────────────────────────────────────
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});