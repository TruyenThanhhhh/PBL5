const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams để lấy postId từ parent route
const commentController = require("../controllers/commentController");
// const { protect } = require("../middleware/auth");

// Lấy comments của 1 post  →  GET /api/posts/:postId/comments
router.get("/", commentController.getComments);

// Thêm comment  →  POST /api/posts/:postId/comments
router.post("/", commentController.addComment); // thêm protect nếu cần auth

// Sửa / xóa comment  →  PUT|DELETE /api/posts/:postId/comments/:id
router.put("/:id",    commentController.updateComment);
router.delete("/:id", commentController.deleteComment);

module.exports = router;