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

// Hàm lấy dữ liệu OSM qua Nominatim và Overpass API
const searchOSMPlaces = async (city_or_location) => {
  try {
    console.log(`🌍 [OSM Tool] Đang tìm kiếm tọa độ cho: ${city_or_location}`);
    // 1. Tìm tọa độ của thành phố bằng Photon API (dựa trên OSM, ổn định hơn Nominatim)
    const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(city_or_location + ' Vietnam')}&limit=1`);
    const geoData = await photonRes.json();
    
    if (!geoData || !geoData.features || geoData.features.length === 0) {
      return `Không tìm thấy tọa độ cho ${city_or_location} trên bản đồ.`;
    }
    
    // Photon trả về coordinates: [lon, lat]
    const coords = geoData.features[0].geometry.coordinates;
    const lon = coords[0];
    const lat = coords[1];
    console.log(`🌍 [OSM Tool] Tọa độ của ${city_or_location}: lat=${lat}, lon=${lon}. Đang truy vấn Overpass API...`);

    // 2. Lấy POIs xung quanh bán kính 10km bằng Overpass API
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node["tourism"~"attraction|museum|viewpoint|hotel"](around:10000,${lat},${lon});
        node["amenity"~"restaurant|cafe"](around:10000,${lat},${lon});
      );
      out 25;
    `;

    const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    
    if (!overpassRes.ok) {
      return `Lỗi khi gọi Overpass API: ${overpassRes.statusText}`;
    }

    const overpassData = await overpassRes.json();
    
    if (!overpassData.elements || overpassData.elements.length === 0) {
      return `Đã tìm thấy ${city_or_location} nhưng không có điểm du lịch hoặc nhà hàng nổi bật nào trong dữ liệu OSM tại đây.`;
    }

    const places = overpassData.elements
      .filter(el => el.tags && el.tags.name && el.lat && el.lon)
      .map(el => {
        const type = el.tags.tourism || el.tags.amenity || "place";
        return `- ${el.tags.name} (Loại: ${type}) [Tọa độ: ${el.lat}, ${el.lon}]`;
      })
      .slice(0, 20);

    console.log(`🌍 [OSM Tool] Đã tìm thấy ${places.length} địa điểm tại ${city_or_location}.`);
    
    return `Thông tin từ OpenStreetMap cho khu vực ${city_or_location}:\n${places.join("\n")}`;
  } catch (error) {
    console.error("OSM Tool Error:", error.message);
    return `Đã xảy ra lỗi khi tìm kiếm dữ liệu OSM: ${error.message}`;
  }
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
- Nếu địa danh người dùng hỏi KHÔNG CÓ trong "Dữ liệu địa điểm trên VietTravel" (ví dụ: Sapa, Đà Lạt, Phú Quốc...), bạn PHẢI kích hoạt function call \`search_osm_places\` để lấy dữ liệu thực tế. TUYỆT ĐỐI không từ chối trả lời nếu chưa gọi tool này. CHỈ kích hoạt tool qua API, KHÔNG viết thẻ <function> vào trong nội dung chữ.
- Khi người dùng bảo gợi ý lịch trình hoặc đường đi qua nhiều địa điểm khác nhau, bạn PHẢI so sánh khoảng cách (số km) của tất cả các địa điểm đó so với điểm xuất phát ngầm định. Bạn PHẢI thiết lập lộ trình đi qua các địa điểm gần trước rồi mới đi tiếp đến các địa điểm xa hơn (sắp xếp tăng dần theo khoảng cách km).
- TUYỆT ĐỐI KHÔNG được sử dụng các từ hoặc cụm từ như "vị trí hiện tại", "vị trí hiện tại của bạn", "tọa độ", "GPS", "định vị", "vị trí của bạn" hay "lấy vị trí hiện tại" trong nội dung câu trả lời. 
- Đôi khi tiêu đề bài viết trong dữ liệu là tên của chính người dùng (ví dụ: "Đỗ Nguyễn Nam Quân"). Hãy khéo léo phân biệt tên người và tên địa điểm.
- Khi gợi ý một lịch trình chứa các địa điểm TỪ DỮ LIỆU CỦA HỆ THỐNG, ở DÒNG CUỐI CÙNG của câu trả lời, bạn PHẢI in ra một thẻ ẩn chứa danh sách các ID của những bài viết địa điểm đó: [ITINERARY:id_1,id_2,id_3]. Chỉ lấy ID trong trường "[ID: ...]". TUYỆT ĐỐI KHÔNG đưa ID ảo.
- NẾU địa điểm lấy từ OpenStreetMap (không có ID trong hệ thống), bạn KHÔNG ĐƯỢC dùng thẻ [ITINERARY]. Thay vào đó, ở DÒNG CUỐI CÙNG của câu trả lời, bạn PHẢI in ra một thẻ ẩn chứa danh sách các điểm OSM mà bạn gợi ý theo định dạng: [OSM_ITINERARY:Tên 1|lat1|lon1;Tên 2|lat2|lon2]. Ví dụ: [OSM_ITINERARY:Thác Bạc|22.361|103.779;Đỉnh Fansipan|22.304|103.771]. Lấy vĩ độ, kinh độ chính xác từ dữ liệu tool trả về.`;

    // Build messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map(m => ({
        role: m.role === "ai" ? "assistant" : m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "search_osm_places",
          description: "Sử dụng công cụ này ĐỂ LẤY thông tin địa điểm (khách sạn, nhà hàng, điểm du lịch) từ bản đồ OpenStreetMap. BẠN PHẢI GỌI CÔNG CỤ NÀY nếu địa điểm mà người dùng hỏi không có sẵn trong phần Dữ liệu địa điểm trên VietTravel ở trên.",
          parameters: {
            type: "object",
            properties: {
              city_or_location: {
                type: "string",
                description: "Tên thành phố hoặc khu vực muốn tìm (ví dụ: 'Đà Lạt', 'Nha Trang', 'Hà Nội', 'Sapa')."
              }
            },
            required: ["city_or_location"]
          }
        }
      }
    ];

    let completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 1024,
      temperature: 0.7,
    });

    let responseMessage = completion.choices[0].message;

    // Kiểm tra xem AI có gọi tool không
    if (responseMessage.tool_calls) {
      console.log("🤖 [AI Chat Debug] AI decided to call tools:", responseMessage.tool_calls.map(t => t.function.name));
      
      // Thêm tin nhắn assistant gọi tool vào messages
      messages.push(responseMessage);

      // Thực thi từng tool call
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "search_osm_places") {
          const args = JSON.parse(toolCall.function.arguments);
          const toolResult = await searchOSMPlaces(args.city_or_location);
          
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "search_osm_places",
            content: toolResult,
          });
        }
      }

      // Gọi lại Groq với kết quả từ tool
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      });
      
      responseMessage = completion.choices[0].message;
    }

    const reply = responseMessage.content;
    res.json({ reply });

  } catch (error) {
    console.error("Groq error:", error.message);
    res.status(500).json({ message: "AI đang bận, thử lại sau!" });
  }
};