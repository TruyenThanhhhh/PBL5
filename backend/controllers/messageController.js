const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Post = require("../models/Post");
const { checkHardBan } = require("../utils/moderation");
const { checkContextualToxicity } = require("../utils/contentModerator");
const { moderateImage } = require("../utils/imageModerator");

const runAsyncAIModeration = async (io, conversationId, messageDoc, text, imageUrl) => {
  try {
    // 1. Text Moderation
    if (text) {
      const toxicity = await checkContextualToxicity(text);
      if (toxicity.action === "block") {
        console.log(`🚫 Thu hồi tin nhắn [${messageDoc._id}] vì điểm Toxicity: ${toxicity.score}`);
        await Message.findByIdAndUpdate(messageDoc._id, { 
          isRevoked: true, 
          text: "Tin nhắn đã bị thu hồi do vi phạm tiêu chuẩn cộng đồng." 
        });
        io.to(String(conversationId)).emit("revoke_message", {
          messageId: messageDoc._id,
          reason: "Vi phạm tiêu chuẩn cộng đồng",
          newText: "Tin nhắn đã bị thu hồi do vi phạm tiêu chuẩn cộng đồng."
        });
        return;
      }
    }
    // 2. Image Moderation
    if (imageUrl) {
      const imgUrlString = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
      console.log(`🖼️ [Image Moderation] Bắt đầu xử lý ảnh chat URL: ${imgUrlString}`);
      if (typeof imgUrlString === 'string' && imgUrlString.startsWith('http')) {
        const response = await fetch(imgUrlString);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          let contentType = response.headers.get("content-type");
          console.log(`🖼️ [Image Moderation] Tải ảnh thành công, Content-Type: ${contentType}`);
          
          if (!contentType || contentType === 'application/octet-stream' || contentType.includes('binary')) {
             contentType = "image/jpeg";
          }

          if (contentType.startsWith("image/")) {
            const isSafe = await moderateImage(Buffer.from(buffer), contentType);
            if (!isSafe) {
              console.log(`⚠️ Đánh dấu ảnh nhạy cảm cho tin nhắn [${messageDoc._id}]`);
              await Message.findByIdAndUpdate(messageDoc._id, { isSensitive: true });
              io.to(String(conversationId)).emit("mark_image_sensitive", {
                messageId: messageDoc._id,
                isSensitive: true
              });

              // Gửi báo cáo cho Admin
              const Report = require("../models/Report");
              await Report.create({
                reporter: null, // System AI
                targetType: "message",
                targetMessage: messageDoc._id,
                targetUser: messageDoc.sender, // Người gửi
                reason: "Hệ thống AI phát hiện ảnh nhạy cảm/bạo lực",
                details: "Hình ảnh trong tin nhắn có chứa yếu tố bạo lực, máu me hoặc nhạy cảm.",
                status: "pending"
              });

              // Báo cho Admin qua Socket nếu cần update UI realtime
              const User = require("../models/User");
              const admins = await User.find({ role: "admin" });
              for (const admin of admins) {
                io.emit(`notification_${admin._id}`, {
                  type: "system",
                  content: "Có một báo cáo vi phạm mới từ hệ thống AI.",
                  link: "/admin/reports" 
                });
              }
            }
          } else {
             console.log(`⚠️ [Image Moderation] Bỏ qua kiểm duyệt do không phải định dạng ảnh: ${contentType}`);
          }
        } else {
          console.error(`❌ [Image Moderation] Lỗi tải URL ảnh từ chat. Status: ${response.status}`);
        }
      } else {
        console.warn(`⚠️ [Image Moderation] URL không hợp lệ: ${imgUrlString}`);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi luồng AI chạy ngầm:", err.message);
  }
};

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

  const conv = await Conversation.findById(populated.conversationId);
  if (conv) {
    const messageData = {
      _id: populated._id,
      conversationId: String(populated.conversationId),
      text: populated.text,
      image: populated.image,
      messageType: populated.messageType,
      sharedPost: populated.sharedPost || null,
      readBy: populated.readBy || [],
      sender: populated.sender,
      createdAt: populated.createdAt,
    };
    conv.participants.forEach((p) => {
      io.to(String(p)).emit("receive_message", messageData);
    });
  }
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

    const populatedConversations = [];
    for (const conv of uniqueConversations) {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        readBy: { $ne: currentUserId }
      });
      const convObj = conv.toObject();
      convObj.unreadCount = unreadCount;

      // Query the last message details for this conversation
      const lastMsgDoc = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .populate("sender", "username displayName avatar");

      if (lastMsgDoc) {
        convObj.lastMessageDetails = {
          text: lastMsgDoc.text,
          sender: lastMsgDoc.sender ? {
            _id: lastMsgDoc.sender._id,
            username: lastMsgDoc.sender.username,
            displayName: lastMsgDoc.sender.displayName
          } : null,
          messageType: lastMsgDoc.messageType,
          image: lastMsgDoc.image
        };
      }

      populatedConversations.push(convObj);
    }

    res.status(200).json(populatedConversations);
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

    // --- KIỂM DUYỆT AI: Khi gửi tin nhắn ---
    if (text && text.trim()) {
      if (checkHardBan(text.trim())) {
        return res.status(400).json({ 
          message: "Tin nhắn của bạn chứa từ ngữ vi phạm tiêu chuẩn cộng đồng." 
        });
      }
    }

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
      const io = req.app.get('io');
      const me = await User.findById(senderId).select("username avatar");
      for (const recId of receivers) {
        const notif = await Notification.create({
          receiver: recId,
          sender: senderId,
          type: "message",
          content: `đã gửi tin nhắn vào nhóm ${conversation.groupName}.`,
          link: `/dashboard`
        });
        if (io) {
          io.emit(`notification_${recId}`, {
            ...notif.toObject(),
            sender: { _id: me._id, username: me.username, avatar: me.avatar }
          });
        }
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

    // Call async moderation AFTER sending response
    const io_instance = req.app.get('io');
    if (io_instance) {
      runAsyncAIModeration(io_instance, conversationId, message, text, image);
    }
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