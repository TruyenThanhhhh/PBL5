const cloudinaryBase = require("cloudinary");
const cloudinary = cloudinaryBase.v2;
const multerCloudinary = require("multer-storage-cloudinary");

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("[cloudinary] Warning: Missing Cloudinary credentials. Uploads to Cloudinary will fail.");
  console.warn("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env with real values.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let storage;

// Cơ chế tự động tương thích cho cả bản cũ (v3) và bản mới (v4)
if (multerCloudinary.CloudinaryStorage) {
  storage = new multerCloudinary.CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "travel-app/posts",       
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1200, height: 800, crop: "limit" }], 
    },
  });
} else {
  storage = multerCloudinary({
    cloudinary: cloudinaryBase, // <--- ĐIỂM SỬA QUAN TRỌNG: Truyền bản gốc (Base) vào thay vì v2
    folder: "travel-app/posts",
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }]
  });
}

module.exports = { cloudinary, storage };