const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");

// Khởi tạo thư viện Auth của Google
const { OAuth2Client } = require('google-auth-library');
// Khởi tạo client với ID lấy từ file .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Hàm hỗ trợ chuẩn hóa role
const normalizeRole = (role) => {
  if (typeof role !== "string") return "viewer";
  const r = role.trim().toLowerCase();
  if (r === "user") return "poster";
  return r;
};

// ==========================================
// 🚀 ĐĂNG NHẬP BẰNG GOOGLE (API MỚI)
// ==========================================
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Không tìm thấy Google Token" });
    }

    // 1. Xác thực Token này với Google Server
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,  // Đảm bảo request này dành cho App của bạn
    });

    // 2. Lấy thông tin User từ Google (Payload)
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload; // sub là Google ID duy nhất

    // 3. Kiểm tra xem User này đã tồn tại trong DB chưa
    let user = await User.findOne({ email });

    if (!user) {
      // NẾU CHƯA CÓ TÀI KHOẢN -> TỰ ĐỘNG ĐĂNG KÝ
      // Mật khẩu sẽ được random sinh ra (hoặc lấy chính ID google hash đi) vì họ login qua Google
      const randomPassword = email + sub + process.env.JWT_SECRET;
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Định dạng username: Bỏ khoảng trắng, xóa kí tự đặc biệt để làm username duy nhất
      let baseUsername = name.replace(/\s+/g, '').toLowerCase();
      
      // Kiểm tra trùng username
      let existUsername = await User.findOne({ username: baseUsername });
      if(existUsername) {
        baseUsername = baseUsername + Math.floor(Math.random() * 10000);
      }

      user = await User.create({
        username: baseUsername,
        email: email,
        password: hashedPassword,
        avatar: picture,
        role: "viewer", // Mặc định tài khoản Google mới cấp là viewer
      });
    } else {
      // NẾU ĐÃ CÓ TÀI KHOẢN NHƯNG CHƯA CÓ AVATAR -> Cập nhật avatar từ google
      if (!user.avatar || user.avatar === "") {
         user.avatar = picture;
         await user.save();
      }
    }

    // 4. Sinh Token đăng nhập của riêng hệ thống chúng ta
    const normalizedRole = normalizeRole(user.role);
    const jwtToken = jwt.sign(
      { id: user._id, role: normalizedRole },
      process.env.JWT_SECRET || "123456789",
      { expiresIn: "7d" }
    );

    // 5. Trả dữ liệu về cho Frontend giống hệt Login bình thường
    res.json({ 
      message: "Đăng nhập Google thành công", 
      token: jwtToken, 
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      roleRequestStatus: user.roleRequestStatus
    });

  } catch (error) {
    console.error("Google Login Error in Backend:", error);
    res.status(401).json({ message: "Xác thực Google thất bại hoặc Token hết hạn" });
  }
};

/* STREAMING_CHUNK:Đăng ký và đăng nhập (Manual)... */
// 🚀 ĐĂNG KÝ TÀI KHOẢN BẰNG TAY (CŨ)
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

// 🚀 ĐĂNG NHẬP BẰNG TAY (CŨ)
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    const cleanIdentifier = identifier.trim();

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier }, 
        { username: cleanIdentifier }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu!" });
    }

    const normalizedRole = normalizeRole(user.role);
    const token = jwt.sign(
      { id: user._id, role: normalizedRole },
      process.env.JWT_SECRET || "123456789",
      { expiresIn: "7d" }
    );

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
    res.status(500).json({ message: "Lỗi Server!" });
  }
};

/* STREAMING_CHUNK:Hệ thống bạn bè... */
// ==========================================
// 🤝 HỆ THỐNG BẠN BÈ 
// ==========================================

// 1. Gửi hoặc Hủy yêu cầu kết bạn
exports.sendFriendRequest = async (req, res) => {
  try {
    const targetId = req.params.id; // Người mình muốn kết bạn
    const myId = req.user.id;

    if (targetId === myId) return res.status(400).json({ message: "Không thể tự kết bạn" });

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: "User không tồn tại" });

    // Kiểm tra xem đã là bạn chưa
    if (targetUser.friends.includes(myId)) {
      return res.status(400).json({ message: "Đã là bạn bè" });
    }

    const isRequested = targetUser.friendRequests.includes(myId);

    if (isRequested) {
      // Nếu ĐÃ GỬI => HỦY YÊU CẦU (Hoàn tác)
      targetUser.friendRequests.pull(myId);
      await targetUser.save();
      
      // (Tùy chọn) Xóa thông báo cũ nếu muốn
      await Notification.findOneAndDelete({ receiver: targetId, sender: myId, type: "friend_request" });

      return res.json({ status: "none", message: "Đã hủy lời mời kết bạn" });
    } else {
      // CHƯA GỬI => TIẾN HÀNH GỬI
      targetUser.friendRequests.push(myId);
      await targetUser.save();

      // Gửi thông báo
      const notif = await Notification.create({
        receiver: targetId,
        sender: myId,
        type: "friend_request",
        content: "đã gửi cho bạn một lời mời kết bạn.",
        link: `/profile`
      });

      // Emit realtime if possible
      const io = req.app.get('io');
      if (io) {
        const me = await User.findById(myId).select("username avatar");
        io.emit(`notification_${targetId}`, {
          ...notif.toObject(),
          sender: { _id: me._id, username: me.username, avatar: me.avatar }
        });
      }

      return res.json({ status: "pending", message: "Đã gửi lời mời kết bạn" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Chấp nhận yêu cầu kết bạn
exports.acceptFriendRequest = async (req, res) => {
  try {
    const senderId = req.params.id; // Người đã gửi lời mời
    const myId = req.user.id; // Mình (người nhận)

    const [me, sender] = await Promise.all([
      User.findById(myId),
      User.findById(senderId)
    ]);

    if (!me || !sender) return res.status(404).json({ message: "User không tồn tại" });

    // Kiểm tra xem có lời mời không
    if (!me.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    // Chấp nhận: Bỏ khỏi mảng request, thêm vào mảng friends của cả 2
    me.friendRequests.pull(senderId);
    me.friends.push(senderId);
    sender.friends.push(myId);

    await Promise.all([me.save(), sender.save()]);

    // Thông báo cho người gửi là mình đã chấp nhận
    const notif = await Notification.create({
      receiver: senderId,
      sender: myId,
      type: "system",
      content: "đã chấp nhận lời mời kết bạn của bạn.",
      link: `/profile`
    });

    // Emit realtime if possible
    const io = req.app.get('io');
    if (io) {
      io.emit(`notification_${senderId}`, {
        ...notif.toObject(),
        sender: { _id: me._id, username: me.username, avatar: me.avatar }
      });
    }

    res.json({ status: "friends", message: "Đã trở thành bạn bè" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Xóa bạn bè (Unfriend) / Từ chối lời mời
exports.unfriend = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    const [me, target] = await Promise.all([
      User.findById(myId),
      User.findById(targetId)
    ]);

    if (!me || !target) return res.status(404).json({ message: "User không tồn tại" });

    // Xóa khỏi danh sách bạn bè
    if (me.friends.includes(targetId)) {
      me.friends.pull(targetId);
      target.friends.pull(myId);
    }

    // Nếu đây là hành động từ chối lời mời (reject request)
    if (me.friendRequests.includes(targetId)) {
        me.friendRequests.pull(targetId);
    }

    await Promise.all([me.save(), target.save()]);

    res.json({ status: "none", message: "Đã hủy kết bạn/từ chối lời mời" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* STREAMING_CHUNK:Follow, Profile, Feed... */
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

    const isFollowing = me.following.some(id => id.toString() === targetId);

    if (isFollowing) {
      me.following.pull(targetId);
      target.followers.pull(myId);
    } else {
      me.following.push(targetId);
      target.followers.push(myId);
    }

    await Promise.all([me.save(), target.save()]);

    if (!isFollowing) {
      await Notification.create({
        receiver: targetId,
        sender: myId,
        type: "system", 
        content: "đã bắt đầu theo dõi bạn.",
        link: `/profile`
      });
    }

    res.json({
      following: !isFollowing,
      message: isFollowing ? "Đã unfollow" : "Đã follow",
      followersCount: target.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🚫 BLOCK USER
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    if (targetId === myId) return res.status(400).json({ message: "Không thể tự chặn chính mình" });

    const me = await User.findById(myId);
    if (!me.blockedUsers.includes(targetId)) {
      me.blockedUsers.push(targetId);
      // Khi chặn thì đồng thời unfriend luôn cho chắc
      me.friends.pull(targetId);
      const target = await User.findById(targetId);
      if (target) {
        target.friends.pull(myId);
        await target.save();
      }
      await me.save();
    }

    res.json({ message: "Đã chặn người dùng này" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔓 UNBLOCK USER
exports.unblockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    const me = await User.findById(myId);
    me.blockedUsers.pull(targetId);
    await me.save();

    res.json({ message: "Đã bỏ chặn người dùng này" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const myId = req.user.id;

    const query = {
      role: { $ne: "admin" },
      _id: { $ne: myId }
    };

    if (q) {
      query.username = { $regex: q, $options: "i" };
    }

    const users = await User.find(query).select("username avatar role followers following friends friendRequests"); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    let hasChanged = false;
    let changeType = "";

    if (req.files) {
      if (req.files.avatar) {
        user.avatar = req.files.avatar[0].path;
        hasChanged = true;
        changeType = changeType ? "both" : "avatar";
      }
      if (req.files.cover) {
        user.cover = req.files.cover[0].path;
        hasChanged = true;
        changeType = changeType ? "both" : "cover";
      }
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    await user.save();

    if (hasChanged) {
      let title = "";
      let images = [];

      if (changeType === "avatar") {
        title = `${user.username} đã cập nhật ảnh đại diện mới`;
        images = [user.avatar];
      } else if (changeType === "cover") {
        title = `${user.username} đã cập nhật ảnh bìa mới`;
        images = [user.cover];
      } else {
        title = `${user.username} đã làm mới trang cá nhân`;
        images = [user.avatar, user.cover];
      }

      await Post.create({
        title,
        description: `Mọi người thấy thế nào? ✨`,
        images,
        createdBy: user._id,
        category: "System",
        location: "Cập nhật hồ sơ"
      });
    }

    res.json({ message: "Cập nhật thành công", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("following friends");
    const targetUsers = [...new Set([...me.following, ...me.friends])];

    if (!targetUsers.length) {
      return res.json({ posts: [], message: "Hãy kết bạn hoặc follow ai đó để xem feed" });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const posts = await Post.find({ createdBy: { $in: targetUsers } })
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ createdBy: { $in: targetUsers } });

    res.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "username avatar bio")
      .populate("following", "username avatar bio")
      .populate("friends", "username avatar bio"); 

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    res.json({
      followers: user.followers,
      following: user.following,
      friends: user.friends,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      friendsCount: user.friends.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* STREAMING_CHUNK:Merge chức năng getUserProfile (lọc Community)... */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username avatar")
      .populate("following", "username avatar")
      .populate("friends", "username avatar"); 

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    // ✅ ĐÃ SỬA: Lọc posts theo Community (Tích hợp dựa trên image Github)
    const posts = await Post.find({ 
      createdBy: req.params.id,
      $or: [
        { publishedToProfile: true },
        { community: null },
        { community: { $exists: false } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    let friendStatus = "none";
    if (req.user) {
        if (user.friends.some(f => f._id.toString() === req.user.id)) friendStatus = "friends";
        else if (user.friendRequests.includes(req.user.id)) friendStatus = "pending"; 
    }

    const userResponse = user.toObject();
    userResponse.friendStatus = friendStatus;

    res.json({ user: userResponse, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* STREAMING_CHUNK:Các tính năng quản lý quyền, profile, password... */
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

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
        .select("-password")
        .populate("friendRequests", "username avatar"); 
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleSavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const postId = req.params.postId;

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const isSaved = user.savedPosts.includes(postId);
    if (isSaved) {
      user.savedPosts.pull(postId);
      await user.save();
      return res.json({ message: "Đã bỏ lưu bài viết", isSaved: false });
    } else {
      user.savedPosts.push(postId);
      await user.save();
      return res.json({ message: "Đã lưu bài viết", isSaved: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedPosts',
      populate: { path: 'createdBy', select: 'username avatar' }
    });
    
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    
    res.json(user.savedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};