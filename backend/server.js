const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const upload = require("./middleware/upload");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const connectedUsers = {};

app.use((req, res, next) => {
  req.io = io;
  req.connectedUsers = connectedUsers;
  next();
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("registerUser", (userId) => {
    if (userId) {
      connectedUsers[userId] = socket.id;
      console.log(`User ${userId} is online (socket: ${socket.id})`);
    }
  });

  socket.on("joinConversation", (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
    }
  });

  socket.on("disconnect", () => {
    Object.keys(connectedUsers).forEach((userId) => {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        console.log(`User ${userId} went offline`);
      }
    });
  });
});

const normalizeRole = (role) => {
  if (typeof role !== "string") return "user";
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin") return "admin";
  return "user";
};

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/DB_PBL5fix";
console.log("Using MONGO_URI:", mongoUri);

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

const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const communityRoutes = require("./routes/communityRoutes");

app.use("/api/posts", postRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/collections", collectionRoutes);

app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    const postsCount = Array.isArray(posts) ? posts.length : 0;
    const followersCount = Array.isArray(user.followers) ? user.followers.length : 0;
    const followingCount = Array.isArray(user.following) ? user.following.length : 0;

    const returnedUser = user.toObject();
    returnedUser.role = normalizeRole(user.role);

    res.json({
      user: returnedUser,
      posts,
      postsCount,
      followersCount,
      followingCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put(
  "/api/profile",
  authMiddleware,
  (req, res, next) => {
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "cover", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error("[API] PUT /api/profile upload error:", err);
        return res.status(400).json({ message: err.message || "Lỗi tải ảnh lên", error: err });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { displayName, username, bio } = req.body;
      const nextDisplayName = displayName || username;
      if (nextDisplayName) user.displayName = nextDisplayName.trim();
      if (bio) user.bio = bio.trim();

      if (req.files?.avatar?.[0]) {
        user.avatar = req.files.avatar[0].path || req.files.avatar[0].filename || user.avatar;
      }

      if (req.files?.cover?.[0]) {
        user.cover = req.files.cover[0].path || req.files.cover[0].filename || user.cover;
      }

      await user.save();

      const updatedUser = user.toObject();
      delete updatedUser.password;
      updatedUser.role = normalizeRole(user.role);

      res.json({ message: "Cập nhật profile thành công", user: updatedUser });
    } catch (error) {
      console.error("[API] PUT /api/profile error", error);
      res.status(500).json({ message: error.message, error });
    }
  }
);

app.use((err, req, res, next) => {
  console.error("[API] Global error handler:", err);
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({
    message: err?.message || "Internal server error",
    error: err,
  });
});

app.put("/api/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected");

    // One-time normalization for legacy role values (poster/viewer/others -> user).
    const roleMigrationResult = await User.updateMany(
      { role: { $nin: ["admin", "user"] } },
      { $set: { role: "user" } }
    );
    if (roleMigrationResult.modifiedCount > 0) {
      console.log(`Normalized ${roleMigrationResult.modifiedCount} legacy user roles to "user".`);
    }

    // Backfill display names for legacy users.
    const usersMissingDisplayName = await User.find({
      $or: [
        { displayName: { $exists: false } },
        { displayName: null },
        { displayName: "" },
      ],
    }).select("_id username");

    if (usersMissingDisplayName.length > 0) {
      const bulkOps = usersMissingDisplayName.map((u) => ({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { displayName: u.username || "" } },
        },
      }));
      await User.bulkWrite(bulkOps);
      console.log(`Backfilled ${usersMissingDisplayName.length} display names from usernames.`);
    }

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

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB Error:", error);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

startServer();
