const Post = require("../models/Post");
const Community = require("../models/Community");
const User = require("../models/User"); 
const Notification = require("../models/Notification"); 
const { cloudinary } = require("../config/cloudinary");
const fs = require('fs');

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

/* STREAMING_CHUNK:Logic xử lý AI Vision và Fallback (Giữ nguyên từ File 2)... */
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
    // Xác định mime type (mặc định lấy jpeg cho an toàn)
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
        temperature: 0.1, // Cấu hình thấp để kết quả ổn định, không sáng tạo lung tung
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

    // Chuẩn hóa kết quả trả về để map với DB
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

/* STREAMING_CHUNK:Logic CreatePost đã được gộp Community (Từ File 1)... */
exports.createPost = async (req, res) => {
  try {
    const { title, description, location, category, images, price, lat, lng, postType, communityId, publishedToProfile } = req.body;

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
      publishedToProfile: true, // Mặc định true theo logic File 1
    });

    // ----------------------------------------------------------------------
    // TÍCH HỢP COMMUNITY: Nếu có communityId, kiểm tra quyền và gán vào bài đăng
    // ----------------------------------------------------------------------
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

/* STREAMING_CHUNK:Logic CreatePostWithMedia đã được gộp Community (Từ File 1)... */
exports.createPostWithMedia = async (req, res) => {
  try {
    const { title, description, location, category, price, lat, lng, postType, communityId, publishedToProfile } = req.body;

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
      
      // Chạy AI Vision cho bức ảnh đầu tiên
      const firstImagePath = req.files[0].path;
      imageAiCategory = await analyzeImageWithGroq(firstImagePath);
    }

    // Xử lý Description chặt chẽ
    let finalDescription = null;
    if (typeof description === "string") {
       const trimmed = description.trim();
       if (trimmed !== "" && trimmed !== "0" && trimmed !== "\u200B") {
           finalDescription = trimmed;
       }
    }
    
    // Gán Category: Nếu người dùng để mặc định "General" thì áp dụng AI
    let finalCategory = category || "General";
    
    if (finalCategory === "General") {
        if (imageAiCategory) {
            finalCategory = imageAiCategory; // Ưu tiên AI phân tích hình ảnh
        } else {
            // Nếu AI nhìn ảnh thất bại, thử đoán qua chữ viết
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
      publishedToProfile: true, // Mặc định true theo logic File 1
    });

    // ----------------------------------------------------------------------
    // TÍCH HỢP COMMUNITY: Nếu có communityId, kiểm tra quyền và gán vào bài đăng
    // ----------------------------------------------------------------------
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

/* STREAMING_CHUNK:Get Posts tích hợp lọc Community (Từ File 1)... */
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
    
    // TÍCH HỢP COMMUNITY: Logic lọc bài viết nâng cao từ File 1
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
      // ✅ Trả thêm thuộc tính displayName như ở File 1 và populate cả community
      .populate("createdBy", "username displayName email avatar role")
      .populate("community", "name")
      .sort({ createdAt: -1 });

    // TÍCH HỢP COMMUNITY: Tính năng normalize output ở File 1
    const normalizedPosts = posts.map((post) => {
      const obj = post.toObject();
      return obj;
    });

    res.json(normalizedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* STREAMING_CHUNK:Các tính năng xử lý cơ bản tiếp tục giữ nguyên... */
exports.getExplorePosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "User không tồn tại" });

    const targetUsers = [...currentUser.friends, currentUser._id];

    // 3. Tìm các Post của những người này, có tọa độ và không bị ẩn
    const { category } = req.query;
    let filter = {
      createdBy: { $in: targetUsers },
      lat: { $ne: null },
      lng: { $ne: null },
      isHidden: false
    };

    if (category) {
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .populate("createdBy", "username email avatar role")
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

    // Gửi thông báo cho chủ bài viết (nếu không phải tự like bài mình)
    if (post.createdBy && post.createdBy.toString() !== req.user.id) {
      const notif = await Notification.create({
        receiver: post.createdBy,
        sender: req.user.id,
        type: "system",
        content: `đã thích bài viết của bạn.`,
        link: `/post/${post._id}`
      });

      // Emit realtime
      const io = req.app.get('io');
      if (io) {
        const me = await User.findById(req.user.id).select("username avatar");
        io.emit(`notification_${post.createdBy}`, {
          ...notif.toObject(),
          sender: { _id: me._id, username: me.username, avatar: me.avatar }
        });
      }
    }

    res.json({ message: "Post liked successfully", liked: true });
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

/* STREAMING_CHUNK:Thêm PublishPostToProfile (Từ File 1)... */
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

/* STREAMING_CHUNK:Hoàn thiện với ToggleVisibility và GetTrendingPosts... */
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
          lat: { $ne: null }, // Đã sửa: Chỉ lấy bài có tọa độ lat
          lng: { $ne: null }  // Đã sửa: Chỉ lấy bài có tọa độ lng
        }
      }, // Chỉ lấy bài không bị ẩn và có ghim vị trí thực sự
      { $addFields: { likeCount: { $size: { $ifNull: ["$likes", []] } } } }, // Đếm số lượng phần tử trong mảng likes
      { $sort: { likeCount: -1, createdAt: -1 } }, // Sắp xếp giảm dần theo like, sau đó là thời gian tạo
      { $limit: 5 } // Lấy top 5
    ]);

    // Populate thông tin người tạo (vì aggregate không tự populate)
    await Post.populate(posts, { path: "createdBy", select: "username avatar role" });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};