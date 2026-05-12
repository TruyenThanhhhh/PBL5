const Post = require("../models/Post");
const User = require("../models/User"); // Import User model để lấy danh sách bạn bè
const Notification = require("../models/Notification"); // Import Notification model để gửi thông báo
const { cloudinary } = require("../config/cloudinary");

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

// Hàm phụ trợ để gửi thông báo cho bạn bè khi có bài post chứa tọa độ
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

exports.createPost = async (req, res) => {
  try {
    const { title, description, location, category, images, price, lat, lng, postType } = req.body;

    const normalizedPrice =
      Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "poster" || req.user?.role === "admin") {
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
    });

    await newPost.save();

    // KIỂM TRA: Nếu có ghim tọa độ, gửi thông báo cho bạn bè
    if (newPost.lat && newPost.lng && req.user?.id) {
      await notifyFriendsAboutLocation(req.user.id, newPost.title, newPost.location);
    }

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
    const { title, description, location, category, price, lat, lng, postType } = req.body;

    const normalizedPrice =
      Number.isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : null;
    const parsedLat = Number.isFinite(Number(lat)) ? Number(lat) : null;
    const parsedLng = Number.isFinite(Number(lng)) ? Number(lng) : null;

    let finalPostType = "regular";
    if (postType === "promotional") {
      if (req.user?.role === "poster" || req.user?.role === "admin") {
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
    });

    await newPost.save();

    // KIỂM TRA: Nếu có ghim tọa độ, gửi thông báo cho bạn bè
    if (newPost.lat && newPost.lng && req.user?.id) {
      await notifyFriendsAboutLocation(req.user.id, newPost.title, newPost.location);
    }

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
    if (req.user?.role !== "admin") filter.isHidden = false;

    const posts = await Post.find(filter)
      .populate("createdBy", "username email avatar role") 
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// API chỉ lấy các điểm được đăng bởi BẠN BÈ hoặc BẢN THÂN
exports.getExplorePosts = async (req, res) => {
  try {
    // 1. Lấy thông tin User hiện tại kèm danh sách bạn bè
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "User không tồn tại" });

    // 2. Gom danh sách ID của bạn bè và chính user đó
    const targetUsers = [...currentUser.friends, currentUser._id];

    // 3. Tìm các Post của những người này, có tọa độ và không bị ẩn
    const posts = await Post.find({
      createdBy: { $in: targetUsers },
      lat: { $ne: null },
      lng: { $ne: null },
      isHidden: false
    })
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
    // Sử dụng aggregate để tính toán số lượng like và sắp xếp
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