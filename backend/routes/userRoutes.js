const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// const { protect } = require("../middleware/auth");

// Feed cá nhân  →  GET /api/users/feed
router.get("/feed", userController.getFeed); // thêm protect

// Follow / unfollow  →  PUT /api/users/follow/:id
router.put("/follow/:id", userController.toggleFollow); // thêm protect

// Danh sách followers/following  →  GET /api/users/:id/follow-info
router.get("/:id/follow-info", userController.getFollowers);

// Profile + bài đăng  →  GET /api/users/:id/profile
router.get("/:id/profile", userController.getUserProfile);

module.exports = router;