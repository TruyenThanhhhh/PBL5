const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const upload = require("./middleware/upload");

const app = express();
const httpServer = http.createServer(app);

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174"
];

// ─── Socket.io ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Map: userId -> socketId (để track user online)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User thông báo mình đã online với userId
  socket.on("user_online", (userId) => {
    if (userId) {
      onlineUsers.set(String(userId), socket.id);
      console.log(`✅ User ${userId} online (socket: ${socket.id})`);
    }
  });

  // User tham gia room của 1 cuộc trò chuyện
  socket.on("join_room", (conversationId) => {
    socket.join(conversationId);
    console.log(`📥 Socket ${socket.id} joined room: ${conversationId}`);
  });

  // Rời room khi chuyển tab chat
  socket.on("leave_room", (conversationId) => {
    socket.leave(conversationId);
  });

  // Nhận tin nhắn từ client -> lưu DB -> broadcast cho cả room
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, text, senderId, senderName, senderAvatar } = data;
      if (!conversationId || !text || !senderId) return;

      const Message = require("./models/Message");
      const Conversation = require("./models/Conversation");

      // Lưu tin nhắn vào DB
      const message = await Message.create({
        conversationId,
        sender: senderId,
        text
      });

      // Cập nhật lastMessage trong conversation
      await Conversation.findByIdAndUpdate(conversationId, { lastMessage: text });

      // Broadcast tin nhắn tới tất cả user trong room (kể cả người gửi)
      io.to(conversationId).emit("receive_message", {
        _id: message._id,
        conversationId,
        text: message.text,
        image: message.image,
        readBy: message.readBy,
        sender: { _id: senderId, username: senderName, avatar: senderAvatar },
        createdAt: message.createdAt
      });

    } catch (error) {
      console.error("❌ Socket send_message error:", error.message);
      socket.emit("message_error", { error: error.message });
    }
  });

  // Sự kiện khi người dùng đã xem tin nhắn
  socket.on("mark_as_seen", ({ conversationId, userId }) => {
    io.to(conversationId).emit("message_seen", { conversationId, userId });
  });

  // Typing indicator
  socket.on("typing", ({ conversationId, userId, username }) => {
    socket.to(conversationId).emit("user_typing", { userId, username });
  });

  socket.on("stop_typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("user_stop_typing", { userId });
  });

  // Ngắt kết nối
  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User ${userId} offline`);
        break;
      }
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// ─── Express Middlewares ───────────────────────────────────
const normalizeRole = (role) => {
  if (typeof role !== "string") return "viewer";
  const r = role.trim().toLowerCase();
  if (r === "user") return "poster";
  return r;
};

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
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

// 🛠️ Models
const User = require("./models/User"); 
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running perfectly on http://localhost:${PORT}`);
    console.log(`⚡ Socket.io is active and listening`);
  });
}

startServer();
