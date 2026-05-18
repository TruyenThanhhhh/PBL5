const multer = require("multer");
const { storage } = require("../config/cloudinary");

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // tối đa 5MB mỗi ảnh
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh JPG, PNG, WEBP"), false);
    }
  },
});

module.exports = upload;