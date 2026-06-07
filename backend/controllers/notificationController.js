const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id })
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
    await Notification.updateMany({ receiver: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: "Đã đánh dấu tất cả đã đọc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.createAndEmitNotification = async (io, connectedUsers, data) => {
  try {
    const { recipient, sender, type, post, comment, content } = data;
    
    // Validate recipient
    if (!recipient) {
      console.warn("createAndEmitNotification: Recipient is missing, skipping.");
      return;
    }

    // Don't create notification if recipient is the sender
    if (String(recipient) === String(sender)) {
      return;
    }

    const newNotif = await Notification.create({
      receiver: recipient,
      sender,
      type,
      post: post || undefined,
      comment: comment || undefined,
      content,
      link: post ? `/post-detail` : undefined
    });

    const populatedNotif = await Notification.findById(newNotif._id)
      .populate("sender", "username avatar")
      .lean();

    const activeIo = io || global.io;
    if (activeIo) {
      activeIo.to(String(recipient)).emit(`notification_${recipient}`, populatedNotif);
    }
    
    return populatedNotif;
  } catch (err) {
    console.error("Error creating and emitting notification:", err.message);
  }
};
