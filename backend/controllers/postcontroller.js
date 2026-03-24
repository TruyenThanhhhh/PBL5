const Post = require("../models/Post");
const { cloudinary } = require("../config/cloudinary");

// 🖼️ UPLOAD IMAGES (dùng riêng hoặc gọi trước createPost)
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }

    const urls = req.files.map((file) => file.path); // Cloudinary trả về URL trong file.path
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📝 CREATE POST (giờ nhận images là mảng URL từ Cloudinary)
exports.createPost = async (req, res) => {
  try {
    const { title, description, location, category, images, price } = req.body;
    const normalizedPrice = Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;

    const newPost = new Post({
      title,
      description,
      location,
      category,
      price: normalizedPrice,
      images: images || [], // mảng URL string
      createdBy: req.user?.id || null,
    });

    await newPost.save();

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ DELETE IMAGE khỏi Cloudinary (optional nhưng nên có)
exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body; // ví dụ: "travel-app/posts/abc123"
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Xóa ảnh thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 GET POSTS + FILTER (giữ nguyên)
exports.getPosts = async (req, res) => {
  try {
    const { location, category } = req.query;

    let filter = {};

    if (location) filter.location = location;
    if (category) filter.category = category;

    // ✅ Thêm vào đây
    if (req.user?.role !== "admin") filter.isHidden = false;

    const posts = await Post.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❤️ LIKE POST (giữ nguyên)
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some(
      (userId) => userId.toString() === req.user.id
    );
    if (alreadyLiked) return res.status(400).json({ message: "Already liked" });

    post.likes.push(req.user.id);
    await post.save();
    res.json({ message: "Post liked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ SỬA BÀI
exports.updatePost = async (req, res) => {
  try {
    const { title, description, location, category, images, price } = req.body;
    const normalizedPrice = Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, description, location, category, images, price: normalizedPrice },
      { new: true, runValidators: true }
    );
    res.json({ message: "Cập nhật thành công", post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ XÓA BÀI
exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa bài" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👁️ ẨN / HIỆN BÀI (admin only)
exports.toggleVisibility = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài" });
    post.isHidden = !post.isHidden;
    await post.save();
    res.json({ message: post.isHidden ? "Đã ẩn bài" : "Đã hiện bài", isHidden: post.isHidden });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};