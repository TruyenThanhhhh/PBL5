const Post = require("../models/Post");
const Community = require("../models/Community");
const { cloudinary } = require("../config/cloudinary");

const normalizeRole = (role) => {
  if (typeof role !== "string") return "user";
  const r = role.trim().toLowerCase();
  return r === "admin" ? "admin" : "user";
};

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được tải lên" });
    }
    const urls = req.files.map((file) => file.path);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// postController.js (Cập nhật hàm createPost)
exports.createPost = async (req, res) => {
  try {
    const { title, description, location, category, images, price, lat, lng, postType } = req.body;

    const normalizedPrice =
      Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "admin") {
        finalPostType = "promotional";
      }
    }

    const newPost = new Post({
      title: title || "Cập nhật mới",
      description,
      location: location || "Chưa rõ vị trí",
      category: category || "General",
      price: normalizedPrice,
      images: images || [],
      lat: lat || null,
      lng: lng || null,
      postType: finalPostType,
      createdBy: req.user?.id || null,
      publishedToProfile: true,
    });

    const cid = req.body.communityId;
    if (cid && String(cid).trim()) {
      const comm = await Community.findById(String(cid).trim());
      if (!comm) return res.status(400).json({ message: "Cộng đồng không tồn tại" });
      const uid = String(req.user.id);
      const isMember =
        String(comm.createdBy) === uid ||
        (comm.members || []).some((m) => String(m) === uid);
      if (!isMember) return res.status(403).json({ message: "Bạn chưa tham gia cộng đồng này" });
      newPost.community = comm._id;
      newPost.publishedToProfile =
        String(req.body.publishedToProfile || "").toLowerCase() === "true";
    }

    await newPost.save();

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPostWithMedia = async (req, res) => {
  try {
    const { title, description, location, category, price, lat, lng, postType, communityId, publishedToProfile } =
      req.body;

    const normalizedPrice =
      Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    const parsedLat = lat !== undefined && lat !== '' && Number.isFinite(Number(lat)) ? Number(lat) : null;
    const parsedLng = lng !== undefined && lng !== '' && Number.isFinite(Number(lng)) ? Number(lng) : null;

    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "admin") {
        finalPostType = "promotional";
      }
    }

    const host = `${req.protocol}://${req.get("host")}`;
    const uploadedUrls = Array.isArray(req.files)
      ? req.files.map((file) => `${host}/uploads/${file.filename}`)
      : [];

    const finalDescription =
      typeof description === "string" && description.trim() !== "" ? description : "\u200B";

    const newPost = new Post({
      title: title || "Cập nhật mới",
      description: finalDescription,
      location: location || "Chưa rõ vị trí",
      category: category || "General",
      price: normalizedPrice,
      images: uploadedUrls,
      lat: parsedLat,
      lng: parsedLng,
      postType: finalPostType,
      createdBy: req.user?.id || null,
      publishedToProfile: true,
    });

    if (communityId && String(communityId).trim()) {
      const comm = await Community.findById(String(communityId).trim());
      if (!comm) return res.status(400).json({ message: "Cộng đồng không tồn tại" });
      const uid = String(req.user.id);
      const isMember =
        String(comm.createdBy) === uid ||
        (comm.members || []).some((m) => String(m) === uid);
      if (!isMember) return res.status(403).json({ message: "Bạn chưa tham gia cộng đồng này" });
      newPost.community = comm._id;
      newPost.publishedToProfile =
        String(publishedToProfile || "").toLowerCase() === "true";
    }

    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body; 
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Xóa ảnh thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { location, category } = req.query;
    let filter = {};

    if (location) filter.location = location;
    if (category) filter.category = category;
    const isAdmin = normalizeRole(req.user?.role) === "admin";
    if (!isAdmin) {
      filter.isHidden = false;
      filter.$or = [
        { publishedToProfile: true },
        { community: null },
        { community: { $exists: false } },
      ];
    }

    const posts = await Post.find(filter)
      // ✅ ĐÃ SỬA: Trả thêm role để Frontend biết ai là Admin, ai là User
      .populate("createdBy", "username displayName email avatar role")
      .populate("community", "name")
      .sort({ createdAt: -1 });

    const normalizedPosts = posts.map((post) => {
      const obj = post.toObject ? post.toObject() : post;
      if (obj?.createdBy?.role) {
        const r = String(obj.createdBy.role || "").trim().toLowerCase();
        obj.createdBy.role = r === "admin" ? "admin" : "user";
      } else if (obj?.createdBy) {
        obj.createdBy.role = "user";
      }
      return obj;
    });

    res.json(normalizedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.some(
      (userId) => userId.toString() === req.user.id
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user.id
      );
      await post.save();
      return res.json({ message: 'Post unliked successfully', liked: false });
    }

    post.likes.push(req.user.id);
    await post.save();

    // Gử thông báo Like real-time
    try {
      const { createAndEmitNotification } = require('./notificationController');
      await createAndEmitNotification(req.io, req.connectedUsers, {
        recipient: post.createdBy,
        sender: req.user.id,
        type: 'like',
        post: post._id,
        content: 'đã thích bài viết của bạn.'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    res.json({ message: 'Post liked successfully', liked: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa bài" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.publishPostToProfile = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài" });
    if (!post.community) {
      return res.status(400).json({ message: "Bài này không thuộc cộng đồng" });
    }
    post.publishedToProfile = true;
    await post.save();
    const obj = post.toObject();
    res.json({ message: "Đã chia sẻ bài lên trang cá nhân", post: obj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

// 🔥 LẤY TRENDING KEYWORDS TỪ COMMENTS & POSTS (7 NGÀY GẦN NHẤT)
exports.getTrendingKeywords = async (req, res) => {
  try {
    const Comment = require("../models/Comment");
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Lấy tất cả comments trong 7 ngày gần nhất
    const comments = await Comment.find({ createdAt: { $gte: oneWeekAgo } })
      .select("content")
      .lean();

    // Lấy tất cả posts trong 7 ngày gần nhất
    const posts = await Post.find({ createdAt: { $gte: oneWeekAgo } })
      .select("title description")
      .lean();

    // Gộp tất cả text
    const allText = [
      ...comments.map(c => c.content || ""),
      ...posts.map(p => `${p.title} ${p.description}`),
    ].join(" ");

    // Tách từ khóa: loại bỏ từ thường dùng, chỉ lấy từ có độ dài > 3
    const keywords = allText
      .toLowerCase()
      .match(/\b[a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]{4,}\b/g) || [];

    // Lọc những từ thường dùng không quan trọng
    const stopwords = new Set([
      "được", "là", "để", "có", "không", "của", "và", "với", "từ", "vào", "bạn",
      "trong", "này", "một", "nên", "chúng", "bài", "viết", "post", "điều", "những",
      "cách", "khi", "đó", "sẽ", "được", "thì", "cũng", "nhưng", "nếu", "trước",
      "sau", "đến", "tại", "qua", "vì", "thành", "việc", "khác", "chỉ", "chiều"
    ]);

    const filteredKeywords = keywords.filter(word => 
      word.length > 3 && !stopwords.has(word)
    );

    // Đếm tần suất
    const keywordCount = {};
    filteredKeywords.forEach(keyword => {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    });

    // Sắp xếp theo tần suất và lấy top 10
    const trending = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({
        keyword,
        count,
        category: categorizeKeyword(keyword)
      }));

    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hàm phân loại từ khóa theo chủ đề
function categorizeKeyword(keyword) {
  const categories = {
    adventure: ["du", "lịch", "phiêu", "lưu", "khám", "phá", "leo", "núi", "hike", "trek"],
    luxury: ["sang", "trọng", "cao", "cấp", "vip", "riêng", "tư", "resort", "spa"],
    beach: ["biển", "cát", "sóng", "bãi", "bể", "bơi", "nước", "ocean", "sea"],
    culture: ["văn", "hóa", "truyền", "thống", "lịch", "sử", "nghệ", "thuật", "bảo"],
    food: ["ăn", "uống", "đặc", "sản", "quán", "nhà", "hàng", "cơm", "phở", "food"],
    nature: ["thiên", "nhiên", "rừng", "cây", "cảnh", "đẹp", "sắc", "xanh", "vườn"],
  };

  for (const [category, words] of Object.entries(categories)) {
    if (words.some(word => keyword.includes(word))) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  return "Travel";
}