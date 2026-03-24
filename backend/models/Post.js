const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    location:    { type: String, required: true },
    category:    { type: String, required: true },
    // Giá tham khảo (VND), không bắt buộc để tương thích dữ liệu cũ
    price:       { type: Number, default: null, min: 0 },
    images:      [{ type: String }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ✅ thêm mới
    averageRating: { type: Number, default: 0 },
    totalReviews:  { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);