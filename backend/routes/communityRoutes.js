const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const { protect, requireNonAdmin } = require("../middleware/auth");

router.get("/mine", protect, communityController.listMyCommunities);
router.get("/", communityController.listCommunities);
router.post("/", protect, requireNonAdmin, communityController.createCommunity);

router.post("/:id/pending/:userId/approve", protect, communityController.approvePendingMember);
router.delete("/:id/pending/:userId", protect, communityController.rejectPendingMember);
router.delete("/:id/members/:userId", protect, communityController.kickMember);

router.get("/:id/posts", protect, communityController.getCommunityPosts);
router.post("/:id/join", protect, communityController.joinCommunity);
router.get("/:id", protect, communityController.getCommunity);

module.exports = router;