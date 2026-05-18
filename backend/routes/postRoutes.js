const express = require("express");
const router  = express.Router();
const postController = require("../controllers/postcontroller");
const upload  = require("../middleware/upload");
const uploadLocal = require("../middleware/uploadLocal");
const { protect, optionalAuth, requirePoster, requireAdmin, requireOwnerOrAdmin } = require("../middleware/auth");
const Post    = require("../models/Post");
const commentRoutes = require("./commentRoutes");

// 🖼️ Upload ảnh cloudinary
router.post("/upload-images", protect, (req, res) => {
  upload.array("images", 5)(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload cloudinary thất bại" });
    return postController.uploadImages(req, res);
  });
});

// 🧰 Fallback upload local
router.post("/upload-images-local", protect, (req, res) => {
  uploadLocal.array("images", 5)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload local thất bại" });
    const host = `${req.protocol}://${req.get("host")}`;
    const urls = Array.isArray(req.files)
      ? req.files.map((file) => `${host}/uploads/${file.filename}`)
      : [];
    res.json({ urls });
  });
});

// 🗑️ Xóa ảnh
router.delete("/image", protect, postController.deleteImage);

// 📝 Tạo bài 
router.post("/", protect, postController.createPost);
router.post("/create-with-media", protect, (req, res) => {
  uploadLocal.array("images", 5)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Tải ảnh thất bại" });
    return postController.createPostWithMedia(req, res);
  });
});

// ♻️ THÊM MỚI: Chia sẻ bài viết (Bắt buộc đăng nhập)
router.post("/:id/share", protect, postController.sharePost);

// 🔥 Lấy danh sách bài viết thịnh hành 
router.get("/trending", postController.getTrendingPosts);

// 🗺️ Khám phá Map
router.get("/explore", protect, postController.getExplorePosts);

// 📄 Xem bài
router.get("/", optionalAuth, postController.getPosts);

// ✏️ Sửa bài 
router.put("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.createdBy;
  }),
  postController.updatePost
);

// 🗑️ Xóa bài
router.delete("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.createdBy;
  }),
  postController.deletePost
);

// 👁️ ẨN/hiện bài 
router.patch("/:id/toggle-visibility", protect, requireAdmin, postController.toggleVisibility);

// Chia sẻ bài từ nhóm lên trang cá nhân (khác với share post của người khác)
router.patch(
  "/:id/publish-profile",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.createdBy;
  }),
  postController.publishPostToProfile
);

// ❤️ Like 
router.put("/like/:id", protect, postController.likePost);

// 💬 Comments
router.use("/:postId/comments", commentRoutes);

module.exports = router;