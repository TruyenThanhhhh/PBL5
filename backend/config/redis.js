const redis = require("redis");

// Khởi tạo Redis Client
const redisClient = redis.createClient({
  // Bạn có thể cấu hình URL của Redis server tại đây nếu nó không chạy ở local
  // url: 'redis://your-redis-host:6379'
});

// Lắng nghe sự kiện lỗi
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

// Hàm để kết nối đến Redis
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Connected to Redis successfully!");
  }
};

// Kết nối khi ứng dụng khởi động
connectRedis();

module.exports = { redisClient, connectRedis };