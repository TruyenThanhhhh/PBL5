const User = require("../models/user"); // <-- Đã sửa chữ 'U' viết hoa
const Post = require("../models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Hàm hỗ trợ chuẩn hóa role
const normalizeRole = (role) => {
  if (typeof role !== "string") return "viewer";
  const r = role.trim().toLowerCase();
  if (r === "user") return "poster";
  return r;
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
    const allowedRoles = ["viewer", "poster"];
    const normalizedRole = normalizeRole(role);
    const assignedRole = allowedRoles.includes(normalizedRole) ? normalizedRole : "viewer";

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

    // Gửi kèm 'role' và 'roleRequestStatus' về cho Frontend
    res.json({ 
      message: "Đăng nhập thành công", 
      token, 
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      roleRequestStatus: user.roleRequestStatus
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Lỗi Server!" });
  }
};

// ➕ FOLLOW / UNFOLLOW USER
exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (targetId === myId)
      return res.status(400).json({ message: "Không thể follow chính mình" });

    const [me, target] = await Promise.all([
      User.findById(myId),
      User.findById(targetId),
    ]);

    if (!target) return res.status(404).json({ message: "User không tồn tại" });

    const isFollowing = me.following.includes(targetId);

    if (isFollowing) {
      me.following.pull(targetId);
      target.followers.pull(myId);
    } else {
      me.following.push(targetId);
      target.followers.push(myId);
    }

    await Promise.all([me.save(), target.save()]);

    res.json({
      following: !isFollowing,
      message: isFollowing ? "Đã unfollow" : "Đã follow",
      followersCount: target.followers.length,
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

// ==========================================
// 🛡️ TÍNH NĂNG: XIN LÊN QUYỀN POSTER
// ==========================================
exports.requestPosterRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    if (user.role === "poster" || user.role === "admin") {
      return res.status(400).json({ message: "Bạn đã có quyền đăng bài rồi." });
    }

    if (user.roleRequestStatus === "pending") {
      return res.status(400).json({ message: "Yêu cầu của bạn đang chờ duyệt." });
    }

    user.roleRequestStatus = "pending";
    await user.save();

    res.json({ message: "Đã gửi yêu cầu thành công.", status: "pending" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveRoleRequest = async (req, res) => {
  try {
    const { userId, action } = req.body; 
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    if (action === "approve") {
      user.role = "poster";
      user.roleRequestStatus = "approved";
    } else if (action === "reject") {
      user.roleRequestStatus = "rejected";
    } else {
      return res.status(400).json({ message: "Action không hợp lệ" });
    }

    await user.save();
    res.json({ message: `Đã ${action} user ${user.username}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const users = await User.find({ roleRequestStatus: "pending" }).select("username email createdAt");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};