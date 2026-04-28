const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// HÀM BỔ TRỢ: Tự động lấy ID dù Token dùng chuẩn cũ hay chuẩn mới
const getUserId = (req) => req.user?.userId || req.user?.id || req.user?._id;

exports.getConversations = async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversations = await Conversation.find({ participants: { $in: [userId] } })
      .populate("participants", "username avatar")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "Missing targetUserId" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate("participants", "username avatar");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, targetUserId],
      });
      conversation = await conversation.populate("participants", "username avatar");
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate("sender", "username")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text, conversationId } = req.body;
    const senderId = getUserId(req);

    if (!text) return res.status(400).json({ message: "Empty message" });

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else if (receiverId) {
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }
    } else {
      return res.status(400).json({ message: "Missing conversationId or receiverId" });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text: text,
    });

    conversation.lastMessage = {
      text,
      sender: senderId,
      createdAt: newMessage.createdAt,
    };
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id).populate("sender", "username avatar");

    // Gửi thông báo an toàn, không sập server nếu thiếu Notification controller
    try {
        const { createAndEmitNotification } = require('./notificationController');
        if (createAndEmitNotification) {
            const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId.toString());
            for (const recipientId of otherParticipants) {
                await createAndEmitNotification(req.io, req.connectedUsers, {
                    recipient: recipientId,
                    sender: senderId,
                    type: 'message',
                    content: `đã gửi cho bạn một tin nhắn: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
                });
            }
        }
    } catch (e) {
        console.warn("Bỏ qua thông báo: ", e.message);
    }

    if (req.io) {
      req.io.to(conversation._id.toString()).emit("newMessage", populatedMessage);
    }

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};