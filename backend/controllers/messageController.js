const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Thêm model User để kiểm tra bạn bè

// Helper to convert to ObjectId
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Lấy hoặc tạo conversation giữa 2 người
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) return res.status(400).json({ message: "Thiếu targetUserId" });

    // KIỂM TRA ĐIỀU KIỆN BẠN BÈ
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(targetUserId)) {
      return res.status(403).json({ message: "Bạn chỉ có thể nhắn tin với người đã kết bạn." });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [toObjectId(currentUserId), toObjectId(targetUserId)] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, targetUserId]
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text, receiverId } = req.body;
    const senderId = req.user.id;

    // KIỂM TRA LẠI ĐIỀU KIỆN BẠN BÈ TRƯỚC KHI GỬI TIN (Phòng trường hợp đã unfriend)
    if (receiverId) {
       const currentUser = await User.findById(senderId);
       if (!currentUser.friends.includes(receiverId)) {
         return res.status(403).json({ message: "Không thể gửi tin nhắn. Bạn và người này không còn là bạn bè." });
       }
    }

    const message = await Message.create({
      conversationId,
      sender: senderId,
      text
    });

    // Cập nhật tin nhắn cuối cùng trong conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text
    });

    // Tạo thông báo cho người nhận
    if (receiverId) {
      await Notification.create({
        receiver: receiverId,
        sender: senderId,
        type: "message",
        content: "đã gửi cho bạn một tin nhắn mới.",
        link: `/dashboard` // Frontend sẽ xử lý việc mở chat
      });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy lịch sử tin nhắn
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "username avatar");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};