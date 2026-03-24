const Groq = require("groq-sdk");
const Post = require("../models/Post");

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey || groqApiKey.trim() === '' || groqApiKey.includes('your_groq_api_key_here')) {
  console.error('GROQ_API_KEY không được thiết lập đúng. Kiểm tra file .env.');
}
const groq = new Groq({ apiKey: groqApiKey });

exports.chat = async (req, res) => {
  try {
    if (!groqApiKey || groqApiKey.trim()==='') {
      return res.status(500).json({ message: 'GROQ_API_KEY chưa cấu hình. Vui lòng cập nhật .env.' });
    }
    console.log('GROQ_API_KEY hiện tại:', groqApiKey ? groqApiKey.slice(0, 4) + '...' + groqApiKey.slice(-4) : '---');
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: "Thiếu nội dung" });

    // Lấy dữ liệu thật từ DB
    const posts = await Post.find({ isHidden: false })
      .select("title description location category averageRating price")
      .limit(50);

    const postContext = posts.length
      ? posts.map(p =>
          `- ${p.title} (${p.category}, ${p.location}) ⭐${p.averageRating || "chưa có"} | Giá tham khảo: ${
            Number.isFinite(p.price) && p.price >= 0 ? `${p.price.toLocaleString("vi-VN")} VND` : "chưa cập nhật"
          }: ${p.description?.slice(0, 80)}...`
        ).join("\n")
      : "Chưa có dữ liệu địa điểm";

    const systemPrompt = `Bạn là trợ lý du lịch AI của VietTravel — nền tảng du lịch Việt Nam.
Nhiệm vụ:
- Gợi ý địa điểm, khách sạn, quán ăn phù hợp sở thích người dùng
- Tạo lịch trình du lịch chi tiết theo ngày
- Tư vấn thông tin địa điểm du lịch Việt Nam
- Trả lời tiếng Việt, thân thiện, ngắn gọn, dùng emoji

Dữ liệu địa điểm trên VietTravel:
${postContext}

Lưu ý: Ưu tiên gợi ý địa điểm có trong dữ liệu. Không bịa đặt thông tin.`;

    // Build messages — Groq dùng format giống OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map(m => ({
        role: m.role === "ai" ? "assistant" : m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // model mạnh nhất, miễn phí
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("Groq error:", error.message);
    res.status(500).json({ message: "AI đang bận, thử lại sau!" });
  }
};