const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Post = require("../models/Post");

const messagePopulate = [
  { path: "sender", select: "username displayName avatar" },
  {
    path: "sharedPost",
    select: "title description images location createdBy",
    populate: { path: "createdBy", select: "username displayName avatar" },
  },
];

const emitReceiveMessage = async (req, messageDoc) => {
  const io = req.app.get("io");
  if (!io || !messageDoc) return;

  const populated = await Message.findById(messageDoc._id).populate(messagePopulate).lean();
  if (!populated) return;

  io.to(String(populated.conversationId)).emit("receive_message", {
    _id: populated._id,
    conversationId: String(populated.conversationId),
    text: populated.text,
    image: populated.image,
    messageType: populated.messageType,
    sharedPost: populated.sharedPost || null,
    readBy: populated.readBy || [],
    sender: populated.sender,
    createdAt: populated.createdAt,
  });
};

// Helper to convert to ObjectId
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Lấy danh sách tất cả conversations của user hiện tại
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const user = await User.findById(currentUserId).select("deletedConversations");
    
    const conversations = await Conversation.find({
      participants: currentUserId,
      _id: { $nin: user.deletedConversations || [] }
    })
    .populate("participants", "username displayName avatar")
    .sort({ updatedAt: -1 });

    const uniqueConversations = [];
    const seen1to1Users = new Set();

    for (const conv of conversations) {
      if (conv.isGroup) {
        uniqueConversations.push(conv);
      } else {
        const otherParticipant = conv.participants.find(p => p && p._id && p._id.toString() !== currentUserId);
        if (otherParticipant) {
          const otherId = otherParticipant._id.toString();
          if (!seen1to1Users.has(otherId)) {
            seen1to1Users.add(otherId);
            uniqueConversations.push(conv);
          }
        } else {
          uniqueConversations.push(conv);
        }
      }
    }

    res.status(200).json(uniqueConversations);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Tạo group chat
exports.createGroupConversation = async (req, res) => {
  try {
    const { groupName, participantIds } = req.body;
    const currentUserId = req.user.id;

    if (!groupName || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng cung cấp tên nhóm và chọn ít nhất 1 thành viên." });
    }

    // Đảm bảo người tạo luôn ở trong nhóm
    const allParticipants = [currentUserId, ...participantIds];
    
    // Loại bỏ duplicate ids
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
      isGroup: false,
      $or: [
        { participants: { $size: 2, $all: [toObjectId(currentUserId), toObjectId(targetUserId)] } },
        { participants: { $size: 2, $all: [currentUserId, targetUserId] } }
      ]
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [toObjectId(currentUserId), toObjectId(targetUserId)],
        isGroup: false
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
    const { conversationId, text, receiverId, image, postId } = req.body;
    const senderId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    // KIỂM TRA LẠI ĐIỀU KIỆN BẠN BÈ NẾU LÀ CHAT 1-1
    if (!conversation.isGroup && receiverId) {
       const currentUser = await User.findById(senderId);
       if (!currentUser.friends.includes(receiverId)) {
         return res.status(403).json({ message: "Không thể gửi tin nhắn. Bạn và người này không còn là bạn bè." });
       }
    }

    const payload = {
      conversationId,
      sender: senderId,
      text: text || "",
      image: image || null,
      readBy: [senderId],
    };

    let lastPreview = text || (image ? "Đã gửi ảnh" : "");

    if (postId) {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }
      payload.sharedPost = postId;
      payload.messageType = "post";
      if (!payload.text) payload.text = "Đã chia sẻ một bài viết";
      lastPreview = "Đã chia sẻ bài viết";
    } else if (image) {
      payload.messageType = "image";
    } else if (!payload.text) {
      return res.status(400).json({ message: "Tin nhắn không được để trống" });
    }

    const message = await Message.create(payload);

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: lastPreview,
    });

    // Tạo thông báo cho người nhận (nếu chat 1-1) hoặc cho các thành viên nhóm
    if (conversation.isGroup) {
      // Gửi thông báo cho tất cả mọi người trong nhóm trừ sender
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
      const notif = await Notification.create({
        receiver: receiverId,
        sender: senderId,
        type: "message",
        content: "đã gửi cho bạn một tin nhắn mới.",
        link: `/dashboard` // Frontend sẽ xử lý việc mở chat
      });

      // Emit realtime if possible
      const io = req.app.get('io');
      if (io) {
        const me = await User.findById(senderId).select("username avatar");
        io.emit(`notification_${receiverId}`, {
          ...notif.toObject(),
          sender: { _id: me._id, username: me.username, avatar: me.avatar }
        });
      }
    }

    await emitReceiveMessage(req, message);

    const populated = await Message.findById(message._id).populate(messagePopulate);
    res.status(201).json(populated);
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
      .populate(messagePopulate)
      .populate("readBy", "username avatar");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 👀 ĐÁNH DẤU ĐÃ XEM
exports.markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    // Emit event socket nếu cần (sẽ xử lý ở server.js)
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit("message_seen", { conversationId, userId });
    }

    res.status(200).json({ message: "Đã đánh dấu đã xem" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 🗑️ XÓA CUỘC TRÒ CHUYỆN (Ẩn đi)
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $addToSet: { deletedConversations: conversationId }
    });

    res.status(200).json({ message: "Đã xóa cuộc trò chuyện" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};