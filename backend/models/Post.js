const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, required: true },
    location:    { type: String, required: true },
    category:    { type: String, required: true },
    price:       { type: Number, default: null, min: 0 },
    images:      [{ type: String }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    averageRating: { type: Number, default: 0 },
    totalReviews:  { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },

    location: {type: String, require: true},
    lat: {type: Number},
    lng: {type: Number}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);