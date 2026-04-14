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
      enum: ["user", "admin"],
      default: "user",   // mặc định khi đăng ký là user
    },
    followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);