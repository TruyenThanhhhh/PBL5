const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar:   String,
    bio:      String,
    role: {
      type: String,
      enum: ["viewer", "poster", "admin"],
      default: "viewer",   // mặc định khi đăng ký là viewer
    },
    followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);