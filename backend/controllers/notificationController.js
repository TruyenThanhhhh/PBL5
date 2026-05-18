const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user._id })
      .sort({ createdAt: -1 })
      .populate("sender", "username avatar")
      .limit(20);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ receiver: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ message: "Đã đánh dấu tất cả đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
