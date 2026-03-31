const express = require("express");
const router  = express.Router();
const postController = require("../controllers/postcontroller");
const upload  = require("../middleware/upload");
const uploadLocal = require("../middleware/uploadLocal");
const { protect, optionalAuth, requirePoster, requireAdmin, requireOwnerOrAdmin } = require("../middleware/auth");
const Post    = require("../models/Post");
const commentRoutes = require("./commentRoutes");

// 🖼️ Upload ảnh cloudinary — trả lỗi JSON rõ ràng
router.post("/upload-images", protect, (req, res) => {
  upload.array("images", 5)(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload cloudinary thất bại" });
    return postController.uploadImages(req, res);
  });
});

// 🧰 Fallback upload local khi Cloudinary lỗi
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

// 🗑️ Xóa ảnh — TẤT CẢ user đã đăng nhập đều được xóa ảnh của họ
router.delete("/image", protect, postController.deleteImage);

// 📝 Tạo bài — TẤT CẢ user đã đăng nhập đều được đăng bài
router.post("/", protect, postController.createPost);
router.post("/create-with-media", protect, (req, res) => {
  uploadLocal.array("images", 5)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Tải ảnh thất bại" });
    return postController.createPostWithMedia(req, res);
  });
});

// 📄 Xem bài — ai cũng xem được, nếu login thì biết user là ai
router.get("/", optionalAuth, postController.getPosts);

// ✏️ Sửa bài — chủ bài hoặc admin
router.put("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.createdBy;
  }),
  postController.updatePost
);

// 🗑️ Xóa bài — chủ bài hoặc admin
router.delete("/:id",
  protect,
  requireOwnerOrAdmin(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.createdBy;
  }),
  postController.deletePost
);

// 👁️ ẨN/hiện bài — chỉ admin
router.patch("/:id/toggle-visibility", protect, requireAdmin, postController.toggleVisibility);

// ❤️ Like — phải đăng nhập (viewer cũng like được)
router.put("/like/:id", protect, postController.likePost);

// 💬 Comments
router.use("/:postId/comments", commentRoutes);

module.exports = router;