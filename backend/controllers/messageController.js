const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");

// --- IMPORT HÀM KIỂM DUYỆT BẰNG AI ---
const { checkTextModeration } = require("../utils/contentModerator");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const conversations = await Conversation.find({
      participants: currentUserId
    })
    .populate("participants", "username avatar")
    .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.createGroupConversation = async (req, res) => {
  try {
    const { groupName, participantIds } = req.body;
    const currentUserId = req.user.id;

    if (!groupName || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên nhóm và chọn ít nhất 1 thành viên." });
    }

    const allParticipants = [currentUserId, ...participantIds];
    const uniqueParticipants = [...new Set(allParticipants)];

    const conversation = await Conversation.create({
      participants: uniqueParticipants,
      isGroup: true,
      groupName,
      groupAdmin: currentUserId
    });

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) return res.status(400).json({ message: "Thiếu targetUserId" });

    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(targetUserId)) {
      return res.status(403).json({ message: "Bạn chỉ có thể nhắn tin với người đã kết bạn." });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [toObjectId(currentUserId), toObjectId(targetUserId)] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, targetUserId],
        isGroup: false
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text, receiverId } = req.body;
    const senderId = req.user.id;

    // --- KIỂM DUYỆT AI: Khi gửi tin nhắn ---
    if (text && text.trim()) {
      const isSafe = await checkTextModeration(text.trim());
      if (!isSafe) {
        return res.status(400).json({ 
          message: "Tin nhắn của bạn chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." 
        });
      }
    }
    // ----------------------------------------------

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    if (!conversation.isGroup && receiverId) {
       const currentUser = await User.findById(senderId);
       if (!currentUser.friends.includes(receiverId)) {
         return res.status(403).json({ message: "Không thể gửi tin nhắn. Bạn và người này không còn là bạn bè." });
       }
    }

    let message = await Message.create({
      conversationId,
      sender: senderId,
      text
    });

    // Populate sender name & avatar để FE render ngay lập tức qua Socket
    await message.populate("sender", "username avatar");

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text
    });

    // --- PHÁT SỰ KIỆN REALTIME QUA SOCKET.IO ---
    const io = req.app.get("io");
    if (io) {
      if (conversation.isGroup) {
        // Gửi tới room của Group (Tất cả thành viên đang join room sẽ nhận được)
        io.to(conversationId.toString()).emit("receive_message", {
          ...message.toObject(),
          groupId: conversationId.toString()
        });
      } else if (receiverId) {
        // Gửi thẳng vào room cá nhân của người nhận
        io.to(receiverId.toString()).emit("receive_message", {
          ...message.toObject(),
          conversationId: conversationId.toString()
        });
      }
    }
    // -------------------------------------------

    if (conversation.isGroup) {
      const receivers = conversation.participants.filter(p => p.toString() !== senderId);
      for (const recId of receivers) {
        await Notification.create({
          receiver: recId,
          sender: senderId,
          type: "message",
          content: `đã gửi tin nhắn vào nhóm ${conversation.groupName}.`,
          link: `/dashboard`
        });
      }
    } else if (receiverId) {
      await Notification.create({
        receiver: receiverId,
        sender: senderId,
        type: "message",
        content: "đã gửi cho bạn một tin nhắn mới.",
        link: `/dashboard`
      });
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

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