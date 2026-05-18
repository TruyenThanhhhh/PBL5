const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messageType: {
      type: String,
      enum: ["text", "post", "image"],
      default: "text",
    },
    text: { type: String, default: "" },
    image: { type: String, default: null },
    sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
