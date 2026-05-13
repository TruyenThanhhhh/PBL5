const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar:   String,
    cover:    String,
    bio:      String,
    role: {
      type: String,
      enum: ["user", "viewer", "poster", "admin"],
      default: "viewer",   // mặc định khi đăng ký là viewer
    },
    roleRequestStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    
    // THÊM MỚI: Hệ thống bạn bè
    friends:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách bạn bè chính thức
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Những người ĐÃ GỬI lời mời cho user này
    blockedUsers:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách người dùng bị chặn
    deletedConversations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conversation" }], // Danh sách hội thoại đã xóa (ẩn đi)
    savedPosts:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // Danh sách bài đăng đã lưu
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);