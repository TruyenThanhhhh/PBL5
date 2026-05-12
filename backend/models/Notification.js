const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type:     { type: String, enum: ["friend_request", "message", "system"], required: true },
    content:  { type: String, required: true },
    isRead:   { type: Boolean, default: false },
    link:     String, // Đường dẫn để chuyển hướng khi click
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
