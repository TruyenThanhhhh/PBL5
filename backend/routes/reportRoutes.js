const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect, requireAdmin } = require("../middleware/auth");

// 🚩 Người dùng gửi tố cáo
router.post("/", protect, reportController.createReport);

// 👑 Chỉ dành cho Admin quản trị
router.get("/", protect, requireAdmin, reportController.getReports);
router.put("/:id/action", protect, requireAdmin, reportController.handleReportAction);

module.exports = router;
