const Groq = require("groq-sdk");
const Post = require("../models/Post");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to calculate distance in km between two coordinates
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
};

exports.chat = async (req, res) => {
  try {
    const { message, history = [], userLocation } = req.body;
    if (!message) return res.status(400).json({ message: "Thiếu nội dung" });

    console.log("🤖 [AI Chat Debug] Received message:", message);
    console.log("🤖 [AI Chat Debug] Received userLocation:", userLocation);

    // Mặc định vị trí xuất phát là Đà Nẵng nếu không lấy được GPS từ trình duyệt
    let resolvedLocation = userLocation;
    let isDefaultLocation = false;
    if (!resolvedLocation || !resolvedLocation.lat || !resolvedLocation.lng) {
      resolvedLocation = { lat: 16.0682, lng: 108.2147 }; // Đà Nẵng
      isDefaultLocation = true;
      console.log("🤖 [AI Chat Debug] userLocation is missing. Defaulting to Da Nang coordinates:", resolvedLocation);
    }

    // Lấy dữ liệu thật từ DB bao gồm lat lng
    const posts = await Post.find({ isHidden: false })
      .select("title description location category averageRating price lat lng")
      .limit(50);

    console.log(`🤖 [AI Chat Debug] Fetched ${posts.length} posts from DB.`);

    const postContext = posts.length
      ? posts.map(p => {
          let distanceStr = "";
          if (resolvedLocation && resolvedLocation.lat && resolvedLocation.lng && p.lat && p.lng) {
            const distance = getDistance(resolvedLocation.lat, resolvedLocation.lng, p.lat, p.lng);
            distanceStr = ` [Cách bạn: ${distance.toFixed(1)} km]`;
            console.log(`   - Distance from resolvedLocation to [${p.title}]: ${distance.toFixed(1)} km`);
          } else {
            console.log(`   - No distance for [${p.title}] (resolvedLocation or Post coordinates missing)`);
          }
          return `[ID: ${p._id}] - ${p.title} (${p.category}, ${p.location})${distanceStr} ⭐${p.averageRating || "chưa có"} | Giá tham khảo: ${
            Number.isFinite(p.price) && p.price >= 0 ? `${p.price.toLocaleString("vi-VN")} VND` : "chưa cập nhật"
          }: ${p.description?.slice(0, 80)}...`;
        }).join("\n")
      : "Chưa có dữ liệu địa điểm";

    let locationPrompt = `Vĩ độ ${resolvedLocation.lat}, Kinh độ ${resolvedLocation.lng} (Đà Nẵng).`;
    if (!isDefaultLocation) {
      locationPrompt = `Vĩ độ ${resolvedLocation.lat}, Kinh độ ${resolvedLocation.lng} (Tọa độ thực tế từ thiết bị của họ).`;
    }

    const systemPrompt = `Bạn là trợ lý du lịch AI của VietTravel — nền tảng du lịch Việt Nam.
Nhiệm vụ:
- Gợi ý địa điểm, khách sạn, quán ăn phù hợp sở thích người dùng
- Tạo lịch trình du lịch chi tiết theo ngày dựa trên điểm xuất phát mặc định chính là vị trí của họ mà không giải thích gì thêm.
- Tư vấn thông tin địa điểm du lịch Việt Nam và hướng dẫn lộ trình/đường đi tối ưu nhất.
- Trả lời tiếng Việt, thân thiện, ngắn gọn, dùng emoji

Thông tin vị trí:
- ${locationPrompt}
- Dữ liệu địa điểm trên VietTravel (kèm khoảng cách km so với người dùng nếu có):
${postContext}

Lưu ý quan trọng:
- Khi người dùng bảo gợi ý lịch trình hoặc đường đi qua nhiều địa điểm khác nhau, bạn PHẢI so sánh khoảng cách (số km) của tất cả các địa điểm đó so với điểm xuất phát ngầm định. Bạn PHẢI thiết lập lộ trình đi qua các địa điểm gần trước rồi mới đi tiếp đến các địa điểm xa hơn (sắp xếp tăng dần theo khoảng cách km) để tránh việc đi ngược đường hoặc di chuyển không hợp lý (ví dụ: nếu xuất phát từ Đà Nẵng, khoảng cách đến Huế (~100km) gần hơn nhiều so với Hà Nội (~750km), do đó bắt buộc phải gợi ý hành trình đi Huế trước rồi mới đi Hà Nội, tuyệt đối không gợi ý đi Hà Nội trước rồi quay về Huế).
- TUYỆT ĐỐI KHÔNG được sử dụng các từ hoặc cụm từ như "vị trí hiện tại", "vị trí hiện tại của bạn", "tọa độ", "GPS", "định vị", "vị trí của bạn" hay "lấy vị trí hiện tại" trong nội dung câu trả lời. 
- Hãy gợi ý lịch trình và hướng dẫn đường đi một cách tự nhiên trực tiếp như thể bạn đã biết vị trí xuất phát của họ (ví dụ: Thay vì nói "Vì vị trí hiện tại của bạn là ở địa điểm X...", hãy nói thẳng "Bạn có thể bắt đầu hành trình bằng việc ghé thăm địa điểm X (cách khoảng Y km), sau đó đi tiếp đến địa điểm Z..."). Tuyệt đối tránh các câu thông báo máy móc, rườm rà về việc xác định vị trí.
- Ưu tiên gợi ý địa điểm có trong dữ liệu. Không bịa đặt thông tin.
- Đôi khi tiêu đề bài viết trong dữ liệu là tên của chính người dùng (ví dụ: "Đỗ Nguyễn Nam Quân"). Bạn phải thông minh nhận biết: đây là TÊN CỦA NGƯỜI DÙNG chứ không phải tên địa điểm du lịch hay quán ăn. Tuyệt đối KHÔNG gợi ý đi tham quan hay ghé thăm tên của người đó (như "Thăm Đỗ Nguyễn Nam Quân"). Thay vào đó, hãy gợi ý các địa điểm du lịch thực tế nổi tiếng tại thành phố đó (ví dụ tại Đà Nẵng thì gợi ý Cầu Rồng, Bà Nà Hills, Bán đảo Sơn Trà, Cảng Tiên Sa, v.v.).
- Khi gợi ý một lịch trình đi chơi hoặc danh sách địa điểm cụ thể để người dùng ghé thăm, ở DÒNG CUỐI CÙNG của câu trả lời, bạn PHẢI in ra một thẻ ẩn chứa danh sách các ID của những bài viết địa điểm đó theo đúng thứ tự chặng hành trình bạn gợi ý. Định dạng của dòng cuối này bắt buộc phải là: [ITINERARY:id_1,id_2,id_3] (ví dụ: [ITINERARY:6665796df3f48a12c42ab789,6665798ef3f48a12c42ab790]). Chỉ lấy các ID thực tế nằm trong trường "[ID: ...]" được cung cấp ở trên, tuyệt đối không tự bịa ra ID giả. Nếu không gợi ý địa điểm nào cụ thể từ dữ liệu của hệ thống, tuyệt đối không in ra thẻ này.`;

    // Build messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map(m => ({
        role: m.role === "ai" ? "assistant" : m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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