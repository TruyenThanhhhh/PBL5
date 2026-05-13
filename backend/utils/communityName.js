/** Chuẩn hóa tên để so trùng (không phân biệt hoa thường, gộp khoảng trắng). */
function normalizeCommunityKey(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Escape cho RegExp khi so khớp tên an toàn */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { normalizeCommunityKey, escapeRegex };
