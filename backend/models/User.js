const mongoose = require("mongoose");

const normalizeRole = (role) => {
  if (typeof role !== "string") return "user";
  const r = role.trim().toLowerCase();
  return r === "admin" ? "admin" : "user";
};

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar:   String,
    cover:    String,
    bio:      String,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user", // mặc định khi đăng ký là user
      set: normalizeRole,
    },
    followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  },
  { timestamps: true }
);

userSchema.pre("validate", function (next) {
  this.role = normalizeRole(this.role);
  if (!this.displayName && this.username) {
    this.displayName = this.username;
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
