/**
 * Utility for content censorship and moderation
 */

const BAD_WORDS = [
  // Vietnamese bad words (with accents)
  "đm", "đmm", "dkm", "dkmm", "đéo", "vcl", "clm", "vclm", "lồn", "cặc", 
  "bú cu", "địt", "chịch", "đệt", "hãm lồn", "chó má", "mẹ kiếp", "điếm", "đĩ",
  "ngu lồn", "hãm", "đồ chó", "óc chó", "ăn cứt", "ăn phân", "cứt", "ngu", "khùng", "điên",
  
  // Vietnamese bad words (without accents)
  "deo", "vl", "cl", "lon", "cac", "bu cu", "dit", "chich", "det", "ham lon",
  "cho ma", "me kiep", "diem", "di", "ngu lon", "oc cho", "an cut", "an phan", "cut", "khung", "dien",

  // English bad words
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "bastard"
];

/**
 * Checks if the text contains any bad words
 * @param {string} text 
 * @returns {boolean}
 */
const containsBadWords = (text) => {
  if (!text || typeof text !== "string") return false;
  const lowerText = text.toLowerCase();
  
  return BAD_WORDS.some(word => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])(${escapedWord})(?:$|[^a-zA-Z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])`, 'i');
    return regex.test(lowerText);
  });
};

/**
 * Censors bad words in a text, replacing them with asterisks
 * @param {string} text 
 * @returns {string}
 */
const censorText = (text) => {
  if (!text || typeof text !== "string") return text;
  let censoredText = text;

  // Sắp xếp các từ khóa thô tục theo độ dài giảm dần để tránh việc thế từ ngắn phá hỏng từ dài trước
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
  containsBadWords,
  censorText,
  BAD_WORDS
};
