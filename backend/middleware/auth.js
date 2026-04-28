const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Keep role comparisons consistent across backend.
const normalizeRole = (role) => {
  if (typeof role !== "string") return "user";
  const r = role.trim().toLowerCase();
  if (r === "admin") return "admin";
  return "user";
};

// 🔐 Xác thực token — bắt buộc đăng nhập
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

// 👁️ Xem không cần đăng nhập — nhưng nếu có token thì gắn user vào req
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  next();
};


// 👑 Chỉ admin
const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Chưa đăng nhập" });
  const role = normalizeRole(req.user.role);
  if (role !== "admin")
    return res.status(403).json({ message: "Chỉ Admin mới có quyền này" });
  next();
};

// 🔑 Chủ sở hữu hoặc admin (dùng cho sửa/xóa bài, xóa comment)
const requireOwnerOrAdmin = (getOwnerId) => async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Chưa đăng nhập" });
    const ownerId = await getOwnerId(req); // hàm async lấy owner từ DB
    if (!ownerId) return res.status(404).json({ message: "Không tìm thấy" });
    const isOwner = ownerId.toString() === req.user.id;
    const isAdmin = normalizeRole(req.user.role) === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Không có quyền thực hiện" });
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { protect, optionalAuth, requireAdmin, requireOwnerOrAdmin };