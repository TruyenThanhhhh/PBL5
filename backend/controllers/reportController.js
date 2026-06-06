const Report = require("../models/Report");
const Post = require("../models/Post");
const User = require("../models/User");

// 🚩 Gửi báo cáo mới
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin báo cáo!" });
    }

    const reporter = req.user.id;

    // Tránh gửi lặp lại báo cáo trùng lặp
    const query = { reporter, targetType };
    if (targetType === "post") {
      query.targetPost = targetId;
    } else {
      query.targetUser = targetId;
    }

    const existingReport = await Report.findOne(query);
    if (existingReport) {
      return res.status(400).json({ message: "Bạn đã gửi tố cáo cho đối tượng này rồi." });
    }

    const reportData = {
      reporter,
      targetType,
      reason,
      details: details || "",
      status: "pending"
    };

    if (targetType === "post") {
      const postExists = await Post.findById(targetId);
      if (!postExists) {
        return res.status(404).json({ message: "Không tìm thấy bài viết bị tố cáo." });
      }
      reportData.targetPost = targetId;
    } else if (targetType === "user") {
      const userExists = await User.findById(targetId);
      if (!userExists) {
        return res.status(404).json({ message: "Không tìm thấy người dùng bị tố cáo." });
      }
      reportData.targetUser = targetId;
    } else {
      return res.status(400).json({ message: "Loại đối tượng không hợp lệ." });
    }

    const newReport = await Report.create(reportData);
    res.status(201).json({ message: "Gửi tố cáo thành công! Admin sẽ sớm xem xét.", report: newReport });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi gửi báo cáo", error: error.message });
  }
};

// 👑 Lấy danh sách báo cáo (Chỉ dành cho Admin)
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "username displayName email avatar")
      .populate({
        path: "targetPost",
        populate: { path: "createdBy", select: "username displayName email isBanned" }
      })
      .populate("targetUser", "username displayName email avatar isBanned")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách báo cáo", error: error.message });
  }
};

// 👑 Admin xử lý hành động báo cáo
exports.handleReportAction = async (req, res) => {
  try {
    const { id } = req.params; // Report ID
    const { action } = req.body; // "dismiss" | "delete_post" | "ban_user"

    const report = await Report.findById(id)
      .populate("targetPost")
      .populate("targetUser");

    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo." });
    }

    if (action === "dismiss") {
      report.status = "dismissed";
      await report.save();
      return res.json({ message: "Đã bỏ qua báo cáo." });
    }

    if (action === "delete_post") {
      if (report.targetType !== "post" || !report.targetPost) {
        return res.status(400).json({ message: "Báo cáo này không thuộc về bài viết." });
      }
      
      const postId = report.targetPost._id;
      await Post.findByIdAndDelete(postId);

      // Đánh dấu tất cả báo cáo chưa xử lý liên quan đến bài viết này thành "resolved"
      await Report.updateMany({ targetPost: postId }, { status: "resolved" });

      return res.json({ message: "Đã xóa bài viết vi phạm và cập nhật trạng thái báo cáo liên quan." });
    }

    if (action === "ban_user") {
      let userId = null;
      if (report.targetType === "user" && report.targetUser) {
        userId = report.targetUser._id;
      } else if (report.targetType === "post" && report.targetPost) {
        userId = report.targetPost.createdBy;
      }

      if (!userId) {
        return res.status(400).json({ message: "Không tìm thấy tài khoản tương ứng để khóa." });
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản vi phạm." });
      }

      targetUser.isBanned = true;
      await targetUser.save();

      const io = req.app.get("io");
      if (io) {
        io.to(String(targetUser._id)).emit("user_banned", {
          message: "Tài khoản của bạn đã bị khóa bởi Admin do vi phạm tiêu chuẩn cộng đồng.",
          email: targetUser.email
        });
      }

      // Giải quyết tất cả báo cáo liên quan trực tiếp đến tài khoản này
      await Report.updateMany({ targetUser: userId }, { status: "resolved" });
      
      // Tìm tất cả bài viết của user này để giải quyết các báo cáo về bài viết của họ
      const userPosts = await Post.find({ createdBy: userId }).select("_id");
      const userPostIds = userPosts.map(p => p._id);
      
      await Report.updateMany({ targetPost: { $in: userPostIds } }, { status: "resolved" });

      return res.json({ message: "Đã khóa tài khoản vi phạm và cập nhật tất cả báo cáo liên quan." });
    }

    if (action === "unban_user") {
      let userId = null;
      if (report.targetType === "user" && report.targetUser) {
        userId = report.targetUser._id;
      } else if (report.targetType === "post" && report.targetPost) {
        userId = report.targetPost.createdBy;
      }

      if (!userId) {
        return res.status(400).json({ message: "Không tìm thấy tài khoản tương ứng để mở khóa." });
      }

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản vi phạm." });
      }

      targetUser.isBanned = false;
      await targetUser.save();

      // Giải quyết tất cả báo cáo liên quan trực tiếp đến tài khoản này
      await Report.updateMany({ targetUser: userId }, { status: "resolved" });

      return res.json({ message: "Đã mở khóa tài khoản thành công và cập nhật tất cả báo cáo liên quan." });
    }

    return res.status(400).json({ message: "Hành động không hợp lệ." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi xử lý báo cáo", error: error.message });
  }
};
