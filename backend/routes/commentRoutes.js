const express = require("express");
const router  = express.Router({ mergeParams: true });
const commentController = require("../controllers/commentController");
const { protect, optionalAuth, requireOwnerOrAdmin } = require("../middleware/auth");
const Comment = require("../models/Comment");

// Xem comment — ai cũng xem được
router.get("/", optionalAuth, commentController.getComments);

// Thêm comment — phải đăng nhập (viewer cũng comment được)
router.post("/", protect, commentController.addComment);

// Sửa comment — chỉ chủ comment
router.put("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const c = await Comment.findById(req.params.id);
    return c?.author;
  }),
  commentController.updateComment
);

// Xóa comment — chủ comment hoặc admin
router.delete("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const c = await Comment.findById(req.params.id);
    return c?.author;
  }),
  commentController.deleteComment
);

module.exports = router;