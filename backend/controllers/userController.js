const User = require("../models/user");
const Post = require("../models/Post");

// ➕ FOLLOW / UNFOLLOW USER
exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;   // người muốn follow
    const myId = req.user.id;          // người đang đăng nhập

    if (targetId === myId)
      return res.status(400).json({ message: "Không thể follow chính mình" });

    const [me, target] = await Promise.all([
      User.findById(myId),
      User.findById(targetId),
    ]);

    if (!target) return res.status(404).json({ message: "User không tồn tại" });

    const isFollowing = me.following.includes(targetId);

    if (isFollowing) {
      // Unfollow
      me.following.pull(targetId);
      target.followers.pull(myId);
    } else {
      // Follow
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

// 📰 GET FEED (bài post của những người mình follow)
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

// 👤 GET USER PROFILE + bài đăng của họ
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