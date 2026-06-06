require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Post = require("../models/Post");
const Community = require("../models/Community");
const Comment = require("../models/Comment");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Report = require("../models/Report");

// Sample Unsplash images for travel and avatars
const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", // Woman 1
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", // Man 1
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80", // Woman 2
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80", // Man 2
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80", // Woman 3
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80", // Man 3
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80", // Woman 4
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80", // Man 4
];

const COVERS = [
  "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80", // Vietnam mountains
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80", // Travel lake
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80", // Landscape
];

const POST_IMAGES = {
  hanoi: ["https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80"],
  sapa: ["https://images.unsplash.com/photo-1504457047772-27f85044748d?auto=format&fit=crop&w=800&q=80"],
  halong: ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80"],
  hoian: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],
  danang: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"],
  dalat: ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80"],
  nhatrang: ["https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"],
  hcmc: ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80"],
  hagiang: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"],
  phuquoc: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"],
  hue: ["https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80"],
  muine: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"],
  caobang: ["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"],
};

async function seed() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/DB_PBL5fix";
  console.log(`Connecting to database: ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  try {
    // 1. Clean up existing demo data
    console.log("Cleaning up previous demo data...");
    const demoUsers = await User.find({ email: /@wanderer\.vn$/ });
    const demoUserIds = demoUsers.map(u => u._id);

    const demoPosts = await Post.find({ createdBy: { $in: demoUserIds } });
    const demoPostIds = demoPosts.map(p => p._id);

    // Clean up reports targeting or made by demo accounts
    await Report.deleteMany({
      $or: [
        { reporter: { $in: demoUserIds } },
        { targetUser: { $in: demoUserIds } },
        { targetPost: { $in: demoPostIds } }
      ]
    });

    await Post.deleteMany({ createdBy: { $in: demoUserIds } });
    await Community.deleteMany({ createdBy: { $in: demoUserIds } });
    await Comment.deleteMany({ author: { $in: demoUserIds } });
    await Conversation.deleteMany({ participants: { $in: demoUserIds } });
    await Message.deleteMany({ sender: { $in: demoUserIds } });
    await User.deleteMany({ _id: { $in: demoUserIds } });

    console.log("Previous demo data cleaned successfully.");

    // 2. Create Password Hash
    const passwordHash = await bcrypt.hash("password123", 10);

    // 3. Insert Demo Users
    console.log("Seeding demo users...");
    const usersData = [
      {
        username: "demo_nguyenvana",
        displayName: "Nguyễn Văn A",
        email: "demo.nguyenvana@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[0],
        cover: COVERS[0],
        bio: "Đam mê xê dịch, yêu thích khám phá cung đường đèo Việt Nam.",
        role: "poster",
      },
      {
        username: "demo_tranthib",
        displayName: "Trần Thị B",
        email: "demo.tranthib@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[1],
        cover: COVERS[1],
        bio: "Food blogger. Thích review tất tần tật các món ăn ngon đường phố.",
        role: "poster",
      },
      {
        username: "demo_lehoangc",
        displayName: "Lê Hoàng C",
        email: "demo.lehoangc@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[2],
        cover: COVERS[2],
        bio: "Nhiếp ảnh gia nghiệp dư. Lưu giữ khoảnh khắc bình minh các vùng biển đảo.",
        role: "poster",
      },
      {
        username: "demo_phamminhd",
        displayName: "Phạm Minh D",
        email: "demo.phamminhd@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[3],
        cover: COVERS[0],
        bio: "Phượt thủ Sài Gòn. Bạn đồng hành tin cậy trên mọi chặng đường.",
        role: "user",
      },
      {
        username: "demo_dothie",
        displayName: "Đỗ Thị E",
        email: "demo.dothie@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[4],
        cover: COVERS[1],
        bio: "Tìm kiếm những trải nghiệm yên bình tại các phố cổ và vùng cao.",
        role: "viewer",
      },
      {
        username: "demo_hoangquan",
        displayName: "Nguyễn Hoàng Quân",
        email: "demo.hoangquan@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[5],
        cover: COVERS[2],
        bio: "Nhiếp ảnh gia đường phố Sài Gòn, kẻ săn lùng hoàng hôn rực rỡ.",
        role: "poster",
      },
      {
        username: "demo_maiphuong",
        displayName: "Lê Mai Phương",
        email: "demo.maiphuong@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[6],
        cover: COVERS[0],
        bio: "Thích cắm trại tự túc, chèo thuyền kayak và trekking xuyên rừng.",
        role: "poster",
      },
      {
        username: "demo_quanglinh",
        displayName: "Phạm Quang Linh",
        email: "demo.quanglinh@wanderer.vn",
        password: passwordHash,
        avatar: AVATARS[7],
        cover: COVERS[1],
        bio: "Thích du lịch bụi xuyên biên giới. Chia sẻ văn hóa và trải nghiệm ẩm thực bốn phương.",
        role: "poster",
      }
    ];

    const users = await User.insertMany(usersData);
    console.log(`Successfully seeded ${users.length} demo users.`);

    // 4. Link Friends (Add all users as friends of each other for easy testing)
    const userIds = users.map(u => u._id);
    for (let i = 0; i < users.length; i++) {
      const otherFriends = userIds.filter((_, idx) => idx !== i);
      await User.findByIdAndUpdate(users[i]._id, {
        $set: {
          friends: otherFriends,
          followers: otherFriends,
          following: otherFriends,
        }
      });
    }
    console.log("Friendships established between all demo users.");

    // 5. Create Communities
    console.log("Seeding communities...");
    const commsData = [
      {
        name: "Hội Phượt Việt Nam",
        description: "Nơi chia sẻ kinh nghiệm trekking, phượt xe máy, cắm trại xuyên Việt đầy thử thách và nhiệt huyết.",
        cover: COVERS[0],
        createdBy: users[0]._id,
        members: userIds,
      },
      {
        name: "Review Ẩm Thực Ba Miền",
        description: "Cộng đồng tụ hội những tâm hồn ăn uống, chia sẻ địa chỉ quán ăn ngon từ vỉa hè đến nhà hàng cao cấp.",
        cover: COVERS[1],
        createdBy: users[1]._id,
        members: userIds,
      },
      {
        name: "Săn Mây & Trekking Đèo",
        description: "Tổng hợp các tọa độ săn mây tuyệt đẹp ở Sapa, Đà Lạt, Hà Giang và các cung đường đèo hiểm trở.",
        cover: COVERS[2],
        createdBy: users[2]._id,
        members: userIds,
      }
    ];

    const communities = [];
    for (const data of commsData) {
      const comm = new Community(data);
      await comm.save();
      communities.push(comm);
    }
    console.log(`Successfully seeded ${communities.length} communities.`);

    // 6. Create Travel Posts in Vietnam
    console.log("Seeding travel posts...");
    const postsData = [
      {
        title: "Phượt đêm Hà Nội - Trải nghiệm trà chanh Chợ Đồng Xuân",
        description: "Hà Nội về đêm mang vẻ đẹp rất khác. Sau 11h đêm, cùng rủ bạn bè ghé qua chợ Đồng Xuân làm một bát cháo sườn sụn nóng hổi, rồi uống trà chanh vỉa hè tám chuyện. Một trải nghiệm không thể bỏ qua khi ghé thăm Thủ đô!",
        location: "Chợ Đồng Xuân, Hoàn Kiếm, Hà Nội",
        category: "Đời thường",
        price: 50000,
        images: POST_IMAGES.hanoi,
        createdBy: users[0]._id,
        lat: 21.0383,
        lng: 105.8498,
        likes: [users[1]._id, users[2]._id, users[3]._id],
        averageRating: 4.8,
        totalReviews: 3,
        community: communities[1]._id,
        publishedToProfile: true,
      },
      {
        title: "Săn mây đỉnh Fansipan - Nóc nhà Đông Dương hùng vĩ",
        description: "Chinh phục đỉnh Fansipan ở độ cao 3.143m lúc bình minh. Cả biển mây cuồn cuộn đổ xuống như thác lũ, ánh nắng mặt trời vàng óng nhuộm sắc tạo nên cảnh tượng huyền ảo vô cùng. Vé cáp treo khứ hồi khoảng 800k nhưng hoàn toàn xứng đáng!",
        location: "Đỉnh Fansipan, Sa Pa, Lào Cai",
        category: "Núi rừng",
        price: 800000,
        images: POST_IMAGES.sapa,
        createdBy: users[3]._id,
        lat: 22.3033,
        lng: 103.7749,
        likes: [users[0]._id, users[2]._id, users[4]._id],
        averageRating: 5.0,
        totalReviews: 5,
        community: communities[0]._id,
        publishedToProfile: true,
      },
      {
        title: "Hội An cổ kính bên dòng sông Thu Bồn hoài niệm",
        description: "Đến Hội An vào chiều muộn, khi những ánh đèn lồng bắt đầu thắp sáng khắp nẻo phố cổ. Thuê một chiếc thuyền nhỏ thả hoa đăng trên sông Thu Bồn, lắng nghe câu hát bài chòi xa xăm. Cảm giác vô cùng thư thái và bình yên.",
        location: "Phố cổ Hội An, Quảng Nam",
        category: "Văn hóa / Kiến trúc",
        price: 150000,
        images: POST_IMAGES.hoian,
        createdBy: users[4]._id,
        lat: 15.8801,
        lng: 108.3380,
        likes: [users[0]._id, users[1]._id],
        averageRating: 4.7,
        totalReviews: 2,
        community: communities[2]._id,
        publishedToProfile: true,
      },
      {
        title: "Ăn sập chợ Cồn Đà Nẵng với chỉ 100k trong túi",
        description: "Chợ Cồn chính là thiên đường ẩm thực của Đà Nẵng. Chỉ với 100k, mình đã thưởng thức được: bánh bèo, bánh lọc, mì Quảng, ốc hút và một ly chè sầu riêng béo ngậy. Đồ ăn siêu rẻ, cô bán hàng cực kỳ thân thiện và mến khách!",
        location: "Chợ Cồn, Hải Châu, Đà Nẵng",
        category: "Ẩm thực",
        price: 100000,
        images: POST_IMAGES.danang,
        createdBy: users[1]._id,
        lat: 16.0682,
        lng: 108.2147,
        likes: [users[2]._id, users[3]._id, users[4]._id],
        averageRating: 4.9,
        totalReviews: 4,
        community: communities[1]._id,
        publishedToProfile: true,
      },
      {
        title: "Khám phá vịnh Hạ Long bằng du thuyền 5 sao đẳng cấp",
        description: "Trải nghiệm 2 ngày 1 đêm lênh đênh trên Vịnh Hạ Long xinh đẹp. Chèo thuyền kayak luồn qua các hang luồn, ngắm hoàng hôn buông xuống giữa ngàn đảo đá vôi kỳ vĩ và tham gia lớp học nấu ăn buổi tối trên boong tàu. Chuyến đi tuyệt vời nhất mùa hè này!",
        location: "Vịnh Hạ Long, Quảng Ninh",
        category: "Biển đảo",
        price: 2500000,
        images: POST_IMAGES.halong,
        createdBy: users[2]._id,
        lat: 20.9101,
        lng: 107.1839,
        likes: [users[0]._id, users[3]._id],
        averageRating: 4.6,
        totalReviews: 2,
        community: communities[0]._id,
        publishedToProfile: true,
      },
      {
        title: "Trekking Thác Datanla Lâm Đồng đầy mạo hiểm",
        description: "Nếu bạn thích cảm giác mạnh, hãy thử chơi máng trượt xuyên rừng thông hoặc leo dây vượt thác thác Datanla tại Đà Lạt. Dòng nước đổ xuống xiết, đòi hỏi sự dẻo dai và lòng can đảm. Cảm giác chinh phục được ngọn thác thật sự rất phấn khích!",
        location: "Thác Datanla, Đà Lạt, Lâm Đồng",
        category: "Núi rừng",
        price: 350000,
        images: POST_IMAGES.dalat,
        createdBy: users[0]._id,
        lat: 11.9022,
        lng: 108.4502,
        likes: [users[3]._id],
        averageRating: 4.5,
        totalReviews: 1,
        community: communities[2]._id,
        publishedToProfile: true,
        isHidden: true, // Seed as hidden post!
      },
      {
        title: "Lặn biển ngắm san hô tại rạn san hô Đảo Hòn Mun Nha Trang",
        description: "Hòn Mun nổi tiếng là khu bảo tồn biển đẹp nhất Nha Trang. Lặn bình dưỡng khí xuống độ cao 6m, thế giới đại dương mở ra trước mắt với hàng trăm loài san hô đủ màu sắc và những đàn cá bơi lội tung tăng xung quanh. Nước biển trong vắt nhìn thấu đáy.",
        location: "Đảo Hòn Mun, Nha Trang, Khánh Hòa",
        category: "Biển đảo",
        price: 600000,
        images: POST_IMAGES.nhatrang,
        createdBy: users[2]._id,
        lat: 12.1706,
        lng: 109.3039,
        likes: [users[1]._id, users[4]._id],
        averageRating: 4.8,
        totalReviews: 3,
        community: communities[0]._id,
        publishedToProfile: true,
      },
      {
        title: "Ngắm hoàng hôn Sài Gòn từ tòa nhà Landmark 81 cực lung linh",
        description: "Lên đài quan sát Skyview tầng 79-81 ngắm trọn vẹn toàn cảnh TP. Hồ Chí Minh lúc hoàng hôn buông xuống. Thành phố bắt đầu lên đèn lấp lánh như dải ngân hà, dòng sông Sài Gòn uốn lượn hiền hòa dưới chân. Một góc nhìn tuyệt mỹ từ độ cao gần 400m.",
        location: "Tòa nhà Landmark 81, Bình Thạnh, TP. Hồ Chí Minh",
        category: "Thành phố",
        price: 400000,
        images: POST_IMAGES.hcmc,
        createdBy: users[3]._id,
        lat: 10.7975,
        lng: 106.7214,
        likes: [users[0]._id, users[1]._id, users[2]._id, users[4]._id],
        averageRating: 4.9,
        totalReviews: 6,
        community: communities[2]._id,
        publishedToProfile: true,
        isHidden: true, // Seed as hidden post!
      },
      {
        title: "Chinh phục đỉnh đèo Mã Pí Lèng - Hà Giang hùng vĩ",
        description: "Đèo Mã Pí Lèng là một trong tứ đại đỉnh đèo của Việt Nam. Chạy xe máy dọc theo con đường Hạnh Phúc, ngắm nhìn dòng sông Nho Quế màu xanh lục bảo uốn lượn dưới hẻm vực Tu Sản sâu thẳm. Cảnh sắc hoang sơ, kỳ vĩ tột cùng khiến ai cũng phải trầm trồ.",
        location: "Đèo Mã Pí Lèng, Mèo Vạc, Hà Giang",
        category: "Núi rừng",
        price: 200000,
        images: POST_IMAGES.hagiang,
        createdBy: users[5]._id, // Nguyễn Hoàng Quân
        lat: 23.2505,
        lng: 104.9126,
        likes: [users[0]._id, users[2]._id, users[6]._id],
        averageRating: 4.9,
        totalReviews: 3,
        community: communities[2]._id,
        publishedToProfile: true,
      },
      {
        title: "Ngắm hoàng hôn lãng mạn tại bãi Ông Lang Phú Quốc",
        description: "Bãi Ông Lang mang vẻ đẹp yên bình, nước biển xanh ngắt và những ghềnh đá hoang sơ. Hoàng hôn ở đây đẹp đến ngạt thở khi mặt trời đỏ rực chìm dần xuống biển khơi. Thưởng thức một ly cocktail mát lạnh tại quán bar sát biển là trải nghiệm tuyệt vời.",
        location: "Bãi Ông Lang, Phú Quốc, Kiên Giang",
        category: "Biển đảo",
        price: 150000,
        images: POST_IMAGES.phuquoc,
        createdBy: users[6]._id, // Lê Mai Phương
        lat: 10.2764,
        lng: 103.9458,
        likes: [users[1]._id, users[4]._id, users[7]._id],
        averageRating: 4.8,
        totalReviews: 3,
        community: communities[0]._id,
        publishedToProfile: true,
      },
      {
        title: "Khám phá vẻ đẹp di sản Đại Nội Huế trầm mặc",
        description: "Ghé thăm cố đô Huế cổ kính với Hoàng Thành và Tử Cấm Thành uy nghiêm. Nơi lưu giữ những dấu ấn lịch sử triều Nguyễn với kiến trúc chạm trổ tinh xảo, những bức tường rêu phong cổ kính. Nên thuê trang phục cổ trang chụp ảnh để có những bức hình kỷ niệm đậm chất cung đình.",
        location: "Đại Nội Huế, Phú Hậu, TP. Huế",
        category: "Văn hóa / Kiến trúc",
        price: 200000,
        images: POST_IMAGES.hue,
        createdBy: users[7]._id, // Phạm Quang Linh
        lat: 16.4691,
        lng: 107.5779,
        likes: [users[2]._id, users[3]._id, users[5]._id],
        averageRating: 4.7,
        totalReviews: 3,
        community: communities[1]._id,
        publishedToProfile: true,
      },
      {
        title: "Đồi cát bay Mũi Né - Tiểu sa mạc lộng gió miền Trung",
        description: "Trải nghiệm trượt cát bằng ván nhựa cực vui tại đồi cát bay Mũi Né. Những triền cát mênh mông liên tục thay đổi hình dáng do hướng gió tạo nên những đường cong tuyệt mỹ. Buổi sáng sớm hoặc chiều tà là thời điểm lý tưởng nhất vì cát không bị nóng.",
        location: "Đồi cát bay Mũi Né, Phan Thiết, Bình Thuận",
        category: "Đời thường",
        price: 50000,
        images: POST_IMAGES.muine,
        createdBy: users[5]._id, // Nguyễn Hoàng Quân
        lat: 10.9416,
        lng: 108.2882,
        likes: [users[0]._id, users[6]._id],
        averageRating: 4.5,
        totalReviews: 2,
        community: communities[2]._id,
        publishedToProfile: true,
      },
      {
        title: "Thác Bản Giốc Cao Bằng - Bản hùng ca thác nước vùng biên",
        description: "Thác Bản Giốc là thác nước tự nhiên lớn nhất Đông Nam Á, nằm giữa biên giới Việt - Trung. Thác đổ xuống nhiều tầng tung bọt trắng xóa giữa núi rừng Trùng Khánh trùng điệp. Có thể thuê bè mảng để đi sát chân thác, cảm nhận hơi nước mát rượi phả vào mặt.",
        location: "Thác Bản Giốc, Đàm Thủy, Trùng Khánh, Cao Bằng",
        category: "Núi rừng",
        price: 45000,
        images: POST_IMAGES.caobang,
        createdBy: users[6]._id, // Lê Mai Phương
        lat: 22.8575,
        lng: 106.7214,
        likes: [users[0]._id, users[1]._id, users[7]._id],
        averageRating: 4.9,
        totalReviews: 3,
        community: communities[0]._id,
        publishedToProfile: true,
      }
    ];

    const posts = await Post.insertMany(postsData);
    console.log(`Successfully seeded ${posts.length} travel posts.`);

    // 7. Seed Comments
    console.log("Seeding comments...");
    const commentsData = [
      {
        content: "Cháo sườn sụn chợ Đồng Xuân ăn đêm mùa lạnh thì đúng là hết ý luôn!",
        post: posts[0]._id,
        author: users[1]._id,
      },
      {
        content: "Nhìn thèm quá, đợt sau ra Hà Nội mình nhất định phải thử.",
        post: posts[0]._id,
        author: users[3]._id,
      },
      {
        content: "Bình minh trên đỉnh Fansipan quả thực là kiệt tác của tạo hóa!",
        post: posts[1]._id,
        author: users[0]._id,
      },
      {
        content: "Đến Hội An chỉ cần đi dạo ngắm đèn lồng thôi cũng thấy tâm hồn nhẹ nhõm.",
        post: posts[2]._id,
        author: users[0]._id,
      },
      {
        content: "Bánh bèo chợ Cồn siêu ngon, nước mắm ngọt ngọt cay cay chuẩn vị miền Trung.",
        post: posts[3]._id,
        author: users[2]._id,
      },
      {
        content: "Mức giá tour du thuyền 5 sao này đã bao gồm ăn uống chưa bạn ơi?",
        post: posts[4]._id,
        author: users[3]._id,
      },
      {
        content: "Bao gồm trọn gói 4 bữa ăn tiêu chuẩn 5 sao trên tàu rồi nhé bạn!",
        post: posts[4]._id,
        author: users[2]._id,
      },
      {
        content: "Đèo Mã Pí Lèng chạy xe máy phê thật sự, nhưng khúc cua nguy hiểm nên đi cẩn thận.",
        post: posts[8]._id,
        author: users[0]._id,
      },
      {
        content: "Phú Quốc ngắm hoàng hôn thì bãi Ông Lang là chuẩn bài nhất, ít xô bồ.",
        post: posts[9]._id,
        author: users[4]._id,
      },
      {
        content: "Cảm giác bình yên ở Đại Nội Huế thật sự khó tả, rất đáng để trải nghiệm.",
        post: posts[10]._id,
        author: users[5]._id,
      }
    ];

    await Comment.insertMany(commentsData);
    console.log("Comments seeded successfully.");

    // 8. Create Demo Conversations & Messages
    console.log("Seeding chat conversations and messages...");
    
    // Conversation 1: Nguyễn Văn A (users[0]) & Trần Thị B (users[1])
    const conv1 = await Conversation.create({
      participants: [users[0]._id, users[1]._id],
      isGroup: false,
    });

    await Message.create([
      {
        conversationId: conv1._id,
        sender: users[0]._id,
        text: "Chào B nhé, đợt này có quán ẩm thực nào mới ở Đà Nẵng không giới thiệu mình với!",
        readBy: [users[0]._id, users[1]._id],
      },
      {
        conversationId: conv1._id,
        sender: users[1]._id,
        text: "Chào A! Mới có quán mì Quảng ếch cực kỳ đắt khách ở gần cầu Rồng nè, hôm nào vào Đà Nẵng mình dẫn đi ăn thử nha.",
        readBy: [users[0]._id, users[1]._id],
      },
      {
        conversationId: conv1._id,
        sender: users[0]._id,
        text: "Ok ngon lành luôn, tháng sau mình có lịch đi Đà Nẵng rồi, sẽ hú B liền!",
        readBy: [users[0]._id], // B chưa đọc để tạo thông báo tin nhắn chưa đọc
      }
    ]);

    await Conversation.findByIdAndUpdate(conv1._id, {
      lastMessage: "Ok ngon lành luôn, tháng sau mình có lịch đi Đà Nẵng rồi, sẽ hú B liền!"
    });

    // Conversation 2: Nguyễn Văn A (users[0]) & Phạm Minh D (users[3])
    const conv2 = await Conversation.create({
      participants: [users[0]._id, users[3]._id],
      isGroup: false,
    });

    await Message.create([
      {
        conversationId: conv2._id,
        sender: users[3]._id,
        text: "Kế hoạch leo đỉnh Fansipan săn mây của nhóm mình thế nào rồi trưởng đoàn ơi?",
        readBy: [users[0]._id, users[3]._id],
      },
      {
        conversationId: conv2._id,
        sender: users[0]._id,
        text: "Chúng ta sẽ khởi hành vào tối thứ 6 tuần sau bằng xe giường nằm từ Hà Nội, sáng thứ 7 lên đỉnh Fansipan luôn nhé.",
        readBy: [users[0]._id, users[3]._id],
      }
    ]);

    await Conversation.findByIdAndUpdate(conv2._id, {
      lastMessage: "Chúng ta sẽ khởi hành vào tối thứ 6 tuần sau bằng xe giường nằm từ Hà Nội, sáng thứ 7 lên đỉnh Fansipan luôn nhé."
    });

    console.log("Seeded chat conversations and messages successfully.");

    // 9. Seed Violation Reports
    console.log("Seeding violation reports...");
    const reportsData = [
      {
        reporter: users[1]._id, // Trần Thị B
        targetType: "post",
        targetPost: posts[0]._id, // Phượt đêm Hà Nội
        reason: "Nội dung quảng cáo quá nhiều",
        details: "Bài viết chứa nhiều đường link bán hàng cháo sườn sụn cá nhân trái quy định.",
        status: "pending",
      },
      {
        reporter: users[4]._id, // Đỗ Thị E
        targetType: "user",
        targetUser: users[2]._id, // Lê Hoàng C
        reason: "Tài khoản giả mạo",
        details: "Tài khoản này dùng ảnh đại diện của một nhiếp ảnh gia nổi tiếng nước ngoài và mạo danh họ để lấy uy tín.",
        status: "pending",
      },
      {
        reporter: users[3]._id, // Phạm Minh D
        targetType: "post",
        targetPost: posts[3]._id, // Ăn sập chợ Cồn Đà Nẵng
        reason: "Thông tin sai lệch",
        details: "Mức giá các món bánh bèo, bánh lọc tại chợ Cồn hiện đã tăng từ lâu, thông tin 100k ăn sập là sai sự thật.",
        status: "resolved",
      },
      {
        reporter: users[6]._id, // Lê Mai Phương
        targetType: "user",
        targetUser: users[5]._id, // Nguyễn Hoàng Quân
        reason: "Spam tin nhắn quảng cáo",
        details: "Gửi hàng loạt tin nhắn mời mua tour du lịch và máy quay phim cũ trong phần chat riêng tư.",
        status: "dismissed",
      },
      {
        reporter: users[7]._id, // Phạm Quang Linh
        targetType: "post",
        targetPost: posts[8]._id, // Chinh phục đèo Mã Pí Lèng
        reason: "Thông tin nguy hiểm",
        details: "Kêu gọi mọi người tắt đèn pha chạy xe máy ban đêm vượt đèo hiểm trở để cảm nhận độ phiêu. Điều này cực kỳ nguy hiểm cho phượt thủ.",
        status: "pending",
      }
    ];

    const reports = await Report.insertMany(reportsData);
    console.log(`Successfully seeded ${reports.length} violation reports.`);

    console.log("\n====== ALL DEMO DATA SEEDED PERFECTLY IN VIETNAM! ======");
    console.log("Login accounts for testing (all passwords are: password123):");
    users.forEach(u => {
      console.log(`- Name: ${u.displayName} | Email: ${u.email} | Role: ${u.role}`);
    });

  } catch (err) {
    console.error("Error seeding data:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
