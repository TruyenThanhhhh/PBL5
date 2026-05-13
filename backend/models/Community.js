const mongoose = require("mongoose");
const { normalizeCommunityKey } = require("../utils/communityName");

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Khóa so trùng tên — đồng bộ với name trong pre-save */
    nameKey: { type: String, index: true },
    description: { type: String, default: "" },
    cover: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    /** Yêu cầu tham gia — chờ chủ cộng đồng duyệt */
    pendingMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

communitySchema.pre("save", function (next) {
  if (this.name) {
    this.nameKey = normalizeCommunityKey(this.name);
  }
  next();
});

module.exports =
  mongoose.models.Community || mongoose.model("Community", communitySchema);