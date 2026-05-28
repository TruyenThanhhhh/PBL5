const { containsBadWords } = require("./moderation");

/**
 * Phân tích và kiểm duyệt văn bản
 * Trả về true nếu văn bản sạch, false nếu vi phạm tiêu chuẩn cộng đồng (chứa từ thô tục)
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
const checkTextModeration = async (text) => {
  if (!text || typeof text !== "string") return true;
  
  // Trả về false nếu chứa từ ngữ thô tục/nhạy cảm
  const hasBadWords = containsBadWords(text);
  return !hasBadWords;
};

module.exports = {
  checkTextModeration
};
