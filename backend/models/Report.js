const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["post", "user"],
      required: true,
    },
    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reason: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

if (mongoose.models.Report) {
  delete mongoose.models.Report;
}
module.exports = mongoose.model("Report", reportSchema);
