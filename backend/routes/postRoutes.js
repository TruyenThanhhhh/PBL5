const express = require("express");
const router  = express.Router();
const postController = require("../controllers/postcontroller");
const upload  = require("../middleware/upload");
const { protect, optionalAuth, requirePoster, requireAdmin, requireOwnerOrAdmin } = require("../middleware/auth");
const Post    = require("../models/Post");
const commentRoutes = require("./commentRoutes");

// Upload ảnh — chỉ poster/admin
router.post("/upload-images",
  protect, requirePoster,
  upload.array("images", 5),
  postController.uploadImages
);

// Xóa ảnh — chỉ poster/admin
router.delete("/image", protect, requirePoster, postController.deleteImage);

// Tạo bài — chỉ poster/admin
router.post("/", protect, requirePoster, postController.createPost);

// Xem bài — ai cũng xem được, nếu login thì biết user là ai
router.get("/", optionalAuth, postController.getPosts);

// Sửa bài — chủ bài hoặc admin
router.put("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.createdBy;
  }),
  postController.updatePost
);

// Xóa bài — chủ bài hoặc admin
router.delete("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.createdBy;
  }),
  postController.deletePost
);

// Ẩn/hiện bài — chỉ admin
router.patch("/:id/toggle-visibility", protect, requireAdmin, postController.toggleVisibility);

// Like — phải đăng nhập (viewer cũng like được)
router.put("/like/:id", protect, postController.likePost);

// Comments
router.use("/:postId/comments", commentRoutes);

module.exports = router;