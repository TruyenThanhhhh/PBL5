const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    location:    { type: String, required: true },
    category:    { type: String, required: true },
    images:      [{ type: String }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ✅ thêm mới
    averageRating: { type: Number, default: 0 },
    totalReviews:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);