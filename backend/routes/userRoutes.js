const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("../middleware/upload"); 
const { protect, requireAdmin } = require("../middleware/auth"); 

// ==========================================
// 🚀 AUTH ROUTES
// ==========================================
router.post("/register", upload.single("avatar"), userController.registerUser);
router.post("/login", userController.loginUser); 

// ==========================================
// 🛡️ ROUTES QUẢN LÝ QUYỀN POSTER 
// ==========================================
router.post("/request-poster", protect, userController.requestPosterRole);
router.get("/admin/pending-requests", protect, requireAdmin, userController.getPendingRequests);
router.post("/admin/approve-request", protect, requireAdmin, userController.approveRoleRequest);

// ==========================================
// 🤝 ROUTES KẾT BẠN (FRIENDSHIP)
// ==========================================
router.post("/friend-request/:id", protect, userController.sendFriendRequest); // Gửi hoặc hủy lời mời
router.post("/accept-friend/:id", protect, userController.acceptFriendRequest); // Chấp nhận lời mời
router.delete("/unfriend/:id", protect, userController.unfriend); // Xóa bạn hoặc từ chối lời mời

// ==========================================
// 👤 CÁC TÍNH NĂNG CƠ BẢN
// ==========================================
router.get("/profile", protect, userController.getProfile);
router.put("/change-password", protect, userController.changePassword);
router.get("/feed", protect, userController.getFeed);
router.get("/search", protect, userController.searchUsers);
router.put("/update-profile", protect, upload.fields([{ name: "avatar", maxCount: 1 }, { name: "cover", maxCount: 1 }]), userController.updateProfile);
router.put("/follow/:id", protect, userController.toggleFollow);
router.get("/:id/follow-info", userController.getFollowers);
router.get("/:id/profile", protect, userController.getUserProfile); // Thêm middleware protect để biết user đăng nhập là ai

module.exports = router;