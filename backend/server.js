const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const upload = require("./middleware/upload");

// --- TÍCH HỢP SOCKET.IO ---
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // Bọc Express bằng HTTP Server

const normalizeRole = (role) => {
  if (typeof role !== "string") return "viewer";
  const r = role.trim().toLowerCase();
  if (r === "user") return "poster";
  return r;
};

// Cấu hình CORS mở cửa cho Frontend (Vite)
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"], 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// Khởi tạo Socket.io với cấu hình CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    methods: ["GET", "POST"]
  }
});

// Lưu trữ io instance vào app để có thể gọi từ controllers
app.set("io", io);

// Lắng nghe các kết nối Socket realtime
io.on("connection", (socket) => {
  console.log("🟢 1 Client đã kết nối Socket:", socket.id);

  // User join vào room cá nhân (ID của user) để nhận tin nhắn 1-1
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // User join vào room của Group chat (ID của group)
  socket.on("join_group", (groupId) => {
    socket.join(groupId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client đã ngắt kết nối:", socket.id);
  });
});
// ----------------------------

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/DB_PBL5fix";
console.log("🌍 Using MONGO_URI:", mongoUri);

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// 🛠️ Models
const User = require("./models/User"); 
const Post = require("./models/Post");
const Community = require("./models/Community");
const { normalizeCommunityKey } = require("./utils/communityName");

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
const postRoutes         = require("./routes/postRoutes");
const userRoutes         = require("./routes/userRoutes");
const commentRoutes      = require("./routes/commentRoutes");
const chatRoutes         = require("./routes/chatRoutes");
const messageRoutes      = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const communityRoutes    = require("./routes/communityRoutes");

app.use("/api/posts",         postRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/comments",      commentRoutes);
app.use("/api/chat",          chatRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/communities",   communityRoutes);

// Global error JSON handler
app.use((err, req, res, next) => {
  console.error('[API] Global error handler:', err);
  if (res.headersSent) return next(err);
  const message = err?.message || 'Internal server error';
  res.status(err?.status || 500).json({ message, error: err });
});

// ─── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const needCommKey = await Community.find({
      $or: [{ nameKey: { $exists: false } }, { nameKey: null }, { nameKey: "" }],
    }).select("_id name");

    if (needCommKey.length > 0) {
      for (const c of needCommKey) {
        await Community.updateOne(
          { _id: c._id },
          { $set: { nameKey: normalizeCommunityKey(c.name) } }
        );
      }
      console.log(`Backfilled nameKey for ${needCommKey.length} communities.`);
    }
  } catch (error) {
    console.error("Error during backfilling: ", error);
  }

  // THAY ĐỔI: Sử dụng server.listen thay vì app.listen để chạy cả HTTP và WebSockets
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server + WebSockets running perfectly on http://localhost:${PORT}`);
  });
}

startServer();