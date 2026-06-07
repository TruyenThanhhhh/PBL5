const fs = require("fs");
const path = require("path");

let tf = null;
let nsfw = null;
let nsfwModel = null;

// Thử require các thư viện TensorFlow và NSFWJS động để không crash server nếu chưa được cài đặt
try {
  try {
    tf = require("@tensorflow/tfjs-node");
  } catch (e) {
    tf = require("@tensorflow/tfjs");
  }
  nsfw = require("nsfwjs");
  console.log("✅ [Image Moderation] Đã tải thư viện TensorFlow và NSFWJS thành công.");
} catch (e) {
  console.warn("⚠️ [Image Moderation] Thiếu thư viện @tensorflow/tfjs hoặc nsfwjs. Hệ thống sẽ tự động dùng Groq Vision làm mặc định.");
}

/**
 * Tải model NSFWJS (chỉ tải một lần duy nhất để tối ưu bộ nhớ)
 */
const loadNSFWModel = async () => {
  if (nsfwModel) return nsfwModel;
  if (!nsfw || !tf) return null;
  
  try {
    // Tải model Mobilenet V2 mặc định
    nsfwModel = await nsfw.load();
    console.log("🧠 [Image Moderation] Đã khởi tạo thành công model NSFWJS.");
    return nsfwModel;
  } catch (error) {
    console.error("❌ [Image Moderation] Lỗi tải model NSFWJS:", error.message);
    return null;
  }
};

/**
 * Phân tích ảnh bằng NSFWJS qua Buffer
 * @param {Buffer} imageBuffer 
 * @returns {Promise<boolean>} - true nếu an toàn, false nếu vi phạm yếu tố 18+
 */
const checkNSFWJS = async (imageBuffer) => {
  const model = await loadNSFWModel();
  if (!model || !tf) {
    throw new Error("Mô hình NSFWJS hoặc TensorFlow chưa được tải.");
  }

  let tensor = null;
  try {
    // Giải mã ảnh buffer thành 3D Tensor [width, height, channels]
    if (tf.node && tf.node.decodeImage) {
      tensor = tf.node.decodeImage(imageBuffer, 3);
    } else {
      throw new Error("Thiếu tf.node để giải mã ảnh trực tiếp từ Buffer.");
    }

    const predictions = await model.classify(tensor);
    
    // Thu hồi bộ nhớ tensor để tránh rò rỉ bộ nhớ (Memory Leak)
    tensor.dispose();

    console.log("📊 [NSFWJS Predictions]:", predictions);

    const porn = predictions.find(p => p.className === "Porn")?.probability || 0;
    const hentai = predictions.find(p => p.className === "Hentai")?.probability || 0;
    const sexy = predictions.find(p => p.className === "Sexy")?.probability || 0;

    // Ngưỡng chặn: Porn > 60%, Hentai > 60%, hoặc Sexy > 85%
    if (porn > 0.6 || hentai > 0.6 || sexy > 0.85) {
      console.log(`⚠️ [Image Moderation] NSFWJS phát hiện ảnh không phù hợp (Porn: ${porn.toFixed(2)}, Hentai: ${hentai.toFixed(2)})`);
      return false;
    }

    return true;
  } catch (error) {
    if (tensor) {
      try {
        tensor.dispose();
      } catch (err) {}
    }
    throw error;
  }
};

/**
 * Kiểm duyệt hình ảnh bằng Groq Vision AI (Hỗ trợ cả Khiêu dâm lẫn Bạo lực/Máu me/Kích động)
 * @param {Buffer} imageBuffer 
 * @param {string} mimeType 
 * @returns {Promise<boolean>} - true nếu an toàn, false nếu vi phạm
 */
const checkGroqVision = async (imageBuffer, mimeType = "image/jpeg") => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ [Image Moderation] Thiếu biến GROQ_API_KEY trong .env để chạy Groq Vision.");
    return true; // Fail-open nếu không cấu hình AI
  }

  try {
    const base64Image = imageBuffer.toString("base64");
    console.log("🚀 [Image Moderation] Đang gọi Groq Vision AI để kiểm duyệt...");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Bạn là một AI kiểm duyệt hình ảnh du lịch. Hãy phân tích bức ảnh này xem có chứa các nội dung không phù hợp bao gồm: bạo lực, máu me, kinh dị, vũ khí nguy hiểm, hình ảnh nhạy cảm khiêu dâm (porn/hentai/sexy quá đà) hoặc hoạt động cấm hay không. Chỉ trả về duy nhất từ 'unsafe' nếu phát hiện yếu tố không phù hợp, hoặc 'safe' nếu ảnh hoàn toàn sạch và an toàn cho mạng xã hội. Tuyệt đối không viết thêm bất kỳ từ nào ngoài 2 từ trên." 
              },
              { 
                type: "image_url", 
                image_url: { url: `data:${mimeType};base64,${base64Image}` } 
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq Vision API trả về lỗi: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content?.trim().toLowerCase() || "safe";
    console.log(`📊 [Image Moderation] Kết quả Groq Vision: [${result}]`);
    return !result.includes("unsafe");
  } catch (error) {
    console.error("❌ [Image Moderation] Lỗi khi gọi Groq Vision:", error.message);
    return true; // Fail-open để tránh nghẽn luồng đăng bài của người dùng
  }
};

/**
 * Hàm kiểm duyệt ảnh chính (Moderate Image)
 * Tự động chọn thuật toán tối ưu: Local NSFWJS trước (phát hiện 18+ nhanh), sau đó dùng Groq Vision quét bạo lực/fallback
 * @param {Buffer} imageBuffer 
 * @param {string} mimeType 
 * @returns {Promise<boolean>}
 */
const moderateImage = async (imageBuffer, mimeType = "image/jpeg") => {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    console.warn("⚠️ [Image Moderation] moderateImage nhận dữ liệu không phải Buffer.");
    return true; 
  }

  // 1. Quét bằng local NSFWJS nếu có thư viện
  if (tf && nsfw) {
    try {
      const isNsfwSafe = await checkNSFWJS(imageBuffer);
      if (!isNsfwSafe) {
        return false; // Có nội dung khiêu dâm cấm, từ chối ngay lập tức
      }
      
      // NSFWJS an toàn, nhưng nó không quét được bạo lực (Violence). 
      // Do đó, ta tiếp tục quét bạo lực qua Groq Vision AI để hoàn thành tiêu chuẩn của user.
      console.log("ℹ️ [Image Moderation] NSFWJS sạch. Tiếp tục quét bạo lực bằng Groq Vision...");
      return await checkGroqVision(imageBuffer, mimeType);
    } catch (err) {
      console.warn("⚠️ [Image Moderation] Lỗi trong NSFWJS local, tự động fallback hoàn toàn qua Groq Vision:", err.message);
      return await checkGroqVision(imageBuffer, mimeType);
    }
  }

  // 2. Quét bằng Groq Vision (mặc định nếu thiếu thư viện local)
  return await checkGroqVision(imageBuffer, mimeType);
};

module.exports = {
  moderateImage
};
