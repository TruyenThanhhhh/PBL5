const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.get("/conversations", protect, messageController.getConversations);
router.post("/conversation", protect, messageController.getOrCreateConversation);
router.get("/:conversationId", protect, messageController.getMessages);
router.post("/", protect, messageController.sendMessage);

module.exports = router;
