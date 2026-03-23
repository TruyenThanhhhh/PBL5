const Post = require("../models/Post");

// 📝 CREATE POST
exports.createPost = async (req, res) => {
  try {
    const { title, description, location, category, images } = req.body;

    const newPost = new Post({
      title,
      description,
      location,
      category,
      images,
      createdBy: req.user?.id || null, // tránh crash nếu chưa có middleware
    });

    await newPost.save();

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 GET POSTS + FILTER
exports.getPosts = async (req, res) => {
  try {
    const { location, category } = req.query;

    let filter = {};

    if (location) filter.location = location;
    if (category) filter.category = category;

    const posts = await Post.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❤️ LIKE POST
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (userId) => userId.toString() === req.user.id
    );

    if (alreadyLiked) {
      return res.status(400).json({ message: "Already liked" });
    }

    post.likes.push(req.user.id);
    await post.save();

    res.json({ message: "Post liked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};