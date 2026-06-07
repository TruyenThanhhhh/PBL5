const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { checkHardBan } = require("../utils/moderation");
const { checkContextualToxicity } = require("../utils/contentModerator");

const runAsyncCommentModeration = async (commentDoc, content) => {
  try {
    if (content) {
      const toxicity = await checkContextualToxicity(content);
      if (toxicity.action === "block") {
        console.log(`🚫 Thu hồi bình luận [${commentDoc._id}] vì điểm Toxicity: ${toxicity.score}`);
        await Comment.findByIdAndUpdate(commentDoc._id, { 
          isRevoked: true, 
          content: "Bình luận đã bị thu hồi do vi phạm tiêu chuẩn cộng đồng." 
        });
      }
    }
  } catch (err) {
    console.error("❌ Lỗi luồng AI chạy ngầm kiểm duyệt bình luận:", err.message);
  }
};

// ➕ THÊM COMMENT / REVIEW
exports.addComment = async (req, res) => {
  try {
    const { content, rating, parentComment } = req.body;
    const postId = req.params.postId;

    // --- KIỂM DUYỆT AI: Khi thêm bình luận mới ---
    if (content && content.trim()) {
      if (checkHardBan(content.trim())) {
        return res.status(400).json({ 
          message: "Bình luận của bạn chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." 
        });
      }
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post không tồn tại" });

    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      content,
      rating: parentComment ? null : rating, // reply không cần rating
      parentComment: parentComment || null,
    });

    // Cập nhật averageRating và tổng số comment cho Post nếu là comment gốc
    if (!parentComment) {
      await recalcRating(postId);
    }

    const populated = await comment.populate("author", "username avatar");

    // Gửi thông báo cho chủ bài viết (nếu không phải tự comment bài mình)
    if (post.createdBy && post.createdBy.toString() !== req.user.id) {
      try {
        const { createAndEmitNotification } = require('./notificationController');
        await createAndEmitNotification(req.app.get('io'), null, {
          recipient: post.createdBy,
          sender: req.user.id,
          type: 'comment',
          post: post._id,
          comment: comment._id,
          content: 'đã bình luận về bài viết của bạn.'
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
    }

    res.status(201).json(populated);

    // Chạy AI ngầm cho bình luận
    runAsyncCommentModeration(comment, content.trim());
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

    // --- KIỂM DUYỆT AI: Khi cập nhật bình luận ---
    if (content && content.trim() && content.trim() !== comment.content) {
      if (checkHardBan(content.trim())) {
        return res.status(400).json({ 
          message: "Nội dung bình luận sửa đổi chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." 
        });
      }
    }

    if (content) comment.content = content;
    if (!comment.parentComment && rating !== undefined) comment.rating = rating;
    await comment.save();

    if (!comment.parentComment) {
      await recalcRating(comment.post);
    }

    res.json(comment);

    // Chạy AI ngầm cho bình luận update
    if (content && content.trim()) {
      runAsyncCommentModeration(comment, content.trim());
    }
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

// 🔢 Hàm tính lại averageRating và comment tổng (dùng nội bộ)
async function recalcRating(postId) {
  const result = await Comment.aggregate([
    { $match: { post: postId, rating: { $ne: null } } },
    { $group: { _id: "$post", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const totalCommentResult = await Comment.aggregate([
    { $match: { post: postId, parentComment: null } },
    { $group: { _id: "$post", count: { $sum: 1 } } },
  ]);

  const avg = result[0]?.avg ?? 0;
  const ratingCount = result[0]?.count ?? 0;
  const commentCount = totalCommentResult[0]?.count ?? 0;

  await Post.findByIdAndUpdate(postId, {
    averageRating: Math.round(avg * 10) / 10, // làm tròn 1 chữ số thập phân
    totalReviews: commentCount, // hiển thị số comment gốc
  });
}