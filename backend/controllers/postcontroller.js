const Post = require("../models/Post");
const Community = require("../models/Community");
const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");

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

const analyzeImageWithGroq = async (filePath) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log("⚠️ AI_DEBUG: Thiếu biến GROQ_API_KEY trong file .env");
      return null;
    }

    console.log("🚀 AI_DEBUG: Bắt đầu gửi ảnh sang Groq Vision AI (meta-llama/llama-4-scout-17b-16e-instruct)...");
    
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    let mimeType = "image/jpeg";
    if (filePath.endsWith('.png')) mimeType = "image/png";
    if (filePath.endsWith('.webp')) mimeType = "image/webp";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Bạn là một AI phân loại hình ảnh. Hãy phân loại bức ảnh này vào CHÍNH XÁC MỘT TRONG CÁC TỪ KHÓA SAU: 'Ẩm thực', 'Biển đảo', 'Núi rừng', 'Văn hóa / Kiến trúc', 'Thành phố', 'Thú cưng', 'Góc làm việc', 'Đời thường'. Trả về duy nhất 1 từ khóa đó, không giải thích thêm." 
              },
              { 
                type: "image_url", 
                image_url: { url: `data:${mimeType};base64,${base64Image}` } 
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 20
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ AI_DEBUG: Lỗi gọi API Groq (Status: ${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    let category = data.choices[0]?.message?.content?.trim();
    console.log("🧠 AI_DEBUG: Groq Vision phân loại bức ảnh là:", category);

    const validCategories = ["Ẩm thực", "Biển đảo", "Núi rừng", "Văn hóa / Kiến trúc", "Thành phố", "Thú cưng", "Góc làm việc", "Đời thường"];
    
    for (const validCat of validCategories) {
      if (category.toLowerCase().includes(validCat.toLowerCase())) {
        console.log(`🏷️ AI_DEBUG: AI đã chốt thẻ [${validCat}] từ hình ảnh.`);
        return validCat;
      }
    }

    console.log("⚠️ AI_DEBUG: AI trả lời từ khóa không nằm trong danh sách.");
    return null; 
  } catch (error) {
    console.log("❌ Lỗi AI Groq Vision (Exception):", error.message);
    return null; 
  }
};

const autoCategorizeFromText = (text) => {
  if (!text || text.trim() === "") return null;
  const lowerText = text.toLowerCase();

  if (lowerText.match(/ăn|uống|ngon|nhà hàng|quán|cafe|cà phê|trà sữa|món|bánh|phở|bún|cơm/)) return "Ẩm thực";
  if (lowerText.match(/biển|đảo|cát|sóng|hải sản|bơi|tắm|vịnh|san hô/)) return "Biển đảo";
  if (lowerText.match(/núi|rừng|đèo|suối|thác|cây|cắm trại|trekking|đỉnh/)) return "Núi rừng";
  if (lowerText.match(/chùa|đền|di tích|lịch sử|bảo tàng|cổ|kiến trúc|nhà thờ/)) return "Văn hóa / Kiến trúc";
  if (lowerText.match(/thành phố|đường phố|cầu|xe cộ|tòa nhà|check-in|sôi động/)) return "Thành phố";
  if (lowerText.match(/chó|mèo|thú cưng|pet/)) return "Thú cưng";

  return null; 
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

    let finalCategory = category || "General";
    
    if (finalCategory === "General" || finalCategory === "Chung") {
      let imageAiCategory = null;
      if (Array.isArray(req.files) && req.files.length > 0) {
        const firstImagePath = req.files[0].path;
        imageAiCategory = await analyzeImageWithGroq(firstImagePath);
      }
      
      if (imageAiCategory) {
        finalCategory = imageAiCategory;
      } else {
        const textCat = autoCategorizeFromText(finalDescription);
        if (textCat) {
          finalCategory = textCat;
          console.log(`🏷️ AI_DEBUG: AI ảnh lỗi, chuyển sang gán thẻ theo chữ: [${finalCategory}]`);
        }
      }
    }

    const newPost = new Post({
      title: title || "Cập nhật mới",
      description: finalDescription,
      location: location || "Chưa rõ vị trí",
      category: finalCategory,
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
      .populate({
        path: "sharedPost",
        populate: { path: "createdBy", select: "username displayName avatar role" }
      })
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

exports.sharePostToProfile = async (req, res) => {
  try {
    const originalPostId = req.params.id;
    const myId = req.user.id;

    const originalPost = await Post.findById(originalPostId);
    if (!originalPost) {
      return res.status(404).json({ message: "Không tìm thấy bài viết gốc" });
    }

    const sharedPost = new Post({
      title: originalPost.title || "Bài viết chia sẻ",
      description: req.body.description || "Đã chia sẻ một bài viết",
      location: originalPost.location || "Chưa rõ vị trí",
      category: originalPost.category || "General",
      price: originalPost.price,
      images: originalPost.images || [],
      lat: originalPost.lat,
      lng: originalPost.lng,
      postType: "regular",
      createdBy: myId,
      publishedToProfile: true,
      sharedPost: originalPost._id,
    });

    await sharedPost.save();

    try {
      const { createAndEmitNotification } = require("./notificationController");
      if (String(originalPost.createdBy) !== String(myId)) {
        await createAndEmitNotification(req.io, req.connectedUsers, {
          recipient: originalPost.createdBy,
          sender: myId,
          type: "share",
          post: sharedPost._id,
          content: "đã chia sẻ bài viết của bạn.",
        });
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr.message);
    }

    res.status(201).json({ message: "Chia sẻ bài viết lên trang cá nhân thành công", post: sharedPost });
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

/** Bài thịnh hành: cùng điều kiện hiển thị với bảng tin, sắp xếp theo số lượt thích */
exports.getTrendingPosts = async (req, res) => {
  try {
    const isAdmin = normalizeRole(req.user?.role) === "admin";
    const filter = {};
    if (!isAdmin) {
      filter.isHidden = false;
      filter.$or = [
        { publishedToProfile: true },
        { community: null },
        { community: { $exists: false } },
      ];
    }

    const posts = await Post.find(filter)
      .populate("createdBy", "username displayName email avatar role")
      .populate({
        path: "sharedPost",
        populate: { path: "createdBy", select: "username displayName avatar role" }
      })
      .lean();

    const scored = posts.map((p) => ({
      ...p,
      likeCount: Array.isArray(p.likes) ? p.likes.length : 0,
    }));
    scored.sort((a, b) => {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const limitRaw = parseInt(String(req.query.limit || "15"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 40) : 15;
    const slice = scored.slice(0, limit);

    const normalized = slice.map((obj) => {
      if (obj?.createdBy?.role) {
        const r = String(obj.createdBy.role || "").trim().toLowerCase();
        obj.createdBy.role = r === "admin" ? "admin" : "user";
      } else if (obj?.createdBy) {
        obj.createdBy.role = "user";
      }
      return obj;
    });

    res.json(normalized);
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