const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Hàm hỗ trợ chuẩn hóa role
const normalizeRole = (role) => {
  if (typeof role !== "string") return "user";
  const r = role.trim().toLowerCase();
  if (r === "admin") return "admin";
  return "user";
};

// 🚀 ĐĂNG KÝ TÀI KHOẢN
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = "user";

    let avatarUrl = "";
    if (req.file && req.file.path) {
      avatarUrl = req.file.path; 
    }

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim(), 
      password: hashedPassword,
      role: assignedRole,
      avatar: avatarUrl,
    });

    res.status(201).json({ message: "Đăng ký thành công", userId: newUser._id, role: assignedRole });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🚀 ĐĂNG NHẬP (Khớp chính xác chữ hoa/chữ thường)
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    const cleanIdentifier = identifier.trim();
    console.log("➡️ Đang thử đăng nhập với tài khoản:", cleanIdentifier);

    // Tìm user bằng email HOẶC username
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier }, 
        { username: cleanIdentifier }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại!" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu!" });
    }

    // Tạo Token
    const normalizedRole = normalizeRole(user.role);
    const token = jwt.sign(
      { id: user._id, role: normalizedRole },
      process.env.JWT_SECRET || "123456789",
      { expiresIn: "7d" }
    );

    console.log(`✅ Đăng nhập thành công: ${user.username} | Quyền: ${user.role}`);

    res.json({ 
      message: "Đăng nhập thành công", 
      token, 
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      role: user.role
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Lỗi Server!" });
  }
};

// ➕ FOLLOW / UNFOLLOW USER (KẾT BẠN)
exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (targetId === myId)
      return res.status(400).json({ message: "Không thể tự kết bạn với chính mình" });

    // Sử dụng findById để kiểm tra mà không dùng .save() để tránh Mongoose Validation Error do dữ liệu cũ
    const me = await User.findById(myId);
    const target = await User.findById(targetId);

    if (!target) return res.status(404).json({ message: "User không tồn tại" });

    const isFollowing = me.following.includes(targetId);

    // SỬ DỤNG findByIdAndUpdate ĐỂ FIX LỖI VALIDATION "POSTER/VIEWER" CỦA MONGODB
    if (isFollowing) {
      // Hủy yêu cầu (Unfollow)
      await Promise.all([
        User.findByIdAndUpdate(myId, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: myId } })
      ]);
    } else {
      // Gửi yêu cầu (Follow)
      await Promise.all([
        User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } })
      ]);
    }

    // Gửi thông báo Follow real-time
    if (!isFollowing) {
      try {
        const { createAndEmitNotification } = require('./notificationController');
        await createAndEmitNotification(req.io, req.connectedUsers, {
          recipient: targetId,
          sender: myId,
          type: 'follow',
          post: null,
          content: 'đã gửi một lời mời kết bạn / theo dõi bạn.'
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
    }

    res.json({
      following: !isFollowing,
      message: isFollowing ? 'Đã thu hồi lời mời' : 'Đã gửi lời mời',
      followersCount: isFollowing ? target.followers.length - 1 : target.followers.length + 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📰 GET FEED
exports.getFeed = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("following");
    if (!me.following.length) {
      return res.json({ posts: [], message: "Hãy follow ai đó để xem feed" });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const posts = await Post.find({ createdBy: { $in: me.following } })
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ createdBy: { $in: me.following } });

    res.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👥 LẤY DANH SÁCH FOLLOWERS / FOLLOWING
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "username avatar bio")
      .populate("following", "username avatar bio");

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    res.json({
      followers: user.followers,
      following: user.following,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👤 GET USER PROFILE
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username avatar")
      .populate("following", "username avatar");

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const posts = await Post.find({ createdBy: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ user, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👥 LẤY TẤT CẢ USER (Cho tính năng tìm kiếm và kết bạn)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username avatar email role")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};