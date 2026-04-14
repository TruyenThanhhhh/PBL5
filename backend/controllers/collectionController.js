const Collection = require('../models/Collection');

// GET /api/collections - Lấy tất cả bộ sưu tập của user hiện tại
exports.getMyCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id })
      .populate('posts', 'title images location')
      .sort({ updatedAt: -1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/collections - Tạo bộ sưu tập mới
exports.createCollection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên bộ sưu tập không được trống' });

    const existing = await Collection.findOne({ user: req.user.id, name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Bộ sưu tập này đã tồn tại' });

    const collection = await Collection.create({ user: req.user.id, name: name.trim() });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/collections/:id/toggle - Thêm/xóa bài viết khỏi bộ sưu tập
exports.togglePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const collection = await Collection.findOne({ _id: req.params.id, user: req.user.id });
    if (!collection) return res.status(404).json({ message: 'Không tìm thấy bộ sưu tập' });

    const postIndex = collection.posts.findIndex(p => p.toString() === postId);
    let action;
    if (postIndex > -1) {
      collection.posts.splice(postIndex, 1);
      action = 'removed';
    } else {
      collection.posts.push(postId);
      action = 'added';
      // Cập nhật ảnh bìa nếu chưa có
      if (!collection.coverImage) {
        const Post = require('../models/Post');
        const post = await Post.findById(postId).select('images');
        if (post?.images?.length > 0) collection.coverImage = post.images[0];
      }
    }

    await collection.save();
    res.json({ message: action === 'added' ? 'Đã lưu vào bộ sưu tập' : 'Đã xóa khỏi bộ sưu tập', action, collection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/collections/:id - Xóa bộ sưu tập
exports.deleteCollection = async (req, res) => {
  try {
    await Collection.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Đã xóa bộ sưu tập' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/collections/check/:postId - Kiểm tra bài viết đã được lưu chưa
exports.checkSaved = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id, posts: req.params.postId });
    res.json({ savedIn: collections.map(c => c._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
