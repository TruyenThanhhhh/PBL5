/**
 * Tiện ích lọc từ ngữ cấm tuyệt đối (Hard Filter)
 * Chỉ chứa các từ chắc chắn 100% là thô tục, chửi thề, vi phạm trong mọi ngữ cảnh.
 */

const BAD_WORDS = [
  // Từ tục tĩu cực nặng tiếng Việt (có dấu)
  "đm", "đmm", "dkm", "dkmm", "đéo", "vcl", "clm", "vclm", "lồn", "cặc", 
  "bú cu", "địt", "chịch", "đệt", "hãm lồn", "ngu lồn", "ăn cứt", "cứt",
  
  // Từ tục tĩu cực nặng tiếng Việt (không dấu - loại bỏ các từ dễ trùng lắp như "lon", "di", "cl")
  "deo", "vl", "cac", "bu cu", "dit", "chich", "det", "ham lon", "ngu lon", "an cut",

  // Từ tiếng Anh thô tục nặng
  "fuck", "bitch", "asshole", "cunt", "pussy"
];

// Biên dịch sẵn Regex một lần duy nhất để tối ưu hiệu năng chạy thực tế
const wordPatterns = BAD_WORDS.map(word => {
  const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  // Đảm bảo khớp nguyên từ (word boundary) đối với tiếng Việt có dấu và ký tự đặc biệt
  return `(?:^|[^a-zA-Z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])(${escaped})(?:$|[^a-zA-Z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])`;
});

const globalHardBanRegex = new RegExp(wordPatterns.join('|'), 'i');

/**
 * Kiểm tra xem văn bản có chứa từ cấm tuyệt đối hay không (Hard Ban Check)
 * @param {string} text 
 * @returns {boolean} - true nếu vi phạm, false nếu an toàn
 */
const checkHardBan = (text) => {
  if (!text || typeof text !== "string") return false;
  return globalHardBanRegex.test(text.toLowerCase());
};

/**
 * Giữ khả năng tương thích với code cũ
 */
const containsBadWords = (text) => {
  return checkHardBan(text);
};

/**
 * Che giấu các từ cấm bằng dấu sao (Censor)
 * @param {string} text 
 * @returns {string}
 */
const censorText = (text) => {
  if (!text || typeof text !== "string") return text;
  let censoredText = text;

  // Sắp xếp từ dài nhất lên trước để tránh việc thế từ ngắn phá hỏng cấu trúc từ dài
  const sortedBadWords = [...BAD_WORDS].sort((a, b) => b.length - a.length);

  sortedBadWords.forEach(word => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])(${escapedWord})($|[^a-zA-Z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])`, 'gi');
    
    censoredText = censoredText.replace(regex, (match, prefix, badWordPart, suffix) => {
      const asterisks = '*'.repeat(badWordPart.length);
      return prefix + asterisks + suffix;
    });
  });

  return censoredText;
};

module.exports = {
  checkHardBan,
  containsBadWords,
  censorText,
  BAD_WORDS
};

