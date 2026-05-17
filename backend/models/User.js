const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true }, // THÊM TRƯỜNG NÀY ĐỂ LƯU TÊN HIỂN THỊ CHÍNH XÁC
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar:   { type: String, default: "" },
    cover:    { type: String, default: "" },
    bio:      { type: String, default: "" },
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
    
    // Hệ thống bạn bè
    friends:        [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    savedPosts:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], 
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);