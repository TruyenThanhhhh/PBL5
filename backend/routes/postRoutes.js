const express = require("express");
const router = express.Router();
const postController = require("../controllers/postcontroller.js");
const upload = require("../middleware/upload");
const commentRoutes = require("./commentRoutes");

// Upload ảnh
router.post("/upload-images", upload.array("images", 5), postController.uploadImages);
router.delete("/image", postController.deleteImage);

// Post CRUD
router.post("/", postController.createPost);
router.get("/", postController.getPosts);
router.put("/like/:id", postController.likePost);

// 👇 Mount comment routes — /api/posts/:postId/comments
router.use("/:postId/comments", commentRoutes);

module.exports = router;