const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// Nếu bạn có file upload.js trong middleware thì bỏ comment dòng dưới, 
// nếu không có thì comment lại hoặc xóa đi nhé.
const upload = require("../middleware/upload"); 

// ==========================================
// 🚀 AUTH ROUTES (ĐÂY LÀ PHẦN BẠN ĐANG THIẾU)
// ==========================================
// API Đăng ký (Có xử lý file ảnh avatar)
router.post("/register", upload.single("avatar"), userController.registerUser);

// API Đăng nhập (DÒNG NÀY GIẢI QUYẾT LỖI 404 CỦA BẠN)
router.post("/login", userController.loginUser); 
// ==========================================

// Feed cá nhân  →  GET /api/users/feed
router.get("/feed", userController.getFeed);

// Follow / unfollow  →  PUT /api/users/follow/:id
router.put("/follow/:id", userController.toggleFollow);

// Danh sách followers/following  →  GET /api/users/:id/follow-info
router.get("/:id/follow-info", userController.getFollowers);

// Profile + bài đăng  →  GET /api/users/:id/profile
router.get("/:id/profile", userController.getUserProfile);

module.exports = router;