const Post = require("../models/Post");
const Community = require("../models/Community");
const User = require("../models/User"); 
const Notification = require("../models/Notification"); 
const { cloudinary } = require("../config/cloudinary");
const fs = require('fs');

// --- IMPORT HÀM KIỂM DUYỆT BẰNG AI ---
const { checkTextModeration } = require("../utils/contentModerator");

const normalizeRole = (role) => {
  if (typeof role !== "string") return "user";
  const r = role.trim().toLowerCase();
  return r === "admin" ? "admin" : "user";
};

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }
    const urls = req.files.map((file) => file.path);
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

// ==========================================
// 🤖 HÀM 1: AI PHÂN TÍCH ẢNH DÙNG GROQ VISION
// ==========================================
const analyzeImageWithGroq = async (filePath) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log("⚠️ AI_DEBUG: Thiếu biến GROQ_API_KEY trong file .env");
      return null;
    }

    console.log("🚀 AI_DEBUG: Bắt đầu gửi ảnh sang Groq Vision AI (meta-llama/llama-4-scout-17b-16e-instruct)...");
    
    // Đọc ảnh và chuyển sang Base64
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

// ==========================================
// 🧠 HÀM 2: FALLBACK - PHÂN TÍCH THEO CHỮ NẾU AI ẢNH THẤT BẠI
// ==========================================
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

exports.createPost = async (req, res) => {
  try {
    const { title, description, location, category, images, price, lat, lng, postType, communityId, publishedToProfile } = req.body;

    // --- KIỂM DUYỆT AI: Dành cho Bài đăng không kèm Media (Text Only) ---
    const textToCheck = `${title || ''} ${description || ''}`.trim();
    if (textToCheck) {
      const isSafe = await checkTextModeration(textToCheck);
      if (!isSafe) {
        return res.status(400).json({ message: "Nội dung bài viết chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." });
      }
    }
    // -------------------------------------------------------------------

    const normalizedPrice = Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "poster" || req.user?.role === "admin") {
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

    if (newPost.lat && newPost.lng && req.user?.id) {
      await notifyFriendsAboutLocation(req.user.id, newPost.title, newPost.location);
    }

    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    const textToCheck = `${title || ''} ${finalDescription || ''}`.trim();
    if (textToCheck) {
      const isSafe = await checkTextModeration(textToCheck);
      if (!isSafe) {
        return res.status(400).json({ message: "Nội dung bài viết chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." });
      }
    }
    // ------------------------------------------------------

    const normalizedPrice = Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    const parsedLat = Number.isFinite(Number(lat)) ? Number(lat) : null;
    const parsedLng = Number.isFinite(Number(lng)) ? Number(lng) : null;

    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "poster" || req.user?.role === "admin") {
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
    
    if (finalCategory === "General") {
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
      const isMember = String(comm.createdBy) === uid || (comm.members || []).some((m) => String(m) === uid);
      if (!isMember) return res.status(403).json({ message: "Bạn chưa tham gia cộng đồng này" });
      
      newPost.community = comm._id;
      newPost.publishedToProfile = String(publishedToProfile || "").toLowerCase() === "true";
    }

    await newPost.save();

    if (newPost.lat && newPost.lng && req.user?.id) {
      await notifyFriendsAboutLocation(req.user.id, newPost.title, newPost.location);
    }

    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ♻️ HÀM MỚI: SHARE BÀI VIẾT VỀ TRANG CÁ NHÂN
// ==========================================
exports.sharePost = async (req, res) => {
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
    // ---------------------------------------------------------

    // Tìm bài gốc & Populate người tạo ra nó để lấy tên
    const originalPost = await Post.findById(originalPostId).populate("createdBy", "username displayName");
    if (!originalPost) {
      return res.status(404).json({ message: "Không tìm thấy bài viết gốc" });
    }

    // Lấy ID gốc rễ: Nếu người dùng share 1 bài đã được share trước đó, ta lấy ID của bài GỐC NHẤT.
    const targetShareId = originalPost.sharedFrom ? originalPost.sharedFrom : originalPost._id;
    
    // Tên của chủ bài viết (bài gốc rễ)
    const authorName = originalPost.createdBy?.displayName || originalPost.createdBy?.username || 'người khác';

    const newSharedPost = new Post({
      title: `Đã chia sẻ bài viết của ${authorName}`, 
      description: description || null, // Lời bình của người share
      location: originalPost.location,  // Kế thừa location
      category: originalPost.category,  // Kế thừa category
      lat: originalPost.lat,
      lng: originalPost.lng,
      images: [], // Bài share không có ảnh riêng, chỉ render ảnh bài gốc từ frontend
      createdBy: userId,
      sharedFrom: targetShareId, // Cột quan trọng để nối bài!
      publishedToProfile: true
    });

    await newSharedPost.save();
    
    // Tạo notification cho chủ bài viết gốc
    if (originalPost.createdBy && String(originalPost.createdBy._id) !== String(userId)) {
      await Notification.create({
        receiver: originalPost.createdBy._id,
        sender: userId,
        type: "system",
        content: `đã chia sẻ bài viết của bạn.`,
        link: `/post-detail?postId=${newSharedPost._id}`
      });
    }

    // Populate lại để trả về frontend dùng ngay
    await newSharedPost.populate("createdBy", "username displayName avatar");
    await newSharedPost.populate({
      path: "sharedFrom",
      populate: { path: "createdBy", select: "username displayName avatar" }
    });

    res.status(201).json({ message: "Đã chia sẻ bài viết thành công", post: newSharedPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ==========================================


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
      .populate("createdBy", "username displayName email avatar role")
      .populate("community", "name")
      // ĐÃ SỬA: Populate thêm sharedFrom để có đủ data render bài Share
      .populate({
        path: "sharedFrom",
        populate: { path: "createdBy", select: "username displayName avatar role" }
      })
      .sort({ createdAt: -1 });

    const normalizedPosts = posts.map((post) => post.toObject());
    res.json(normalizedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExplorePosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "User không tồn tại" });

    const targetUsers = [...currentUser.friends, currentUser._id];

    const posts = await Post.find({
      createdBy: { $in: targetUsers },
      lat: { $ne: null },
      lng: { $ne: null },
      isHidden: false
    })
      .populate("createdBy", "username email avatar role")
      // ĐÃ SỬA: Populate thêm sharedFrom 
      .populate({
        path: "sharedFrom",
        populate: { path: "createdBy", select: "username displayName avatar role" }
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some(
      (userId) => userId.toString() === req.user.id
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user.id
      );
      await post.save();
      return res.json({ message: "Post unliked successfully", liked: false });
    }

    post.likes.push(req.user.id);
    await post.save();
    res.json({ message: "Post liked successfully", liked: true });
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
    // --------------------------------------------

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

exports.getTrendingPosts = async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $match: {
          isHidden: false,
          lat: { $ne: null }, 
          lng: { $ne: null }  
        }
      }, 
      { $addFields: { likeCount: { $size: { $ifNull: ["$likes", []] } } } }, 
      { $sort: { likeCount: -1, createdAt: -1 } }, 
      { $limit: 5 } 
    ]);

    // Populate thông tin người tạo VÀ bài gốc
    await Post.populate(posts, [
      { path: "createdBy", select: "username avatar role displayName" },
      { path: "sharedFrom", populate: { path: "createdBy", select: "username displayName avatar role" } }
    ]);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};