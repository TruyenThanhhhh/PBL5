const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.post("/conversation", protect, messageController.getOrCreateConversation);
router.post("/", protect, messageController.sendMessage);
router.get("/:conversationId", protect, messageController.getMessages);

module.exports = router;
