const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const senderId = req.user.id;

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

    // Lấy thông tin user để emit
    const populatedMessage = await Message.findById(newMessage._id).populate("sender", "username avatar");

    // Tạo thông báo tin nhắn cho mỗi người nhận
    const { createAndEmitNotification } = require('./notificationController');
    const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId.toString());
    for (const recipientId of otherParticipants) {
      await createAndEmitNotification(req.io, req.connectedUsers, {
        recipient: recipientId,
        sender: senderId,
        type: 'message',
        content: `đã gửi cho bạn một tin nhắn: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
      });
    }

    // Phát socket cho conversation room
    if (req.io) {
      req.io.to(conversation._id.toString()).emit("newMessage", populatedMessage);
    }

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
