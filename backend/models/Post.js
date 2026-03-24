const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    location:    { type: String, required: true },
    category:    { type: String, required: true },
    // Giá tham khảo (số hoặc khoảng giá dạng chuỗi, ví dụ: "200.000-500.000 VND" hoặc "10-25 USD")
    price:       { type: Number, default: null, min: 0 },
    priceRange:  { type: String, default: null },
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