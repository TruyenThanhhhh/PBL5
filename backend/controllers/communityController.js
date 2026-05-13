const mongoose = require("mongoose");
const Community = require("../models/Community");
const Post = require("../models/Post");
const { normalizeCommunityKey } = require("../utils/communityName");

function userIdFromReq(req) {
  const raw = req.user?.id ?? req.user?._id ?? req.user?.userId;
  if (raw == null || raw === "") return null;
  const s = String(raw);
  return mongoose.Types.ObjectId.isValid(s) ? new mongoose.Types.ObjectId(s) : s;
}

function viewerAccess(community, uid) {
  if (!community || !uid) return { isOwner: false, isMember: false, isPending: false };
  const userIdStr = String(uid);
  const ownerId = String(community.createdBy?._id || community.createdBy);
  const isOwner = ownerId === userIdStr;
  const isMember =
    isOwner ||
    (community.members || []).some((m) => String(m._id || m) === userIdStr);
  const isPending = (community.pendingMembers || []).some((m) => String(m._id || m) === userIdStr);
  return { isOwner, isMember, isPending };
}

exports.listCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "username displayName avatar")
      .lean();
    const withCounts = await Promise.all(
      communities.map(async (c) => {
        const postCount = await Post.countDocuments({ community: c._id, isHidden: false });
        return { ...c, postCount, memberCount: Array.isArray(c.members) ? c.members.length : 0 };
      })
    );
    res.json(withCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Chỉ cộng đồng user đã tạo hoặc đã là thành viên; pending = đang chờ duyệt */
exports.listMyCommunities = async (req, res) => {
  try {
    const uid = userIdFromReq(req);
    if (!uid) {
      return res.status(401).json({ message: "Token không hợp lệ (thiếu id người dùng)" });
    }
    const joined = await Community.find({
      $or: [{ createdBy: uid }, { members: uid }],
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username displayName avatar")
      .lean();

    const pending = await Community.find({ pendingMembers: uid })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username displayName avatar")
      .lean();

    const mapJoined = await Promise.all(
      joined.map(async (c) => {
        const postCount = await Post.countDocuments({ community: c._id, isHidden: false });
        const memberCount = Array.isArray(c.members) ? c.members.length : 0;
        const creatorId = String(c.createdBy?._id || c.createdBy);
        const myRole = creatorId === String(uid) ? "owner" : "member";
        return { ...c, postCount, memberCount, myRole };
      })
    );

    const mapPending = await Promise.all(
      pending.map(async (c) => {
        const postCount = await Post.countDocuments({ community: c._id, isHidden: false });
        const memberCount = Array.isArray(c.members) ? c.members.length : 0;
        return { ...c, postCount, memberCount, myRole: "pending" };
      })
    );

    res.json({ joined: mapJoined, pending: mapPending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCommunity = async (req, res) => {
  try {
    const uid = userIdFromReq(req);
    if (!uid) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const community = await Community.findById(req.params.id)
      .populate("createdBy", "username displayName avatar")
      .populate("members", "username displayName avatar")
      .populate("pendingMembers", "username displayName avatar");

    if (!community) return res.status(404).json({ message: "Không tìm thấy cộng đồng" });

    const { isOwner, isMember, isPending } = viewerAccess(community, uid);
    if (!isMember && !isPending) {
      return res.status(403).json({ message: "Bạn không có quyền xem cộng đồng này" });
    }

    const obj = community.toObject();
    obj.isOwner = isOwner;
    obj.isMember = isMember;
    obj.isPending = isPending && !isMember;
    const postCount = await Post.countDocuments({ community: community._id, isHidden: false });
    obj.postCount = postCount;
    obj.memberCount = Array.isArray(obj.members) ? obj.members.length : 0;
    obj.pendingCount = Array.isArray(obj.pendingMembers) ? obj.pendingMembers.length : 0;

    if (!isOwner) {
      delete obj.pendingMembers;
    }

    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Tên cộng đồng là bắt buộc" });
    }
    const userId = userIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });

    const trimmedName = String(name).trim();
    const nameKey = normalizeCommunityKey(trimmedName);
    const exists = await Community.findOne({ nameKey });
    if (exists) {
      return res.status(400).json({
        message:
          "Đã có cộng đồng với tên này (không phân biệt chữ hoa/thường và khoảng trắng thừa).",
      });
    }

    const community = await Community.create({
      name: trimmedName,
      nameKey,
      description: description != null ? String(description).trim() : "",
      createdBy: userId,
      members: [userId],
      pendingMembers: [],
    });
    const populated = await Community.findById(community._id)
      .populate("createdBy", "username displayName avatar")
      .lean();
    res.status(201).json({ message: "Đã tạo cộng đồng", community: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Không tìm thấy cộng đồng" });
    const userId = userIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    const uidStr = String(userId);

    if (String(community.createdBy) === uidStr) {
      const updated = await Community.findById(community._id)
        .populate("createdBy", "username displayName avatar")
        .populate("members", "username displayName avatar");
      return res.json({ message: "Bạn là chủ cộng đồng", community: updated });
    }

    const inMembers = community.members.some((m) => String(m) === uidStr);
    if (inMembers) {
      const updated = await Community.findById(community._id)
        .populate("createdBy", "username displayName avatar")
        .populate("members", "username displayName avatar");
      return res.json({ message: "Bạn đã là thành viên", community: updated });
    }

    const inPending = (community.pendingMembers || []).some((m) => String(m) === uidStr);
    if (inPending) {
      return res.status(400).json({ message: "Yêu cầu của bạn đang chờ chủ cộng đồng duyệt" });
    }

    if (!Array.isArray(community.pendingMembers)) community.pendingMembers = [];
    community.pendingMembers.push(userId);
    await community.save();

    const updated = await Community.findById(community._id)
      .populate("createdBy", "username displayName avatar")
      .populate("members", "username displayName avatar")
      .populate("pendingMembers", "username displayName avatar");

    res.json({ message: "Đã gửi yêu cầu tham gia", community: updated, pending: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approvePendingMember = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Không tìm thấy cộng đồng" });
    const callerId = userIdFromReq(req);
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    if (String(community.createdBy) !== String(callerId)) {
      return res.status(403).json({ message: "Chỉ chủ cộng đồng mới duyệt thành viên" });
    }

    const targetId = req.params.userId;
    const pend = (community.pendingMembers || []).map(String);
    if (!pend.includes(String(targetId))) {
      return res.status(400).json({ message: "Người dùng không nằm trong danh sách chờ" });
    }

    community.pendingMembers = community.pendingMembers.filter((m) => String(m) !== String(targetId));
    const already = community.members.some((m) => String(m) === String(targetId));
    if (!already) community.members.push(targetId);
    await community.save();

    const updated = await Community.findById(community._id)
      .populate("createdBy", "username displayName avatar")
      .populate("members", "username displayName avatar")
      .populate("pendingMembers", "username displayName avatar");

    res.json({ message: "Đã duyệt thành viên", community: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectPendingMember = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Không tìm thấy cộng đồng" });
    const callerId = userIdFromReq(req);
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    if (String(community.createdBy) !== String(callerId)) {
      return res.status(403).json({ message: "Chỉ chủ cộng đồng mới từ chối yêu cầu" });
    }

    const targetId = req.params.userId;
    community.pendingMembers = (community.pendingMembers || []).filter(
      (m) => String(m) !== String(targetId)
    );
    await community.save();

    const updated = await Community.findById(community._id)
      .populate("createdBy", "username displayName avatar")
      .populate("members", "username displayName avatar")
      .populate("pendingMembers", "username displayName avatar");

    res.json({ message: "Đã từ chối yêu cầu", community: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.kickMember = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Không tìm thấy cộng đồng" });
    const callerId = userIdFromReq(req);
    if (!callerId) return res.status(401).json({ message: "Chưa đăng nhập" });
    if (String(community.createdBy) !== String(callerId)) {
      return res.status(403).json({ message: "Chỉ chủ cộng đồng mới có thể mời thành viên ra" });
    }

    const targetId = req.params.userId;
    if (String(targetId) === String(community.createdBy)) {
      return res.status(400).json({ message: "Không thể mời chủ cộng đồng" });
    }

    community.members = (community.members || []).filter((m) => String(m) !== String(targetId));
    community.pendingMembers = (community.pendingMembers || []).filter(
      (m) => String(m) !== String(targetId)
    );
    await community.save();

    const updated = await Community.findById(community._id)
      .populate("createdBy", "username displayName avatar")
      .populate("members", "username displayName avatar")
      .populate("pendingMembers", "username displayName avatar");

    res.json({ message: "Đã mời thành viên ra khỏi cộng đồng", community: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCommunityPosts = async (req, res) => {
  try {
    const uid = userIdFromReq(req);
    if (!uid) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: "Không tìm thấy cộng đồng" });

    const { isMember } = viewerAccess(community, uid);
    if (!isMember) {
      return res.status(403).json({ message: "Chỉ thành viên mới xem được bài viết trong cộng đồng này" });
    }

    const isAdmin =
      typeof req.user?.role === "string" && req.user.role.trim().toLowerCase() === "admin";
    const filter = { community: community._id };
    if (!isAdmin) filter.isHidden = false;
    const posts = await Post.find(filter)
      .populate("createdBy", "username displayName email avatar role")
      .sort({ createdAt: -1 });
    const normalizedPosts = posts.map((post) => {
      const obj = post.toObject ? post.toObject() : post;
      if (obj?.createdBy?.role) {
        const r = String(obj.createdBy.role || "").trim().toLowerCase();
        obj.createdBy.role = r === "admin" ? "admin" : "user";
      } else if (obj?.createdBy) {
        obj.createdBy.role = "user";
      }
      return obj;
    });
    res.json(normalizedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
