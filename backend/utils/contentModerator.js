const axios = require('axios');

/**
 * Danh sách từ cấm dự phòng (Fallback)
 * Dùng trong trường hợp AI bị lag quá 3 giây hoặc lỗi mạng.
 */
const badWords = [
  "đụ", "đĩ", "lồn", "cặc", "chó đẻ", "đmm", "đcm", "vcl", "vãi l", 
  "phò", "cave", "địt", "nứng", "cmn", "đm", "vkl", "vl", "chịch", 
  "điếm", "đĩ điếm", "đồ lợn", "đồ chó", "ngu học", "thằng ngu", 
  "con điên", "thằng điên", "óc chó", "ml", "fuck", "bitch", "shit", 
  "slut", "whore", "asshole", "motherfucker", "dick", "pussy", "nig", "nigga", "nigger"
];

/**
 * Hàm kiểm duyệt AI thông minh + Fallback an toàn
 * @param {string} text - Nội dung cần kiểm duyệt
 * @returns {Promise<boolean>} - Trả về true nếu SAFE, false nếu TOXIC
 */
const checkTextModeration = async (text) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return true; 
  }

  // Cắt bớt text nếu quá dài để tránh lỗi Token của API
  const safeText = text.substring(0, 800);

  try {
    // 1. GỌI AI NHẬN DIỆN SLANG (Chờ tối đa 3 giây)
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant', // Model siêu tốc độ
        messages: [
          {
            role: 'system',
            content: `Bạn là hệ thống kiểm duyệt nội dung. Nhiệm vụ: Phát hiện các từ ngữ chửi thề, tục tĩu, tiếng lóng bậy bạ (slang), xúc phạm, kích động (bao gồm cả Tiếng Việt và Tiếng Anh). Trả lời MỘT TỪ DUY NHẤT: "TOXIC" nếu vi phạm, "SAFE" nếu an toàn. Không giải thích.`
          },
          {
            role: 'user',
            content: safeText
          }
        ],
        temperature: 0,
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000 // BẮT BUỘC TRẢ VỀ TRONG 3 GIÂY
      }
    );

    const aiResult = response.data.choices[0].message.content.trim().toUpperCase();
    
    if (aiResult.includes('TOXIC')) {
      console.log(`🤖 AI_MODERATOR: Đã chặn -> "${safeText.substring(0, 50)}..."`);
      return false; 
    }
    
    return true; 

  } catch (error) {
    // 2. NẾU AI LỖI HOẶC QUÁ 3 GIÂY -> DÙNG BỘ LỌC CỤC BỘ DỰ PHÒNG (0ms)
    console.log(`⚠️ AI phản hồi quá 3s hoặc lỗi, chuyển sang lọc Local...`);
    
    const lowerText = safeText.toLowerCase();
    const isToxic = badWords.some(word => {
      // Bắt chính xác từ khóa, không bắt nhầm (VD: "đm" trong "đam mê")
      const regex = new RegExp(`(^|[\\s.,!?])` + word + `([\\s.,!?]|$)`, 'i');
      return regex.test(lowerText);
    });

    if (isToxic) {
      console.log(`🛡️ LOCAL_MODERATOR: Đã chặn -> "${safeText.substring(0, 50)}..."`);
      return false; 
    }
    
    return true; 
  }
};

module.exports = { checkTextModeration };