const fs = require("fs");
const { checkHardBan } = require("./moderation");
const { moderateImage } = require("./imageModerator");

/**
 * Kiểm duyệt ngữ nghĩa văn bản (Soft Filter & Contextual)
 * Sử dụng Google Perspective API làm phương thức chính, tự động fallback sang Groq Llama 3 nếu cần thiết.
 * @param {string} text 
 * @returns {Promise<{action: string, score: number, source: string}>}
 */
const checkContextualToxicity = async (text) => {
  if (!text || typeof text !== "string" || text.trim() === "") {
    return { action: "pass", score: 0, source: "none" };
  }

  const perspectiveKey = process.env.PERSPECTIVE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Thử dùng Google Perspective API đầu tiên
  if (perspectiveKey) {
    try {
      console.log("🔍 [AI Moderation] Đang phân tích sắc thái qua Google Perspective API...");
      const response = await fetch(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${perspectiveKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment: { text },
            languages: ["vi", "en"],
            requestedAttributes: {
              TOXICITY: {},
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Perspective API status: ${response.status}`);
      }

      const data = await response.json();
      const score = data.attributeScores?.TOXICITY?.summaryScore?.value;
      
      if (typeof score !== "number") {
        throw new Error("Không thể trích xuất score từ Perspective API.");
      }

      console.log(`📊 [AI Moderation] Điểm độc hại từ Perspective API: ${score.toFixed(3)}`);
      
      if (score > 0.8) return { action: "block", score, source: "perspective" };
      if (score >= 0.5) return { action: "flagged", score, source: "perspective" };
      return { action: "pass", score, source: "perspective" };
    } catch (err) {
      console.warn("⚠️ [AI Moderation] Lỗi Perspective API, chuyển sang Groq Fallback:", err.message);
    }
  }

  // 2. Chạy Groq Fallback nếu Perspective API thiếu key hoặc bị lỗi
  if (groqKey) {
    try {
      console.log("🔍 [AI Moderation] Đang chạy kiểm duyệt dự phòng qua Groq AI...");
      const Groq = require("groq-sdk");
      const groq = new Groq({ apiKey: groqKey });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Bạn là trợ lý kiểm duyệt nội dung độc hại trên mạng xã hội du lịch Việt Nam. 
Hãy phân tích sắc thái ngữ nghĩa của văn bản do người dùng cung cấp và trả về một điểm số từ 0.0 đến 1.0 biểu thị độ độc hại (Toxicity Score):
- 0.0 đến 0.49: Lành mạnh, bình thường, kể cả khi có các từ chọc ghẹo đùa vui không ác ý (ví dụ: "Con mèo này ngu ngốc ghê" -> ~0.2).
- 0.50 đến 0.79: Có tính chất chửi bới nhẹ, tiêu cực nhẹ, từ ngữ thô tục phụ thuộc ngữ cảnh, hoặc mang tính xúc phạm nhẹ ("thằng điên", "đồ khùng" -> ~0.65).
- 0.80 đến 1.00: Độc hại nặng, xúc phạm thô bỉ, kích động bạo lực, phân biệt chủng tộc hoặc từ tục tĩu cực nặng ("mày ngu lắm", "thằng ngu" -> ~0.85).

QUY TẮC PHẢN HỒI: Chỉ trả về đúng duy nhất 1 số thập phân có định dạng X.XX (ví dụ: 0.25 hoặc 0.82), tuyệt đối không giải thích hay thêm bất cứ từ ngữ nào khác.`
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      const resultText = completion.choices[0]?.message?.content?.trim();
      const score = parseFloat(resultText);

      if (isNaN(score)) {
        throw new Error(`Groq phản hồi định dạng không hợp lệ: "${resultText}"`);
      }

      console.log(`📊 [AI Moderation] Điểm độc hại từ Groq AI: ${score.toFixed(2)}`);
      
      if (score > 0.75) return { action: "block", score, source: "groq" };
      if (score >= 0.5) return { action: "flagged", score, source: "groq" };
      return { action: "pass", score, source: "groq" };
    } catch (err) {
      console.error("❌ [AI Moderation] Groq AI Fallback bị lỗi:", err.message);
    }
  }

  // Mặc định cho qua nếu cả hai cơ chế AI đều trục trặc
  console.warn("⚠️ [AI Moderation] Cả hai hệ thống AI đều không khả dụng. Tự động cho qua.");
  return { action: "pass", score: 0, source: "none" };
};

/**
 * Phân tích và kiểm duyệt văn bản (giữ khả năng tương thích ngược với code cũ)
 * Trả về true nếu văn bản sạch hoặc chờ duyệt, false nếu vi phạm nặng bị block
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
const checkTextModeration = async (text) => {
  if (!text || typeof text !== "string") return true;

  // 1. Quét từ cấm tuyệt đối (Hard Ban)
  if (checkHardBan(text)) {
    console.log(`🚫 [CheckText] Bị chặn bởi Hard Ban: "${text.substring(0, 30)}..."`);
    return false;
  }

  // 2. Phân tích sắc thái (Toxicity Score)
  const result = await checkContextualToxicity(text);
  if (result.action === "block") {
    console.log(`🚫 [CheckText] Bị chặn bởi Soft Ban (Score: ${result.score}): "${text.substring(0, 30)}..."`);
    return false;
  }

  return true;
};

/**
 * Express Middleware: contentModerator
 * Gộp Bước 1, Bước 2, Bước 3. Nhận req.body.text và req.file.buffer (hoặc req.file.path, hoặc req.files)
 */
const contentModerator = async (req, res, next) => {
  try {
    // 1. Tổng hợp text từ req.body
    let textsToScan = [];
    if (req.body) {
      // Quét các trường văn bản phổ biến trong request
      const textFields = ["text", "content", "description", "title", "comment"];
      textFields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          textsToScan.push(req.body[field].trim());
        }
      });
    }

    const combinedText = textsToScan.filter(t => t !== "").join(" ").trim();

    // 2. Thu thập hình ảnh từ Multer (req.file hoặc req.files)
    const imageBuffers = [];

    // Hỗ trợ đơn ảnh (single)
    if (req.file) {
      if (req.file.buffer) {
        imageBuffers.push({
          buffer: req.file.buffer,
          mimetype: req.file.mimetype || "image/jpeg"
        });
      } else if (req.file.path) {
        try {
          const buffer = await fs.promises.readFile(req.file.path);
          imageBuffers.push({
            buffer,
            mimetype: req.file.mimetype || "image/jpeg"
          });
        } catch (readErr) {
          console.error("❌ [Middleware Moderation] Lỗi đọc file từ path:", req.file.path, readErr.message);
        }
      }
    }

    // Hỗ trợ đa ảnh (array/fields)
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.buffer) {
          imageBuffers.push({
            buffer: file.buffer,
            mimetype: file.mimetype || "image/jpeg"
          });
        } else if (file.path) {
          try {
            const buffer = await fs.promises.readFile(file.path);
            imageBuffers.push({
              buffer,
              mimetype: file.mimetype || "image/jpeg"
            });
          } catch (readErr) {
            console.error("❌ [Middleware Moderation] Lỗi đọc file từ path:", file.path, readErr.message);
          }
        }
      }
    }

    // 3. Thực hiện lọc văn bản
    let toxicityResult = { action: "pass", score: 0, source: "none" };
    if (combinedText) {
      // Lớp 1: Hard Filter
      const isHardBanned = checkHardBan(combinedText);
      if (isHardBanned) {
        console.log("🚫 [Middleware Moderation] Phát hiện từ cấm tuyệt đối (Hard Ban).");
        return res.status(400).json({
          message: "Nội dung bài viết chứa từ ngữ vi phạm tiêu chuẩn cộng đồng."
        });
      }

      // Lớp 2: Soft Filter
      toxicityResult = await checkContextualToxicity(combinedText);
      if (toxicityResult.action === "block") {
        console.log(`🚫 [Middleware Moderation] Điểm độc hại vượt ngưỡng chặn (Score: ${toxicityResult.score}).`);
        return res.status(400).json({
          message: "Nội dung bài viết chứa từ ngữ vi phạm tiêu chuẩn cộng đồng."
        });
      }
    }

    // 4. Thực hiện lọc hình ảnh song song (Lớp 3)
    if (imageBuffers.length > 0) {
      console.log(`🔍 [Middleware Moderation] Bắt đầu kiểm duyệt ${imageBuffers.length} ảnh...`);
      const moderationPromises = imageBuffers.map(img => moderateImage(img.buffer, img.mimetype));
      const safetyResults = await Promise.all(moderationPromises);

      const hasUnsafe = safetyResults.some(isSafe => isSafe === false);
      if (hasUnsafe) {
        console.log("🚫 [Middleware Moderation] Phát hiện hình ảnh không phù hợp.");
        return res.status(400).json({
          message: "Hình ảnh tải lên không phù hợp tiêu chuẩn cộng đồng."
        });
      }
    }

    // 5. Nếu đạt mức flagged (0.5 - 0.8), đánh dấu vào request để Controller có thể quyết định xử lý
    req.moderation = {
      status: toxicityResult.action === "flagged" ? "flagged" : "safe",
      score: toxicityResult.score,
      source: toxicityResult.source
    };

    if (req.moderation.status === "flagged") {
      console.log(`⚠️ [Middleware Moderation] Văn bản bị gắn cờ chờ duyệt (Score: ${toxicityResult.score}).`);
    }

    return next();
  } catch (err) {
    console.error("❌ [Middleware Moderation] Lỗi trong quá trình kiểm duyệt:", err);
    // Trong môi trường thực tế, nếu lỗi AI hoặc TensorFlow xảy ra, ta cho phép tiếp tục hoạt động (Fail-open)
    return next();
  }
};

module.exports = {
  checkContextualToxicity,
  checkTextModeration,
  contentModerator
};

