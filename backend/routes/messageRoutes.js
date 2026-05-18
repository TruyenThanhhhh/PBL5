const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/conversations", protect, messageController.getConversations);
router.post("/group", protect, messageController.createGroupConversation);
router.post("/conversation", protect, messageController.getOrCreateConversation);
router.post("/", protect, messageController.sendMessage);
router.get("/:conversationId", protect, messageController.getMessages);
router.delete("/:conversationId", protect, messageController.deleteConversation);
router.put("/:conversationId/seen", protect, messageController.markAsSeen);
router.post("/upload", protect, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.status(200).json({ url: req.file.path });
});

module.exports = router;
