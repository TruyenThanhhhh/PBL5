const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../middleware/upload"); 
const { protect } = require("../middleware/auth"); // Tạm bỏ requireAdmin nếu chưa dùng tới để tránh lỗi

// ==========================================
// 🚀 AUTH ROUTES
// ==========================================
router.post("/register", upload.single("avatar"), userController.registerUser);
router.post("/login", userController.loginUser); 

// ==========================================
// 👤 CÁC TÍNH NĂNG CƠ BẢN
// ==========================================
router.get("/feed", protect, userController.getFeed);
router.get("/search", protect, userController.getAllUsers);
router.put("/follow/:id", protect, userController.toggleFollow);
router.get("/:id/follow-info", userController.getFollowers);
router.get("/:id/profile", userController.getUserProfile);

// ==========================================
// 🛠️ FIX LỖI SETTINGS: THÊM ROUTE CẬP NHẬT PROFILE
// ==========================================
// Sử dụng upload.fields để cho phép upload cùng lúc cả avatar và cover
router.put("/:id", protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), userController.updateProfile);

module.exports = router;