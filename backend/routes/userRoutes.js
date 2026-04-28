const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../middleware/upload"); 

// Đảm bảo import đúng middleware auth của bạn
const { protect, requireAdmin } = require("../middleware/auth"); 

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

module.exports = router;