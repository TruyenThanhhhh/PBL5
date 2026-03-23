const express = require("express");
const router = express.Router();

const postController = require("../controllers/postcontroller.js");

// Vì middleware đang nằm trong server.js
// NÊN bạn phải export nó từ server.js hoặc copy qua file riêng
// Nếu middleware đang global thì không cần import

router.post("/", postController.createPost);
router.get("/", postController.getPosts);
router.put("/like/:id", postController.likePost);

module.exports = router;