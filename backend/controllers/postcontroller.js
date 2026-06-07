const Post = require("../models/Post");
const Community = require("../models/Community");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
const { checkTextModeration } = require("../utils/contentModerator");

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
    const urls = req.files.map((file) => file.path || file.secure_url || file.url);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const notifyFriendsAboutLocation = async (userId, postTitle, postLocation) => {
  try {
    const user = await User.findById(userId);
    if (user && user.friends && user.friends.length > 0) {
      const locationName = postLocation && postLocation !== "Chưa rõ vị trí" ? postLocation : "một địa điểm mới";
      const notifications = user.friends.map(friendId => ({
        receiver: friendId,
        sender: userId,
        type: "system",
        content: `vừa chia sẻ ${locationName} trên bản đồ.`,
        link: `/explore`
      }));
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error("Lỗi khi gửi thông báo vị trí: ", err);
  }
};

// 🤖 HÀM 1: AI PHÂN TÍCH ẢNH DÙNG GROQ VISION
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

// 🧠 HÀM KIỂM DUYỆT ẢNH DÙNG GROQ VISION
const moderateImageWithGroq = async (imageUrlOrPath) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log("⚠️ AI_DEBUG: Thiếu biến GROQ_API_KEY trong file .env khi kiểm duyệt ảnh");
      return "safe";
    }

    console.log(`🚀 AI_DEBUG: Bắt đầu gửi ảnh sang Groq Vision AI để kiểm duyệt: ${imageUrlOrPath}`);
    
    let base64Image = "";
    let mimeType = "image/jpeg";

    if (imageUrlOrPath.startsWith("http")) {
      try {
        const response = await fetch(imageUrlOrPath);
        const buffer = await response.arrayBuffer();
        base64Image = Buffer.from(buffer).toString('base64');
      } catch (e) {
        console.error("Lỗi tải ảnh từ URL về base64:", e.message);
        return "safe";
      }
    } else {
      const absolutePath = path.isAbsolute(imageUrlOrPath)
        ? imageUrlOrPath
        : path.join(__dirname, "..", imageUrlOrPath);
        
      if (!fs.existsSync(absolutePath)) {
        console.warn("⚠️ File ảnh không tồn tại trên đĩa cục bộ:", absolutePath);
        return "safe";
      }

      const imageBuffer = fs.readFileSync(absolutePath);
      base64Image = imageBuffer.toString('base64');
      if (imageUrlOrPath.endsWith('.png')) mimeType = "image/png";
      if (imageUrlOrPath.endsWith('.webp')) mimeType = "image/webp";
    }

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
                text: "Bạn là một AI kiểm duyệt hình ảnh. Hãy phân tích bức ảnh này xem có chứa nội dung không phù hợp (ví dụ như bạo lực, nhạy cảm, dung tục, thô tục, cấm) hay không. Chỉ trả về từ 'unsafe' nếu KHÔNG PHÙ HỢP, hoặc 'safe' nếu PHÙ HỢP. Tuyệt đối không giải thích gì thêm." 
              },
              { 
                type: "image_url", 
                image_url: { url: `data:${mimeType};base64,${base64Image}` } 
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      console.error("Lỗi gọi Groq Vision API để kiểm duyệt ảnh:", await response.text());
      return "safe";
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content?.trim().toLowerCase() || "safe";
    console.log(`🧠 AI_DEBUG: Kết quả kiểm duyệt ảnh là: [${result}]`);
    return result.includes("unsafe") ? "unsafe" : "safe";
  } catch (error) {
    console.error("❌ Lỗi AI kiểm duyệt ảnh:", error.message);
    return "safe";
  }
};

// 🧠 HÀM 2: FALLBACK - PHÂN TÍCH THEO CHỮ NẾU AI ẢNH THẤT BẠI
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

// 📝 ĐĂNG BÀI VIẾT (TEXT ONLY)
exports.createPost = async (req, res) => {
  try {
    const { title, description, location, category, images, price, lat, lng, postType, communityId, publishedToProfile } = req.body;

    // --- KIỂM DUYỆT AI: Dành cho Bài đăng không kèm Media (Text Only) ---
    // (Nếu không qua middleware, controller vẫn tự động gọi checkTextModeration làm lớp bảo vệ dự phòng)
    const textToCheck = `${title || ''} ${description || ''}`.trim();
    if (textToCheck && !req.moderation) {
      const isSafe = await checkTextModeration(textToCheck);
      if (!isSafe) {
        return res.status(400).json({ message: "Nội dung bài viết chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." });
      }
    }

    // Đọc trạng thái được kiểm duyệt từ middleware nếu có
    const isFlagged = req.moderation?.status === "flagged";

    const normalizedPrice = Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "admin") {
        finalPostType = "promotional";
      }
    }

    const newPost = new Post({
      title: title || "Cập nhật mới",
      description: description || null,
      location: location || "Chưa rõ vị trí",
      category: category || "General",
      price: normalizedPrice,
      images: images || [],
      lat: lat || null,
      lng: lng || null,
      postType: finalPostType,
      createdBy: req.user?.id || null,
      publishedToProfile: true, 
      isHidden: isFlagged // Tự động ẩn bài viết nếu AI gắn cờ chờ duyệt
    });

    if (communityId && String(communityId).trim()) {
      const comm = await Community.findById(String(communityId).trim());
      if (!comm) return res.status(400).json({ message: "Cộng đồng không tồn tại" });
      
      const uid = String(req.user.id);
      const isMember = String(comm.createdBy) === uid || (comm.members || []).some((m) => String(m) === uid);
      if (!isMember) return res.status(403).json({ message: "Bạn chưa tham gia cộng đồng này" });
      
      newPost.community = comm._id;
      newPost.publishedToProfile = String(publishedToProfile || "").toLowerCase() === "true";
    }

    await newPost.save();

    if (newPost.lat && newPost.lng && req.user?.id && !isFlagged) {
      await notifyFriendsAboutLocation(req.user.id, newPost.title, newPost.location);
    }

    res.status(201).json({ 
      message: isFlagged 
        ? "Bài đăng của bạn đang chờ quản trị viên phê duyệt do chứa nội dung nhạy cảm." 
        : "Post created successfully", 
      post: newPost,
      flagged: isFlagged
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📝 ĐĂNG BÀI VIẾT KÈM MEDIA
exports.createPostWithMedia = async (req, res) => {
  try {
    const { title, description, location, category, price, lat, lng, postType, communityId, publishedToProfile } = req.body;

    let finalDescription = null;
    if (typeof description === "string") {
       const trimmed = description.trim();
       if (trimmed !== "" && trimmed !== "0" && trimmed !== "\u200B") {
           finalDescription = trimmed;
       }
    }

    // --- KIỂM DUYỆT AI: Dành cho Bài đăng có kèm Media ---
    // (Nếu không qua middleware, controller vẫn tự động gọi checkTextModeration làm lớp bảo vệ dự phòng)
    const textToCheck = `${title || ''} ${finalDescription || ''}`.trim();
    if (textToCheck && !req.moderation) {
      const isSafe = await checkTextModeration(textToCheck);
      if (!isSafe) {
        return res.status(400).json({ message: "Nội dung bài viết chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." });
      }
    }

    // Đọc trạng thái được kiểm duyệt từ middleware nếu có
    const isFlagged = req.moderation?.status === "flagged";

    const normalizedPrice = Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    const parsedLat = lat !== undefined && lat !== '' && Number.isFinite(Number(lat)) ? Number(lat) : null;
    const parsedLng = lng !== undefined && lng !== '' && Number.isFinite(Number(lng)) ? Number(lng) : null;

    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "admin") {
        finalPostType = "promotional";
      }
    }

    const host = `${req.protocol}://${req.get("host")}`;
    const uploadedUrls = [];
    let imageAiCategory = null;

    if (Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach(file => {
          uploadedUrls.push(`${host}/uploads/${file.filename}`);
      });
      
      const firstImagePath = req.files[0].path;
      imageAiCategory = await analyzeImageWithGroq(firstImagePath);
    }
    
    let finalCategory = category || "General";
    
    if (finalCategory === "General" || finalCategory === "Chung") {
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
      isHidden: isFlagged // Tự động ẩn bài viết nếu AI gắn cờ chờ duyệt
    });

    if (communityId && String(communityId).trim()) {
      const comm = await Community.findById(String(communityId).trim());
      if (!comm) return res.status(400).json({ message: "Cộng đồng không tồn tại" });
      
      const uid = String(req.user.id);
      const isMember = String(comm.createdBy) === uid || (comm.members || []).some((m) => String(m) === uid);
      if (!isMember) return res.status(403).json({ message: "Bạn chưa tham gia cộng đồng này" });
      
      newPost.community = comm._id;
      newPost.publishedToProfile = String(publishedToProfile || "").toLowerCase() === "true";
    }

    await newPost.save();

    if (newPost.lat && newPost.lng && req.user?.id && !isFlagged) {
      await notifyFriendsAboutLocation(req.user.id, newPost.title, newPost.location);
    }

    res.status(201).json({ 
      message: isFlagged 
        ? "Bài đăng của bạn đang chờ quản trị viên phê duyệt do chứa nội dung nhạy cảm." 
        : "Post created successfully", 
      post: newPost,
      flagged: isFlagged
    });
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
    const { location, category, hasLocation } = req.query;
    let filter = {};

    if (location) filter.location = location;
    if (category) filter.category = category;
    
    // Nếu có query param hasLocation=true (ví dụ: trang Explore) thì chỉ lấy bài có lat, lng
    // Đồng thời không hiển thị bài viết được chia sẻ (shared posts) trong danh sách khám phá
    if (hasLocation === 'true') {
      filter.lat = { $ne: null };
      filter.lng = { $ne: null };
      filter.sharedPost = null;
    }
    
    const isAdmin = normalizeRole(req.user?.role) === "admin";
    if (!isAdmin) {
      filter.isHidden = false;
      filter.$or = [
        { publishedToProfile: true },
        { community: null },
        { community: { $exists: false } },
      ];
    }

    // Lọc bỏ các bài viết bị người dùng ẩn cá nhân
    if (req.user?.id) {
      const user = await User.findById(req.user.id).select("hiddenPosts");
      if (user && user.hiddenPosts && user.hiddenPosts.length > 0) {
        filter._id = { $nin: user.hiddenPosts };
      }
    }

    const posts = await Post.find(filter)
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

    // Gửi thông báo Like real-time
    try {
      const { createAndEmitNotification } = require('./notificationController');
      await createAndEmitNotification(req.app.get('io'), req.connectedUsers, {
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

    // --- KIỂM DUYỆT AI: Khi cập nhật bài viết ---
    const textToCheck = `${title || ''} ${description || ''}`.trim();
    if (textToCheck) {
      const isSafe = await checkTextModeration(textToCheck);
      if (!isSafe) {
        return res.status(400).json({ message: "Nội dung cập nhật chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." });
      }
    }

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

// ♻️ HÀM SHARE BÀI VIẾT VỀ TRANG CÁ NHÂN
exports.sharePostToProfile = async (req, res) => {
  try {
    const originalPostId = req.params.id;
    const { description } = req.body;
    const userId = req.user.id;

    // --- KIỂM DUYỆT AI: Kiểm duyệt Lời bình khi Share bài ---
    if (description && description.trim()) {
      const isSafe = await checkTextModeration(description.trim());
      if (!isSafe) {
        return res.status(400).json({ message: "Lời bình chia sẻ chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." });
      }
    }

    const originalPost = await Post.findById(originalPostId).populate("createdBy", "username displayName");
    if (!originalPost) {
      return res.status(404).json({ message: "Không tìm thấy bài viết gốc" });
    }

    const targetShareId = originalPost.sharedPost ? originalPost.sharedPost : originalPost._id;
    const authorName = originalPost.createdBy?.displayName || originalPost.createdBy?.username || 'người khác';

    const newSharedPost = new Post({
      title: `Đã chia sẻ bài viết của ${authorName}`, 
      description: description || null, 
      location: originalPost.location,  
      category: originalPost.category,  
      lat: originalPost.lat,
      lng: originalPost.lng,
      images: originalPost.images || [], 
      createdBy: userId,
      sharedPost: targetShareId, 
      publishedToProfile: true
    });

    await newSharedPost.save();
    
    try {
      const { createAndEmitNotification } = require("./notificationController");
      if (String(originalPost.createdBy?._id || originalPost.createdBy) !== String(userId)) {
        await createAndEmitNotification(req.app.get('io'), req.connectedUsers, {
          recipient: originalPost.createdBy?._id || originalPost.createdBy,
          sender: userId,
          type: "share",
          post: newSharedPost._id,
          content: "đã chia sẻ bài viết của bạn.",
        });
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr.message);
    }

    res.status(201).json({ message: "Chia sẻ bài viết lên trang cá nhân thành công", post: newSharedPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🚩 TỐ CÁO BÀI VIẾT (Tự động kiểm duyệt AI & Xóa vĩnh viễn nếu vi phạm)
exports.reportPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    console.log(`🔍 Bắt đầu kiểm duyệt tố cáo bài viết: ${id}`);
    
    // 1. Kiểm tra văn bản (tiêu đề & mô tả) qua bộ lọc từ thô tục
    const textToCheck = `${post.title || ''} ${post.description || ''}`.trim();
    const { containsBadWords } = require("../utils/moderation");
    const hasBadWords = containsBadWords(textToCheck);

    if (hasBadWords) {
      console.log(`⚠️ Bài viết ${id} chứa từ ngữ vi phạm tiêu chuẩn. Tiến hành xóa vĩnh viễn...`);
      await post.deleteOne();
      return res.status(200).json({ 
        status: "deleted", 
        message: "Bài viết đã bị xóa vĩnh viễn do chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." 
      });
    }

    // 2. Kiểm tra hình ảnh qua AI Vision (nếu có ảnh)
    if (post.images && post.images.length > 0) {
      for (const img of post.images) {
        let imageSource = img;
        const host = `${req.protocol}://${req.get("host")}`;
        if (img.startsWith(host)) {
          imageSource = img.replace(host, "").replace(/^\//, "");
        }
        
        const imgSafety = await moderateImageWithGroq(imageSource);
        if (imgSafety === "unsafe") {
          console.log(`⚠️ Bài viết ${id} có hình ảnh không phù hợp. Tiến hành xóa vĩnh viễn...`);
          await post.deleteOne();
          return res.status(200).json({ 
            status: "deleted", 
            message: "Bài viết đã bị xóa vĩnh viễn do chứa hình ảnh không phù hợp." 
          });
        }
      }
    }

    console.log(`✅ Bài viết ${id} an toàn sau khi kiểm duyệt tố cáo.`);
    return res.status(200).json({ 
      status: "safe", 
      message: "Bài viết an toàn và không vi phạm tiêu chuẩn cộng đồng." 
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi kiểm duyệt tố cáo", error: error.message });
  }
};

// 🙈 ẨN BÀI VIẾT CÁ NHÂN
exports.hidePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Đẩy bài viết vào hiddenPosts của user
    await User.findByIdAndUpdate(userId, {
      $addToSet: { hiddenPosts: id }
    });

    res.status(200).json({ message: "Đã ẩn bài viết khỏi bảng tin của bạn thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi ẩn bài viết", error: error.message });
  }
};

// 👁️ HOÀN TÁC ẨN BÀI VIẾT CÁ NHÂN
exports.unhidePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Rút bài viết khỏi hiddenPosts của user
    await User.findByIdAndUpdate(userId, {
      $pull: { hiddenPosts: id }
    });

    res.status(200).json({ message: "Đã hoàn tác ẩn bài viết thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hoàn tác ẩn bài viết", error: error.message });
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

    // Lọc bỏ các bài viết bị người dùng ẩn cá nhân khỏi danh sách trending
    if (req.user?.id) {
      const user = await User.findById(req.user.id).select("hiddenPosts");
      if (user && user.hiddenPosts && user.hiddenPosts.length > 0) {
        filter._id = { $nin: user.hiddenPosts };
      }
    }

    // Không đưa các bài viết chia sẻ (shared) vào phần thịnh hành
    filter.sharedPost = null;

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

    const comments = await Comment.find({ createdAt: { $gte: oneWeekAgo } })
      .select("content")
      .lean();

    const posts = await Post.find({ createdAt: { $gte: oneWeekAgo } })
      .select("title description")
      .lean();

    const allText = [
      ...comments.map(c => c.content || ""),
      ...posts.map(p => `${p.title} ${p.description}`),
    ].join(" ");

    const keywords = allText
      .toLowerCase()
      .match(/\b[a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]{4,}\b/g) || [];

    const stopwords = new Set([
      "được", "là", "để", "có", "không", "của", "và", "với", "từ", "vào", "bạn",
      "trong", "này", "một", "nên", "chúng", "bài", "viết", "post", "điều", "những",
      "cách", "khi", "đó", "sẽ", "được", "thì", "cũng", "nhưng", "nếu", "trước",
      "sau", "đến", "tại", "qua", "vì", "thành", "việc", "khác", "chỉ", "chiều"
    ]);

    const filteredKeywords = keywords.filter(word => 
      word.length > 3 && !stopwords.has(word)
    );

    const keywordCount = {};
    filteredKeywords.forEach(keyword => {
      keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
    });

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