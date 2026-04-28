const Notification = require('../models/Notification');

// Helper: Tạo và gửi thông báo real-time
const createAndEmitNotification = async (io, connectedUsers, { recipient, sender, type, post, content }) => {
  // Không tự thông báo cho chính mình
  if (recipient.toString() === sender.toString()) return;

  const notif = await Notification.create({ recipient, sender, type, post, content });
  const populated = await notif.populate('sender', 'username avatar');

  // Gửi thông báo real-time qua Socket nếu người nhận đang online
  const recipientSocketId = connectedUsers[recipient.toString()];
  if (recipientSocketId && io) {
    io.to(recipientSocketId).emit('newNotification', populated);
  }
  return populated;
};

// GET /api/notifications - Lấy danh sách thông báo (từ bạn bè)
exports.getNotifications = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    // Lấy danh sách những người mà user đang theo dõi (bạn bè)
    const friendIds = user.following || [];
    
    // Chỉ lấy thông báo từ bạn bè
    const notifications = await Notification.find({ 
      recipient: req.user.id,
      sender: { $in: friendIds }
    })
      .populate('sender', 'username avatar')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/:id/read - Đánh dấu 1 thông báo đã đọc
exports.markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Đã đọc' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    // Lấy danh sách những người mà user đang theo dõi (bạn bè)
    const friendIds = user.following || [];
    
    // Chỉ đếm thông báo chưa đọc từ bạn bè
    const count = await Notification.countDocuments({ 
      recipient: req.user.id, 
      isRead: false,
      sender: { $in: friendIds }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAndEmitNotification = createAndEmitNotification;
