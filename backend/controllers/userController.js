const User = require('../models/User.js');
const Post = require('../models/Post.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// 1. Đăng ký (Register)
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Email đã tồn tại" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let avatarPath = "";
        if (req.file) avatarPath = req.file.path.replace(/\\/g, '/');

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            avatar: avatarPath
        });

        res.status(201).json({ 
            message: "Đăng ký thành công!", 
            userId: newUser._id, 
            user: newUser 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Đăng nhập (Login)
exports.loginUser = async (req, res) => {
    try {
        const identifier = req.body.email || req.body.username || req.body.identifier;
        const password = req.body.password;
        
        if (!identifier) {
            return res.status(400).json({ message: "Vui lòng nhập email hoặc tên đăng nhập" });
        }

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (!user) return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch && password !== user.password) {
            return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
        
        res.status(200).json({ 
            token, 
            userId: user._id,
            user: { _id: user._id, username: user.username, avatar: user.avatar, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Lấy thông tin Profile
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const posts = await Post.find({ createdBy: userId }).sort({ createdAt: -1 }).populate('createdBy', 'username avatar role');
        res.status(200).json({ user, posts });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};

// 4. Lấy tất cả user
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Toggle Follow
exports.toggleFollow = async (req, res) => {
    try {
        const currentUserId = req.user?.userId || req.user?.id || req.user?._id; 
        const targetUserId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "ID mục tiêu không hợp lệ" });
        }

        const currentUser = await User.findById(currentUserId);
        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
            await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
            res.status(200).json({ message: "Đã hủy theo dõi", following: false });
        } else {
            await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
            await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
            res.status(200).json({ message: "Đã theo dõi", following: true });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. Lấy Feed
exports.getFeed = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('createdBy', 'username avatar role');
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. Lấy danh sách Follower
exports.getFollowers = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "ID không hợp lệ" });
        }
        const user = await User.findById(req.params.id).populate('followers following', 'username avatar');
        res.status(200).json({ followers: user.followers, following: user.following });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 8. CẬP NHẬT PROFILE VÀ ẢNH (BẤT TỬ VỚI CLOUDINARY + DEBUG LOG)
exports.updateProfile = async (req, res) => {
    console.log("\n--- [DEBUG] BẮT ĐẦU API CẬP NHẬT PROFILE ---");
    try {
        const userId = req.params.id;
        console.log("[DEBUG] User ID nhận được:", userId);
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log("[DEBUG] LỖI: User ID không hợp lệ!");
            return res.status(400).json({ message: "ID người dùng không hợp lệ" });
        }

        const { username, bio } = req.body;
        console.log(`[DEBUG] Body nhận được - Username: ${username}, Bio: ${bio}`);
        
        let updateData = {};
        if (username) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;

        // Hàm lấy URL an toàn tuyệt đối từ file object của Cloudinary
        const getFileUrl = (fileObj) => {
            if (!fileObj) return null;
            const url = fileObj.path || fileObj.secure_url || fileObj.url;
            return url ? url.replace(/\\/g, '/') : null;
        };

        // Nhận diện linh hoạt cấu hình upload của routes
        if (req.file) {
            console.log("[DEBUG] Phát hiện tải lên dạng req.file (1 file):", req.file.fieldname);
            if (req.file.fieldname === 'cover') {
                const url = getFileUrl(req.file);
                if (url) updateData.cover = url;
            } else {
                const url = getFileUrl(req.file);
                if (url) updateData.avatar = url;
            }
        } else if (req.files) {
            console.log("[DEBUG] Phát hiện tải lên dạng req.files (nhiều file)");
            if (Array.isArray(req.files)) {
                if (req.files.length > 0) {
                    const url = getFileUrl(req.files[0]);
                    if (url) updateData.avatar = url;
                }
            } else {
                if (req.files['avatar'] && req.files['avatar'].length > 0) {
                    const url = getFileUrl(req.files['avatar'][0]);
                    console.log("[DEBUG] URL Avatar tìm thấy:", url);
                    if (url) updateData.avatar = url;
                }
                if (req.files['cover'] && req.files['cover'].length > 0) {
                    const url = getFileUrl(req.files['cover'][0]);
                    console.log("[DEBUG] URL Cover tìm thấy:", url);
                    if (url) updateData.cover = url;
                }
            }
        } else {
            console.log("[DEBUG] Không phát hiện tệp ảnh nào tải lên.");
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password');
        if (!updatedUser) {
            console.log("[DEBUG] LỖI: Không tìm thấy tài khoản để lưu database.");
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        }

        console.log("[DEBUG] THÀNH CÔNG: Đã lưu dữ liệu vào database!");
        res.status(200).json({ message: "Cập nhật thành công!", user: updatedUser });
    } catch (error) {
        console.error("[DEBUG] NGOẠI LỆ NGHIÊM TRỌNG TRONG API:", error);
        res.status(500).json({ message: "Lỗi khi lưu dữ liệu", error: error.message });
    }
};