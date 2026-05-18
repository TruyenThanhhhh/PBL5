const cloudinary = require("cloudinary").v2;

const multerCloudinary = require("multer-storage-cloudinary");
const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary;

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("[cloudinary] Warning: Missing Cloudinary credentials.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "travel-app/posts",       
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }], 
    // Bật AI của Google Cloud Vision tích hợp trong Cloudinary
    categorization: "google_tagging", 
    auto_tagging: 0.6 // Lấy các tag có độ tin cậy > 60%
  },
});

module.exports = { cloudinary, storage };