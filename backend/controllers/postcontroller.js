const Post = require("../models/Post");
const Comment = require("../models/Comment");
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
    const { title, description, location, category, images, price, priceRange } = req.body;

    let normalizedPrice = null;
    let normalizedPriceRange = null;

    if (typeof priceRange === 'string' && priceRange.trim().length > 0) {
      normalizedPriceRange = priceRange.trim();
    } else if (Number.isFinite(Number(price)) && Number(price) >= 0) {
      normalizedPrice = Number(price);
    }

    const newPost = new Post({
      title,
      description,
      location,
      category,
      price: normalizedPrice,
      priceRange: normalizedPriceRange,
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

// Helper: recalc rating cho post (dùng khi post data chưa có/0)
async function ensurePostRating(post) {
  const totalReviews = await Comment.countDocuments({ post: post._id, parentComment: null });
  const agg = await Comment.aggregate([
    { $match: { post: post._id, rating: { $ne: null } } },
    { $group: { _id: '$post', avg: { $avg: '$rating' } } },
  ]);

  const avg = agg?.[0]?.avg ?? 0;
  const rounded = totalReviews > 0 ? Math.min(5, Math.max(1, Math.ceil(avg))) : 0;

  if (post.totalReviews !== totalReviews || post.averageRating !== rounded) {
    await Post.findByIdAndUpdate(post._id, {
      totalReviews,
      averageRating: rounded,
    });
  }

  post.totalReviews = totalReviews;
  post.averageRating = rounded;
  return post;
}

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

    // Fix dữ liệu legacy: nếu post đã có review mà rating vẫn 0 => tính lại
    const fixedPosts = await Promise.all(
      posts.map(async (post) => {
        if ((post.totalReviews || 0) > 0 && (!post.averageRating || post.averageRating <= 0)) {
          return await ensurePostRating(post);
        }
        return post;
      })
    );

    res.json(fixedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❤️ LIKE/UNLIKE POST
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const likedIndex = post.likes.findIndex((id) => id.toString() === userId);

    let liked;
    if (likedIndex >= 0) {
      post.likes.splice(likedIndex, 1);
      liked = false;
    } else {
      post.likes.push(userId);
      liked = true;
    }

    await post.save();

    res.json({ 
      message: liked ? "Đã thích" : "Đã bỏ thích",
      liked,
      likesCount: post.likes.length,
      totalReviews: post.totalReviews || 0,
      averageRating: post.averageRating || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ SỬA BÀI
exports.updatePost = async (req, res) => {
  try {
    const { title, description, location, category, images, price, priceRange } = req.body;

    let normalizedPrice = null;
    let normalizedPriceRange = null;

    if (typeof priceRange === 'string' && priceRange.trim().length > 0) {
      normalizedPriceRange = priceRange.trim();
    } else if (Number.isFinite(Number(price)) && Number(price) >= 0) {
      normalizedPrice = Number(price);
    }

    console.log('updatePost body', { title, description, location, category, images, price, priceRange });
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, description, location, category, images, price: normalizedPrice, priceRange: normalizedPriceRange },
      { returnDocument: 'after', runValidators: true }
    );
    console.log('updated post', post);
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