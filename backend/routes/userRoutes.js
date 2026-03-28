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
// 🛡️ ROUTES QUẢN LÝ QUYỀN POSTER (Đây là phần bạn đang thiếu)
// ==========================================
// 1. Viewer gửi request xin quyền (Cần token)
router.post("/request-poster", protect, userController.requestPosterRole);

// 2. Admin xem danh sách đang chờ
router.get("/admin/pending-requests", protect, requireAdmin, userController.getPendingRequests);

// 3. Admin duyệt yêu cầu
router.post("/admin/approve-request", protect, requireAdmin, userController.approveRoleRequest);

// ==========================================
// 👤 CÁC TÍNH NĂNG CƠ BẢN
// ==========================================
router.get("/feed", protect, userController.getFeed);
router.put("/follow/:id", protect, userController.toggleFollow);
router.get("/:id/follow-info", userController.getFollowers);
router.get("/:id/profile", userController.getUserProfile);

module.exports = router;