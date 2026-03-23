const Comment = require("../models/Comment");
const Post = require("../models/Post");

// ➕ THÊM COMMENT / REVIEW
exports.addComment = async (req, res) => {
  try {
    const { content, rating, parentComment } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });

    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      content,
      rating: parentComment ? null : rating, // reply không cần rating
      parentComment: parentComment || null,
    });

    // Cập nhật averageRating trên Post nếu có rating
    if (!parentComment && rating) {
      await recalcRating(postId);
    }

    const populated = await comment.populate("author", "username avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 LẤY COMMENTS CỦA 1 POST (có replies lồng nhau)
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Lấy comment gốc (không phải reply)
    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Lấy replies cho từng comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate("author", "username avatar")
          .sort({ createdAt: 1 }); // reply cũ nhất lên trước
        return { ...comment.toObject(), replies };
      })
    );

    const total = await Comment.countDocuments({ post: postId, parentComment: null });

    res.json({
      comments: commentsWithReplies,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ SỬA COMMENT
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment không tồn tại" });
    if (comment.author.toString() !== req.user.id)
      return res.status(403).json({ message: "Không có quyền sửa" });

    const { content, rating } = req.body;
    if (content) comment.content = content;
    if (rating && !comment.parentComment) comment.rating = rating;
    await comment.save();

    if (rating && !comment.parentComment) {
      await recalcRating(comment.post);
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ XÓA COMMENT
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment không tồn tại" });
    if (comment.author.toString() !== req.user.id)
      return res.status(403).json({ message: "Không có quyền xóa" });

    // Xóa luôn các replies con
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    if (!comment.parentComment) await recalcRating(comment.post);

    res.json({ message: "Đã xóa comment" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔢 Hàm tính lại averageRating (dùng nội bộ)
async function recalcRating(postId) {
  const result = await Comment.aggregate([
    { $match: { post: postId, rating: { $ne: null } } },
    { $group: { _id: "$post", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg   = result[0]?.avg   ?? 0;
  const count = result[0]?.count ?? 0;

  await Post.findByIdAndUpdate(postId, {
    averageRating: Math.round(avg * 10) / 10, // làm tròn 1 chữ số thập phân
    totalReviews: count,
  });
}