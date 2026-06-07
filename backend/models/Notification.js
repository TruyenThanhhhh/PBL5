const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type:     { type: String, enum: ["friend_request", "message", "system", "like", "share", "comment", "follow"], required: true },
    content:  { type: String, required: true },
    post:     { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    comment:  { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    isRead:   { type: Boolean, default: false },
    link:     String, // Đường dẫn để chuyển hướng khi click
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
