const User = require("../models/User");
const Post = require("../models/Post");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

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
      displayName: username.trim(),
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

    const escapedIdentifier = cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const identifierRegex = new RegExp(`^${escapedIdentifier}$`, "i");

    // Tìm user bằng email HOẶC username
    const user = await User.findOne({
      $or: [
        { email: identifierRegex },
        { username: identifierRegex }
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
      displayName: user.displayName || user.username,
      avatar: user.avatar,
      role: normalizedRole
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Lỗi Server!" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token Google không được bỏ trống" });
    }

    if (!googleClientId) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID chưa được cấu hình" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Không lấy được email từ Google token" });
    }

    const email = payload.email.toLowerCase();
    const fullName = payload.name || email.split("@")[0];
    const avatarUrl = payload.picture || "";
    const googleId = payload.sub;

    let user = await User.findOne({ email });

    if (!user) {
      const usernameBase = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 16) || email.split("@")[0];
      let username = usernameBase;
      let suffix = 0;
      while (await User.exists({ username })) {
        suffix += 1;
        username = `${usernameBase}${suffix}`;
      }

      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        username,
        displayName: fullName,
        email,
        password: hashedPassword,
        avatar: avatarUrl,
        role: "viewer",
        googleId,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar && avatarUrl) user.avatar = avatarUrl;
      if (!user.displayName) user.displayName = fullName;
      await user.save();
    }

    const tokenJwt = jwt.sign(
      { id: user._id, role: normalizeRole(user.role) },
      process.env.JWT_SECRET || "123456789",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token: tokenJwt,
      userId: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar,
      role: normalizeRole(user.role),
      roleRequestStatus: user.roleRequestStatus || "none",
    });
  } catch (error) {
    console.error("❌ Google Login Error:", error);
    res.status(500).json({ message: "Lỗi đăng nhập Google" });
  }
};

const createNotImplemented = (name) => async (_req, res) => {
  res.status(501).json({ message: `${name} chưa được triển khai` });
};

exports.requestPosterRole = createNotImplemented("requestPosterRole");
exports.getPendingRequests = createNotImplemented("getPendingRequests");
exports.approveRoleRequest = createNotImplemented("approveRoleRequest");
exports.sendFriendRequest = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "ID nguoi dung khong hop le" });
    }
    if (String(targetId) === String(myId)) {
      return res.status(400).json({ message: "Khong the gui loi moi cho chinh minh" });
    }

    const [me, target] = await Promise.all([
      User.findById(myId),
      User.findById(targetId),
    ]);

    if (!me || !target) return res.status(404).json({ message: "Khong tim thay nguoi dung" });

    if ((me.blockedUsers || []).some((id) => String(id) === String(targetId))) {
      return res.status(400).json({ message: "Ban da chan nguoi nay" });
    }
    if ((target.blockedUsers || []).some((id) => String(id) === String(myId))) {
      return res.status(403).json({ message: "Khong the gui loi moi" });
    }

    if (target.allowFriendRequests === false) {
      return res.status(403).json({ message: "Nguoi dung khong nhan loi moi ket ban" });
    }

    const alreadyFriends = (me.friends || []).some((id) => String(id) === String(targetId));
    const alreadyRequested = (target.friendRequests || []).some((id) => String(id) === String(myId));
    if (alreadyFriends) return res.status(400).json({ message: "Hai nguoi da la ban be" });
    if (alreadyRequested) return res.json({ message: "Da gui loi moi ket ban" });

    target.friendRequests = target.friendRequests || [];
    target.friendRequests.push(myId);
    await target.save();

    res.json({ message: "Da gui loi moi ket ban" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const senderId = req.params.id;
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "ID nguoi dung khong hop le" });
    }

    const [me, sender] = await Promise.all([
      User.findById(myId),
      User.findById(senderId),
    ]);

    if (!me || !sender) return res.status(404).json({ message: "Khong tim thay nguoi dung" });

    const hasRequest = (me.friendRequests || []).some((id) => String(id) === String(senderId));
    if (!hasRequest) return res.status(400).json({ message: "Khong co loi moi ket ban nay" });

    me.friendRequests.pull(senderId);
    if (!(me.friends || []).some((id) => String(id) === String(senderId))) me.friends.push(senderId);
    if (!(sender.friends || []).some((id) => String(id) === String(myId))) sender.friends.push(myId);

    await Promise.all([me.save(), sender.save()]);
    res.json({ message: "Da chap nhan loi moi ket ban" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfriend = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "ID nguoi dung khong hop le" });
    }

    const [me, target] = await Promise.all([
      User.findById(myId),
      User.findById(targetId),
    ]);

    if (!me || !target) return res.status(404).json({ message: "Khong tim thay nguoi dung" });

    me.friends.pull(targetId);
    me.friendRequests.pull(targetId);
    target.friends.pull(myId);
    target.friendRequests.pull(myId);

    await Promise.all([me.save(), target.save()]);
    res.json({ message: "Da cap nhat quan he ban be" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    if (String(targetId) === String(myId)) {
      return res.status(400).json({ message: "Không thể chặn chính mình" });
    }

    const [me, target] = await Promise.all([User.findById(myId), User.findById(targetId)]);
    if (!me || !target) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (!(me.blockedUsers || []).some((id) => String(id) === String(targetId))) {
      me.blockedUsers = me.blockedUsers || [];
      me.blockedUsers.push(targetId);
    }

    me.friends.pull(targetId);
    me.friendRequests.pull(targetId);
    me.following.pull(targetId);
    target.friends.pull(myId);
    target.friendRequests.pull(myId);
    target.followers.pull(myId);
    target.following.pull(myId);
    me.followers.pull(targetId);
    me.following.pull(targetId);

    await Promise.all([me.save(), target.save()]);
    res.json({ message: "Đã chặn người dùng" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const me = await User.findById(myId);
    if (!me) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    me.blockedUsers.pull(targetId);
    await me.save();
    res.json({ message: "Đã bỏ chặn người dùng" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAuthUserId = (req) => {
  const u = req.user;
  if (!u) return null;
  return u.id || u.userId || u._id || u.sub;
};

exports.getProfile = async (req, res) => {
  try {
    const uid = getAuthUserId(req);
    if (!uid) return res.status(401).json({ message: "Chưa đăng nhập" });

    const user = await User.findById(uid)
      .select("-password")
      .populate("friends", "username displayName avatar bio friendRequests")
      .populate("friendRequests", "username displayName avatar bio")
      .populate("blockedUsers", "username displayName avatar")
      .lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({ ...user, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Cập nhật tên hiển thị + bio + quyền riêng tư (JSON), không cần multipart — tránh lỗi Cloudinary/multer khi chỉ sửa chữ */
exports.updateProfileJson = async (req, res) => {
  try {
    const uid = getAuthUserId(req);
    if (!uid) return res.status(401).json({ message: "Chưa đăng nhập" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const { displayName, bio, profileVisibility, allowFriendRequests, showActivity } = req.body || {};
    if (typeof displayName === "string") {
      const trimmed = displayName.trim();
      if (trimmed) user.displayName = trimmed;
    }
    if (typeof bio === "string") {
      user.bio = bio.trim();
    }
    if (profileVisibility && ["public", "friends", "private"].includes(profileVisibility)) {
      user.profileVisibility = profileVisibility;
    }
    if (typeof allowFriendRequests === "boolean") {
      user.allowFriendRequests = allowFriendRequests;
    }
    if (typeof showActivity === "boolean") {
      user.showActivity = showActivity;
    }

    await user.save();
    const out = user.toObject();
    delete out.password;
    res.json({ message: "Cập nhật thành công", user: out });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const uid = getAuthUserId(req);
    if (!uid) return res.status(401).json({ message: "Chưa đăng nhập" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePrivacySettings = async (req, res) => {
  try {
    const uid = getAuthUserId(req);
    if (!uid) return res.status(401).json({ message: "Chưa đăng nhập" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const { profileVisibility, allowFriendRequests, showActivity } = req.body || {};
    if (profileVisibility && ["public", "friends", "private"].includes(profileVisibility)) {
      user.profileVisibility = profileVisibility;
    }
    if (typeof allowFriendRequests === "boolean") {
      user.allowFriendRequests = allowFriendRequests;
    }
    if (typeof showActivity === "boolean") {
      user.showActivity = showActivity;
    }

    await user.save();
    const out = user.toObject();
    delete out.password;
    res.json({
      message: "Cập nhật quyền riêng tư thành công",
      profileVisibility: out.profileVisibility,
      allowFriendRequests: out.allowFriendRequests,
      showActivity: out.showActivity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const uid = getAuthUserId(req);
    if (!uid) return res.status(401).json({ message: "Chưa đăng nhập" });

    const user = await User.findById(uid)
      .populate("blockedUsers", "username displayName avatar")
      .select("blockedUsers")
      .lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const blocked = (user.blockedUsers || []).map((u) => ({
      _id: u._id,
      username: u.username,
      displayName: u.displayName || u.username,
      avatar: u.avatar,
    }));
    res.json(blocked);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.searchUsers = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 50);
    const filter = { _id: { $ne: req.user.id } };

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      filter.$or = [{ username: rx }, { displayName: rx }];
    }

    const users = await User.find(filter)
      .select("username displayName avatar email role followers friends friendRequests")
      .sort({ username: 1 })
      .limit(limit)
      .lean();

    res.json(users.map((user) => ({
      _id: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar,
      email: user.email,
      role: normalizeRole(user.role),
      followersCount: user.followers ? user.followers.length : 0,
      friends: user.friends || [],
      friendRequests: user.friendRequests || [],
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const displayName = req.body?.displayName;
    const bio = req.body?.bio;
    if (typeof displayName === "string") {
      const trimmed = displayName.trim();
      if (trimmed) user.displayName = trimmed;
    }
    if (typeof bio === "string") {
      user.bio = bio.trim();
    }

    const host = `${req.protocol}://${req.get("host")}`;
    const files = req.files || {};
    if (files.avatar?.[0]) {
      const f = files.avatar[0];
      user.avatar = f.path && String(f.path).startsWith("http") ? f.path : `${host}/uploads/${f.filename}`;
    }
    if (files.cover?.[0]) {
      const f = files.cover[0];
      user.cover = f.path && String(f.path).startsWith("http") ? f.path : `${host}/uploads/${f.filename}`;
    }

    await user.save();
    const out = user.toObject();
    delete out.password;
    res.json({ message: "Cập nhật thành công", user: out });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.toggleSavePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "ID bài viết không hợp lệ" });
    }
    const post = await Post.findById(postId).select("_id");
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const idStr = String(postId);
    const already = (user.savedPosts || []).some((id) => String(id) === idStr);
    if (already) {
      user.savedPosts = (user.savedPosts || []).filter((id) => String(id) !== idStr);
    } else {
      user.savedPosts = user.savedPosts || [];
      user.savedPosts.push(new mongoose.Types.ObjectId(postId));
    }
    await user.save();
    const isSaved = !already;
    res.json({ message: isSaved ? "Đã lưu bài" : "Đã bỏ lưu", isSaved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("savedPosts").lean();
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    const ids = user.savedPosts || [];
    if (!ids.length) return res.json([]);

    const posts = await Post.find({ _id: { $in: ids } })
      .populate("createdBy", "username displayName avatar role")
      .populate("community", "name")
      .sort({ createdAt: -1 })
      .lean();

    const normalized = posts.map((obj) => {
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

    // Gử thông báo Follow real-time
    if (!isFollowing) {
      try {
        const { createAndEmitNotification } = require('./notificationController');
        await createAndEmitNotification(req.io, req.connectedUsers, {
          recipient: targetId,
          sender: myId,
          type: 'follow',
          post: null,
          content: 'đã bắt đầu theo dõi bạn.'
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
    }

    res.json({
      following: !isFollowing,
      message: isFollowing ? 'Đã unfollow' : 'Đã follow',
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
      .populate("following", "username avatar bio")
      .populate("friends", "username displayName avatar bio friendRequests");

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    res.json({
      followers: user.followers,
      following: user.following,
      friends: user.friends,
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
    const myId = req.user.id;
    const targetId = req.params.id;

    const [user, me] = await Promise.all([
      User.findById(targetId)
        .select("-password")
        .populate("followers", "username avatar")
        .populate("following", "username avatar")
        .populate("friends", "username avatar"),
      User.findById(myId).select("friendRequests friends")
    ]);

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const posts = await Post.find({
      createdBy: targetId,
      $or: [
        { publishedToProfile: true },
        { community: null },
        { community: { $exists: false } },
      ],
    })
      .populate({
        path: "sharedPost",
        populate: { path: "createdBy", select: "username displayName avatar role" }
      })
      .sort({ createdAt: -1 })
      .limit(20);

    const profile = user.toObject();
    profile.role = normalizeRole(user.role);

    // Calculate friendStatus
    let friendStatus = "none";
    if (me) {
      const isFriend = (me.friends || []).some(id => String(id) === String(targetId));
      const hasSentRequest = (user.friendRequests || []).some(id => String(id) === String(myId));
      const hasReceivedRequest = (me.friendRequests || []).some(id => String(id) === String(targetId));

      if (isFriend) {
        friendStatus = "friends";
      } else if (hasSentRequest) {
        friendStatus = "pending";
      } else if (hasReceivedRequest) {
        friendStatus = "received";
      }
    }
    profile.friendStatus = friendStatus;

    res.json({ user: profile, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👥 LẤY TẤT CẢ USER (Sắp xếp theo số followers)
exports.getAllUsers = async (req, res) => {
  try {
    // Lấy các user và sort theo số followers (tương ứng với độ dài của mảng followers)
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username displayName avatar email role followers")
      .populate("followers", "")
      .sort({ "followers": -1 })
      .limit(50);
    
    // Trả về user với thông tin followers count
    const usersWithFollowerCount = users.map(user => ({
      _id: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar,
      email: user.email,
      role: normalizeRole(user.role),
      followersCount: user.followers ? user.followers.length : 0
    }));

    res.json(usersWithFollowerCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
