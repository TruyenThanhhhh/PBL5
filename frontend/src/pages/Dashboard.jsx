import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useInRouterContext, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Bell, MessageSquare, Compass, Settings, 
  MapPin, Image as ImageIcon, Send, ShieldAlert,
  Heart, Share2, MoreHorizontal, CheckCircle, X, Info, CornerDownRight, Loader2, Bot,
  ArrowLeft, User, Bookmark, Users, UserPlus, Check, Search, Clock, TrendingUp, Trash2,
  Sun, Moon, ChevronDown, LogOut, Globe2, Home, Upload
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { accountNavMenu } from '../constants/accountNavMenu';

const dashboardCopy = {
  vi: {
    searchAll: 'Tìm kiếm mọi thứ...',
    home: 'Trang chủ',
    explore: 'Khám phá',
    friends: 'Bạn bè',
    confirmDeleteTitle: 'Xác nhận xóa bình luận',
    confirmDeleteBody: 'Bạn có chắc chắn xóa bình luận này? Hành động này không thể hoàn tác.',
    cancel: 'Hủy',
    delete: 'Xóa',
    friendSearch: 'Tìm kiếm bạn bè...',
    searchResults: 'Kết quả tìm kiếm',
    noUsersFound: 'Không tìm thấy người dùng nào.',
    message: 'Nhắn tin',
    undo: 'Hoàn tác',
    accept: 'Chấp nhận',
    newFriendRequests: 'Lời mời kết bạn mới',
    friendSuggestions: 'Gợi ý kết bạn',
    noMoreSuggestions: 'Bạn đã kết bạn với tất cả mọi người!',
    mutualHint: 'Có thể bạn quen',
    addFriend: 'Kết bạn',
    themeToggle: 'Chuyển chế độ tối/sáng',
    createPostTitle: 'Tạo bài viết mới',
    createPostSubtitle: 'Chia sẻ ảnh, ghim map, kể lại trải nghiệm của bạn.',
    adminPlaceholder: 'Phát thông báo hệ thống...',
    postPlaceholder: 'Chia sẻ địa điểm bạn vừa khám phá...',
    mapPickerHelp: 'Click vào bản đồ để lấy tọa độ chính xác',
    pinned: 'Đã ghim vị trí',
    pinLocation: 'Ghim vị trí',
    uploadImage: 'Tải ảnh lên',
    posting: 'Đang tải...',
    submitPost: 'Đăng Bài',
    trending: 'Đang thịnh hành',
    viewAll: 'Xem tất cả',
    noImage: 'Không có ảnh',
    discover: 'Khám phá',
    unknown: 'Chưa rõ',
    anonymous: 'Ẩn danh',
    adminNotice: 'Thông báo từ Ban Quản Trị',
    copyPostLink: 'Copy link bài viết',
    deletePost: 'Xóa bài viết',
    showPost: 'Hiện bài viết',
    hidePost: 'Ẩn bài viết',
    unknownLocation: 'Chưa xác định',
    pinnedLocation: 'Vị trí được ghim',
    closeMap: 'Đóng Map',
    viewMap: 'Xem Map',
    comments: 'Bình luận',
    writeComment: 'Viết bình luận...',
    save: 'Lưu',
    reply: 'Phản hồi',
    edit: 'Sửa',
    noComments: 'Chưa có bình luận nào. Hãy là người đầu tiên!',
    replyingTo: (name) => `Đang phản hồi @${name}...`,
    replyTo: (name) => `Phản hồi ${name}...`,
    hotPlaces: 'Địa Điểm Đang Hot',
    noData: 'Chưa có dữ liệu',
    unknownPlace: 'Chưa rõ vị trí',
    likes: 'lượt thích',
    quickSuggestions: 'Gợi ý nhanh',
    quickTrip: 'Lịch trình Đà Nẵng 2N1Đ',
    quickFood: 'Ăn gì ở Huế?',
    quickCheckin: 'Check-in Hội An buổi tối',
    quickTripPrompt: 'Gợi ý lịch trình Đà Nẵng 2 ngày 1 đêm',
    quickFoodPrompt: 'Gợi ý món ăn ngon ở Huế',
    quickCheckinPrompt: 'Địa điểm check-in đẹp ở Hội An buổi tối',
    travelTip: 'Đăng bài có ảnh thật + tọa độ ghim sẽ giúp bài nổi bật hơn và được cộng đồng tương tác.',
    aiTitle: 'AI Tư vấn địa điểm',
    aiThinking: 'Đang tư vấn...',
    aiPlaceholder: 'Ví dụ: Gợi ý lịch trình Đà Lạt 2 ngày',
    send: 'Gửi',
    aiGreeting: 'Xin chào! Mình là trợ lý du lịch. Bạn muốn đi đâu cuối tuần này?',
  },
  en: {
    searchAll: 'Search everything...',
    home: 'Home',
    explore: 'Explore',
    friends: 'Friends',
    confirmDeleteTitle: 'Delete Comment',
    confirmDeleteBody: 'Are you sure you want to delete this comment? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    friendSearch: 'Search friends...',
    searchResults: 'Search Results',
    noUsersFound: 'No users found.',
    message: 'Message',
    undo: 'Undo',
    accept: 'Accept',
    newFriendRequests: 'New Friend Requests',
    friendSuggestions: 'Friend Suggestions',
    noMoreSuggestions: 'You are already friends with everyone!',
    mutualHint: 'People you may know',
    addFriend: 'Add friend',
    themeToggle: 'Toggle dark/light mode',
    createPostTitle: 'Create New Post',
    createPostSubtitle: 'Share photos, pin a map, and tell your travel story.',
    adminPlaceholder: 'Post a system announcement...',
    postPlaceholder: 'Share a place you just discovered...',
    mapPickerHelp: 'Click the map to pick exact coordinates',
    pinned: 'Location pinned',
    pinLocation: 'Pin location',
    uploadImage: 'Upload image',
    posting: 'Uploading...',
    submitPost: 'Post',
    trending: 'Trending',
    viewAll: 'View all',
    noImage: 'No image',
    discover: 'Explore',
    unknown: 'Unknown',
    anonymous: 'Anonymous',
    adminNotice: 'Announcement from Admin Team',
    copyPostLink: 'Copy post link',
    deletePost: 'Delete post',
    showPost: 'Show post',
    hidePost: 'Hide post',
    unknownLocation: 'Unknown',
    pinnedLocation: 'Pinned location',
    closeMap: 'Close Map',
    viewMap: 'View Map',
    comments: 'Comments',
    writeComment: 'Write a comment...',
    save: 'Save',
    reply: 'Reply',
    edit: 'Edit',
    noComments: 'No comments yet. Be the first one!',
    replyingTo: (name) => `Replying to @${name}...`,
    replyTo: (name) => `Reply to ${name}...`,
    hotPlaces: 'Hot Places',
    noData: 'No data yet',
    unknownPlace: 'Unknown place',
    likes: 'likes',
    quickSuggestions: 'Quick Suggestions',
    quickTrip: 'Da Nang 2D1N itinerary',
    quickFood: 'What to eat in Hue?',
    quickCheckin: 'Hoi An night check-in',
    quickTripPrompt: 'Suggest a 2-day 1-night Da Nang itinerary',
    quickFoodPrompt: 'Suggest good food to try in Hue',
    quickCheckinPrompt: 'Beautiful check-in places in Hoi An at night',
    travelTip: 'Posts with real photos and pinned coordinates stand out more and get better community engagement.',
    aiTitle: 'AI Travel Advisor',
    aiThinking: 'Thinking...',
    aiPlaceholder: 'Example: Suggest a 2-day Da Lat itinerary',
    send: 'Send',
    aiGreeting: 'Hi! I am your travel assistant. Where would you like to go this weekend?',
  },
};

const getAvatarUrl = (url, name) => {
  return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

const SavePostButton = ({ postId, initialIsSaved, onToggleSave }) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  
  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved, postId]);

  const handleSave = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/save-post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsSaved(data.isSaved);
        if (onToggleSave) onToggleSave(postId, data.isSaved);
      } else {
        console.warn('Lưu bài:', data.message || res.status);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button type="button" onClick={handleSave} className={`flex items-center gap-1.5 transition-colors text-[13px] font-bold ${isSaved ? 'text-[#f44336]' : 'text-gray-500 hover:text-gray-900'}`}>
      <Bookmark size={20} strokeWidth={isSaved ? 3 : 2.5} fill={isSaved ? '#f44336' : 'none'} />
    </button>
  );
};

let leafletAssetsPromise = null;
const loadLeafletAssets = async () => {
  if (window.L) return;
  if (!leafletAssetsPromise) {
    leafletAssetsPromise = new Promise((resolve, reject) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (window.L) return resolve();
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Không tải ược Leaflet'));
        document.head.appendChild(script);
      }
    });
  }
  await leafletAssetsPromise;
};

function RealMapPicker({ setPickedCoords }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      await loadLeafletAssets();
      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        const map = L.map(mapRef.current).setView([16.4637, 107.5905], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (markerInstance.current) markerInstance.current.setLatLng([lat, lng]);
          else markerInstance.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
          setPickedCoords({ lat, lng });
        });
        mapInstance.current = map;
        setIsMapReady(true);
      }
    };
    loadMap().catch(() => setIsMapReady(false));
    return () => { isMounted = false; if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [setPickedCoords]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full z-0 rounded-lg cursor-crosshair" />
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-[12px] font-bold text-gray-500">
          Đang tải bản đồ...
        </div>
      )}
    </div>
  );
}

function RealMapViewer({ lat, lng, role, location }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      await loadLeafletAssets();
      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        const adminIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        const icon = role === 'admin' ? adminIcon : defaultIcon;
        const popupText = typeof location === 'string' ? location : 'Vị trí được ghim';
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${popupText}</b>`);
        mapInstance.current = map;
        setIsMapReady(true);
      }
    };
    loadMap().catch(() => setIsMapReady(false));
    return () => { isMounted = false; if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [lat, lng, role, location]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-[12px] font-bold text-gray-500">
          Đang tải bản đồ...
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const menuT = accountNavMenu[language] || accountNavMenu.vi;
  const t = dashboardCopy[language] || dashboardCopy.vi;
  const dateLocale = language === 'en' ? 'en-US' : 'vi-VN';
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState({ userId: '', username: 'Khách', role: 'user', avatar: '' });
  
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [savedPostsSet, setSavedPostsSet] = useState(new Set());
  
  const [newPost, setNewPost] = useState({ title: '', description: '', category: 'General' });
  const [pickedCoords, setPickedCoords] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [expandedMap, setExpandedMap] = useState({});
  const [notification, setNotification] = useState({ type: '', text: '' });

  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [isFetchingComments, setIsFetchingComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState({ parentId: null, childUsername: null });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [likingPosts, setLikingPosts] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, postId: null, commentId: null });
  const [openPostMenuId, setOpenPostMenuId] = useState(null);

  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([
    { role: 'ai', content: t.aiGreeting }
  ]);

  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayBadgeCount = unreadCount > 9 ? '9+' : unreadCount;

  const [allUsers, setAllUsers] = useState([]); 
  const [friends, setFriends] = useState([]); 
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]); 
  const [isFriendDropdownOpen, setIsFriendDropdownOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const [isUserChatOpen, setIsUserChatOpen] = useState(false);
  const [chatView, setChatView] = useState('list'); 
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [userMessageInput, setUserMessageInput] = useState('');
  const [userMessages, setUserMessages] = useState({}); 
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Group chat states
  const [conversationsList, setConversationsList] = useState([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isChatOptionsOpen, setIsChatOptionsOpen] = useState(false);
  const [chatImageFile, setChatImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  
  useEffect(() => {
    if (!isAvatarMenuOpen) return;
    const onDocMouseDown = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isAvatarMenuOpen]);

  const handleAvatarMenuNavigate = (path, state) => {
    setIsAvatarMenuOpen(false);
    if (state) navigate(path, { state });
    else navigate(path);
  };

  const handleAvatarLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar');
    localStorage.removeItem('displayName');
    localStorage.removeItem('roleRequestStatus');
    setIsAvatarMenuOpen(false);
    navigate('/login');
  };
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [typingInfo, setTypingInfo] = useState(null); // { username }

  useEffect(() => {
    setAiChatMessages(prev => {
      if (prev.length !== 1 || prev[0]?.role !== 'ai') return prev;
      return [{ role: 'ai', content: t.aiGreeting }];
    });
  }, [t.aiGreeting]);

  const getUserById = (id) => allUsers.find(u => String(u._id) === String(id)) || { username: 'Người dùng', _id: id };

  const handleNavigateProfile = (userId) => {
    if(userId) {
      navigate('/profile', { state: { targetUserId: userId } });
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) { 
      setNotifications([]);
    }
  };

  const handleReadNotification = async (notif) => {
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    setIsNotificationOpen(false);

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`http://localhost:5000/api/notifications/${notif._id}/read`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      }).catch(()=>{});
    }

    if (notif.type === 'message' && notif.sender?._id) {
      setIsFriendDropdownOpen(false);
      window.dispatchEvent(new CustomEvent('openChat', { detail: { targetUserId: notif.sender._id } }));
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`http://localhost:5000/api/notifications/read-all`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      }).catch(()=>{});
    }
  };

  const fetchAllUsers = async () => {
    const token = localStorage.getItem('token');
    const myId = localStorage.getItem('userId');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/users/search', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(prev => {
          const newUsers = [...prev];
          data.forEach(d => {
             if (!newUsers.find(u => String(u._id) === String(d._id))) newUsers.push(d);
          });
          return newUsers;
        });

        if (myId) {
          const sent = data
            .filter(u => u.friendRequests && u.friendRequests.includes(myId))
            .map(u => String(u._id));
          setSentRequests(sent);
        }
      }
    } catch (error) {}
  };

  const fetchFriendData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        if (user) {
          const myFriends = (user.friends || []).map(u => String(u._id || u));
          const myReceivedRequests = (user.friendRequests || []).map(u => String(u._id || u));
          
          setFriends(myFriends);
          setReceivedRequests(myReceivedRequests);

          setAllUsers(prev => {
            const newUsers = [...prev];
            (user.friendRequests || []).forEach(reqUser => {
              if (reqUser._id && !newUsers.find(exist => String(exist._id) === String(reqUser._id))) {
                newUsers.push(reqUser);
              }
            });
            (user.friends || []).forEach(fUser => {
              if (fUser._id && !newUsers.find(exist => String(exist._id) === String(fUser._id))) {
                newUsers.push(fUser);
              }
            });
            return newUsers;
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversationsList(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateGroup = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!groupNameInput.trim() || selectedGroupMembers.length === 0) {
      showToast('error', 'Vui lòng nhập tên nhóm và chọn thành viên.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/messages/group', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: groupNameInput, participantIds: selectedGroupMembers })
      });
      if (res.ok) {
        showToast('success', 'Tạo nhóm thành công!');
        setIsCreateGroupOpen(false);
        setGroupNameInput('');
        setSelectedGroupMembers([]);
        fetchConversations();
      } else {
        const data = await res.json();
        showToast('error', data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      showToast('error', 'Lỗi kết nối.');
    }
  };

  const fetchChatHistory = async (targetUserId, groupId = null) => {
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');
    if (!token || (!targetUserId && !groupId)) return;
    
    setIsChatLoading(true);
    try {
      let convId = groupId;
      
      if (!convId) {
        const convRes = await fetch('http://localhost:5000/api/messages/conversation', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId })
        });

        if (!convRes.ok) {
          if(convRes.status === 403) showToast('error', 'Ch0 bạn bè mới có thỒ nhắn tin.');
          return;
        }
        
        const conversation = await convRes.json();
        convId = conversation._id;
      }

      setCurrentConversationId(convId); 

      const msgRes = await fetch(`http://localhost:5000/api/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (msgRes.ok) {
        const messages = await msgRes.json();
        const myId = String(localStorage.getItem('userId'));
        console.log('DEBUG: Current User ID:', myId);
        const formattedMessages = messages.map((msg, i) => {
          const senderId = String(msg.sender?._id || msg.sender);
          const isMe = senderId === myId;
          if (i === 0) console.log('DEBUG: Message Sender ID:', senderId, 'isMe:', isMe);
          return {
            sender: isMe ? 'me' : 'them',
            senderName: msg.sender?.username,
            senderAvatar: msg.sender?.avatar,
            senderId: senderId,
            text: msg.text,
            image: msg.image,
            readBy: msg.readBy?.map(u => u._id || u),
            createdAt: msg.createdAt
          };
        });
        
        setUserMessages(prev => ({
          ...prev,
          [convId]: formattedMessages
        }));

        // Sau khi lấy history, tự "ng ánh dấu ã xem
        markAsSeen(convId);
      }
    } catch (error) {
      console.error("Chat history error:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const fetchTrendingPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts/trending');
      if (res.ok) {
        const data = await res.json();
        setTrendingPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách trending:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) { 
      setPosts([]); 
    }
  };

  const fetchSavedPosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/users/saved-posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSavedPostsSet(new Set(data.map((p) => String(p._id))));
        }
      }
    } catch (error) {}
  };

  const handleToggleSavedPost = useCallback((pid, saved) => {
    const id = String(pid);
    setSavedPostsSet((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const userRole = localStorage.getItem('role') || 'user';
    const userId = localStorage.getItem('userId') || ''; 
    const username = localStorage.getItem('username') || '';
    const avatar = localStorage.getItem('avatar') || '';
    setCurrentUser({ userId, username, role: String(userRole).toLowerCase(), avatar });
    
    loadLeafletAssets().catch(() => {});
    fetchPosts();
    fetchTrendingPosts(); // Gọi hàm lấy danh sách trending khi load trang
    fetchSavedPosts();

    if (userId) {
      fetchAllUsers();
      fetchFriendData();
    }

  }, [navigate]);

  useEffect(() => {
    if (location.state?.openChat) {
      window.dispatchEvent(
        new CustomEvent('openChat', {
          detail: location.state.targetUserId ? { targetUserId: location.state.targetUserId } : undefined,
        })
      );
      window.history.replaceState({}, document.title);
    }
    if (location.state?.openNotifications) {
      window.dispatchEvent(new CustomEvent('openNotifications'));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userMessages, chatView]);

  const showToast = (type, text) => {
    setNotification({ type, text: String(text) });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  const handleAddFriend = async (userId) => {
    const strUserId = String(userId);
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng Ēng nhập Ồ kết bạn.');

    setSentRequests(prev => [...prev, strUserId]);

    try {
      const res = await fetch(`http://localhost:5000/api/users/friend-request/${strUserId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Đã gửi lời mời kết bạn');
        fetchFriendData(); 
      } else {
        setSentRequests(prev => prev.filter(id => id !== strUserId));
        showToast('error', data.message || 'Không thỒ gửi lời mời');
      }
    } catch (error) {
      setSentRequests(prev => prev.filter(id => id !== strUserId));
      showToast('error', 'Lỗi kết nối server');
    }
  };

  const handleUndoRequest = async (userId) => {
    const strUserId = String(userId);
    const token = localStorage.getItem('token');
    if (!token) return;

    setSentRequests(prev => prev.filter(id => id !== strUserId));

    try {
      const res = await fetch(`http://localhost:5000/api/users/friend-request/${strUserId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('success', 'Đã thu hi lời mời');
        fetchFriendData();
      } else {
        setSentRequests(prev => [...prev, strUserId]);
        showToast('error', 'Lỗi khi thu hồi');
      }
    } catch (error) {
      setSentRequests(prev => [...prev, strUserId]);
      showToast('error', 'Lỗi kết nối');
    }
  };

  const handleAcceptFriend = async (userId) => {
    const strUserId = String(userId);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/accept-friend/${strUserId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast('success', 'Đã trx thành bạn bè');
        setReceivedRequests(prev => prev.filter(id => id !== strUserId));
        setFriends(prev => [...prev, strUserId]);
        fetchFriendData(); 
      }
    } catch (error) {
      showToast('error', 'Lỗi khi chấp nhận');
    }
  };

  const handleDeclineFriend = async (userId) => {
    const strUserId = String(userId);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/unfriend/${strUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast('info', 'Đã bỏ qua lời mời');
        setReceivedRequests(prev => prev.filter(id => id !== strUserId));
      }
    } catch (error) {
      showToast('error', 'Lỗi khi bỏ qua');
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsData[postId]) {
      setIsFetchingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setCommentsData(prev => ({ ...prev, [postId]: Array.isArray(data.comments) ? data.comments : [] }));
          const commentCount = Array.isArray(data.comments) ? data.comments.length : 0;
          setPosts(prev => prev.map((post) => post._id === postId ? { ...post, totalReviews: commentCount } : post));
        } else {
          setCommentsData(prev => ({ ...prev, [postId]: [] }));
        }
      } catch (error) {
        setCommentsData(prev => ({ ...prev, [postId]: [] }));
      } finally {
        setIsFetchingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const refreshComments = async (postId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Không thỒ tải bình luận');
      const data = await res.json();
      const newComments = Array.isArray(data.comments) ? data.comments : [];
      setCommentsData(prev => ({ ...prev, [postId]: newComments }));
      setPosts(prev => prev.map((post) => post._id === postId ? { ...post, totalReviews: newComments.length } : post));
    } catch (error) {
      setCommentsData(prev => ({ ...prev, [postId]: [] }));
    }
  };

  const handlePostComment = async (postId, parentId = null) => {
    const token = localStorage.getItem('token');
    let text = parentId ? replyInputs[parentId] : commentInputs[postId];
    if (!text || !text.trim()) return;

    if (parentId && replyingTo.parentId === parentId && replyingTo.childUsername) {
      text = `@${replyingTo.childUsername} ${text}`;
    }

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text, parentComment: parentId || null })
      });

      if (res.ok) {
        if (parentId) {
          setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
          setReplyingTo({ parentId: null, childUsername: null });
        } else {
          setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        }
        await refreshComments(postId);
      } else {
        throw new Error('Lỗi gửi bình luận');
      }
    } catch (error) {
      showToast('error', error.message || 'Lỗi mạng!');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng Ēng nhập Ồ xóa bình luận.');

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thỒ xóa bình luận');
      }

      showToast('success', 'Đã xóa bình luận');
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentContent('');
      }
      await refreshComments(postId);
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi xóa bình luận');
    }
  };

  const showDeleteConfirm = (postId, commentId) => {
    setDeleteConfirm({ open: true, postId, commentId });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ open: false, postId: null, commentId: null });
  };

  const confirmDeleteComment = async () => {
    const { postId, commentId } = deleteConfirm;
    if (!postId || !commentId) {
      cancelDelete();
      return;
    }
    await handleDeleteComment(postId, commentId);
    cancelDelete();
  };

  const startEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content || '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const saveEditComment = async (postId, commentId) => {
    if (!editingCommentContent || !editingCommentContent.trim()) {
      return showToast('error', 'N"i dung bình luận không ược Ồ trng.');
    }
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng Ēng nhập Ồ sửa bình luận.');

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editingCommentContent })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thỒ cập nhật bình luận');
      }

      showToast('success', 'Đã cập nhật bình luận');
      cancelEditComment();
      await refreshComments(postId);
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi cập nhật bình luận');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) { showToast('error', `T!p không hợp l!!`); continue; }
      if (file.size > 5 * 1024 * 1024) { showToast('error', `Ảnh quá 5MB!`); continue; }
      validFiles.push(file);
    }
    if (validFiles.length + selectedFiles.length > 5) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return showToast('error', "Ch0 ti a 5 ảnh!");
    }
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    setPreviewUrls([...previewUrls, ...validFiles.map(file => URL.createObjectURL(file))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickPost = async () => {
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa Ēng nhập. Vui lòng Ēng nhập Ồ Ēng bài.');
      }
      const finalLocation = pickedCoords ? `[${pickedCoords.lat.toFixed(4)}, ${pickedCoords.lng.toFixed(4)}]` : "Chưa xác định";
      let finalDescription = newPost.description ? String(newPost.description) : "";
      
      const postFormData = new FormData();
      postFormData.append('title', currentUser.role === 'admin' ? 'THNG BÁO TỪ H  THỐNG' : (newPost.title || `Trải nghiệm của ${currentUser.username}`));
      postFormData.append('description', finalDescription);
      postFormData.append('location', finalLocation);
      postFormData.append('category', currentUser.role === 'admin' ? 'System' : newPost.category);
      postFormData.append('lat', String(pickedCoords?.lat ?? ''));
      postFormData.append('lng', String(pickedCoords?.lng ?? ''));
      selectedFiles.forEach((file) => postFormData.append('images', file));

      const res = await fetch('http://localhost:5000/api/posts/create-with-media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: postFormData
      });
      if (res.ok) {
        setNewPost({ title: '', description: '', category: 'General' });
        setPickedCoords(null); setShowMapPicker(false); setSelectedFiles([]); setPreviewUrls([]);
        fetchPosts(); showToast('success', 'Đăng bài viết thành công!');
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Lỗi server khi đăng bài');
      }
    } catch (error) { 
      showToast('error', error.message || 'Lỗi hệ thống'); 
    } finally { 
      setIsPosting(false); 
    }
  };

  const handleLikePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('error', 'Vui lòng Ēng nhập Ồ thả tim bài viết.');
      return;
    }

    setLikingPosts((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thỒ thả tim bài viết');
      }

      const data = await res.json();
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          const existingLikes = Array.isArray(post.likes) ? [...post.likes] : [];
          const userLiked = existingLikes.some((userId) => userId?.toString() === currentUser.userId);

          if (data.liked) {
            const updatedLikes = userLiked ? existingLikes : [...existingLikes, currentUser.userId];
            return { ...post, likes: updatedLikes };
          }

          const updatedLikes = existingLikes.filter((userId) => userId?.toString() !== currentUser.userId);
          return { ...post, likes: updatedLikes };
        })
      );
    } catch (error) {
      showToast('error', error.message || 'Đã xảy ra lỗi khi thả tim');
    } finally {
      setLikingPosts((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const getPostImageUrl = (img) => {
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object') return img.url || img.path || '';
    return '';
  };

  const handleCopyPostLink = async (postId) => {
    const url = `${window.location.origin}/post-detail?postId=${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', 'Đã copy link bài viết.');
    } catch (error) {
      showToast('error', 'Không thỒ copy link.');
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng Ēng nhập.');
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thỒ xóa bài viết');
      }
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast('success', 'Đã xóa bài viết.');
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi xóa bài viết.');
    } finally {
      setOpenPostMenuId(null);
    }
  };

  const handleToggleVisibility = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng Ēng nhập.');
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/toggle-visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thỒ thay "i trạng thái bài viết');
      }
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isHidden: data.isHidden } : p)));
      showToast('success', data.message || 'Đã cập nhật trạng thái bài viết.');
    } catch (error) {
      showToast('error', error.message || 'Lỗi hệ thống.');
    } finally {
      setOpenPostMenuId(null);
    }
  };

  const handleSendAiChat = async () => {
    const text = aiChatInput.trim();
    if (!text || isAiChatLoading) return;

    const nextMessages = [...aiChatMessages, { role: 'user', content: text }];
    setAiChatMessages(nextMessages);
    setAiChatInput('');
    setIsAiChatLoading(true);

    try {
      const history = nextMessages.slice(0, -1).map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      if (!res.ok) throw new Error('Không gọi ược trợ lý AI');
      const data = await res.json();
      const reply = data.reply || 'Mình chưa có câu trả lời phù hợp, bạn thử lại nhé.';
      setAiChatMessages((prev) => [...prev, { role: 'ai', content: reply }]);
    } catch (error) {
      setAiChatMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Hi!n tại AI ang bận hoặc thiếu cấu hình `GROQ_API_KEY` x backend.' }
      ]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  const markAsSeen = async (convId) => {
    if (!convId) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:5000/api/messages/${convId}/seen`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (socketRef.current) {
        socketRef.current.emit('mark_as_seen', { conversationId: convId, userId: localStorage.getItem('userId') });
      }
    } catch (err) {
      console.error('markAsSeen error:', err);
    }
  };

  const handleSendUserMessage = async () => {
    if ((!userMessageInput.trim() && !chatImageFile) || (!selectedChatUser && !selectedGroup)) return;
    const token = localStorage.getItem('token');
    const text = userMessageInput.trim();
    let convId = currentConversationId;
    
    setUserMessageInput('');
    setIsChatOptionsOpen(false);

    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socketRef.current && convId) {
      socketRef.current.emit('stop_typing', { conversationId: convId, userId: currentUser.userId });
    }

    try {
      let imageUrl = null;
      if (chatImageFile) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append('image', chatImageFile);
        const uploadRes = await fetch('http://localhost:5000/api/messages/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
        setChatImageFile(null);
        setIsUploadingImage(false);
      }

      // Tạo conversation nếu chưa có (1-1 chat)
      if (!convId && !selectedGroup) {
        const targetUserId = String(selectedChatUser._id);
        const convRes = await fetch('http://localhost:5000/api/messages/conversation', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId })
        });
        if (convRes.ok) {
          const conversation = await convRes.json();
          convId = conversation._id;
          setCurrentConversationId(convId);
          if (socketRef.current) socketRef.current.emit('join_room', convId);
        }
      }

      if (!convId && selectedGroup) convId = selectedGroup._id;
      if (!convId) return;

      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: convId,
          receiverId: selectedGroup ? undefined : String(selectedChatUser._id),
          text,
          image: imageUrl
        })
      });

      if (res.ok) {
        // Socket emit cho người khác
        if (socketRef.current) {
          socketRef.current.emit('send_message', {
            conversationId: convId,
            text,
            image: imageUrl,
            senderId: localStorage.getItem('userId'),
            senderName: localStorage.getItem('username'),
            senderAvatar: localStorage.getItem('avatar')
          });
        }
        
        // Optimistic update cho chính mình
        const msgObj = { 
          sender: 'me', 
          text, 
          image: imageUrl,
          senderName: localStorage.getItem('username'), 
          senderAvatar: localStorage.getItem('avatar'),
          readBy: [localStorage.getItem('userId')],
          createdAt: new Date().toISOString()
        };

        setUserMessages(prev => ({
          ...prev,
          [convId]: [...(prev[convId] || []), msgObj]
        }));
      }
    } catch (err) {
      console.error('handleSendUserMessage error:', err);
      setIsUploadingImage(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedChatUser) return;
    const token = localStorage.getItem('token');
    if (!window.confirm(`Bạn có chắc chắn muốn chặn ${selectedChatUser.username}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/block/${selectedChatUser._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('success', `Đã chặn ${selectedChatUser.username}`);
        setIsUserChatOpen(false);
        fetchConversations();
        fetchFriendData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentConversationId) return;
    const token = localStorage.getItem('token');
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${currentConversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('success', 'Đã xóa cu"c trò chuy!n');
        setChatView('list');
        fetchConversations();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChatInputChange = (e) => {
    setUserMessageInput(e.target.value);
    if (!socketRef.current || !currentConversationId) return;
    // Emit typing
    socketRef.current.emit('typing', {
      conversationId: currentConversationId,
      userId: currentUser.userId,
      username: currentUser.username
    });
    // Auto stop typing sau 1.5 giây
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { conversationId: currentConversationId, userId: currentUser.userId });
    }, 1500);
  };

  const currentUserIdStr = String(currentUser.userId || '');

  const searchResults = allUsers.filter(u => 
    u.role !== 'admin' && 
    String(u._id) !== currentUserIdStr && 
    u.username?.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  const recommendedUsers = allUsers.filter(u => {
    const targetIdStr = String(u._id);
    return u.role !== 'admin' && 
           targetIdStr !== currentUserIdStr && 
           !friends.includes(targetIdStr) &&
           !receivedRequests.includes(targetIdStr) &&
           !sentRequests.includes(targetIdStr); 
  });

  const currentKey = currentConversationId || (selectedGroup ? selectedGroup._id : (selectedChatUser ? String(selectedChatUser._id) : null));
  const currentChatMessages = currentKey ? (userMessages[currentKey] || []) : [];

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8f9fa]'} font-sans relative`}>
      {notification.text && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${notification.type === 'error' ? 'bg-white border-[#f44336] text-gray-800' : 'bg-white border-green-500 text-gray-800'}`}>
          {notification.type === 'error' ? <ShieldAlert size={24} className="text-[#f44336]" /> : <CheckCircle size={24} className="text-green-500" />}
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{notification.text}</p>
          <button onClick={() => setNotification({ type: '', text: '' })} className="ml-4 text-gray-400 hover:text-gray-900"><X size={18} /></button>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">{t.confirmDeleteTitle}</h3>
            <p className="text-sm text-gray-700 mb-5">{t.confirmDeleteBody}</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelDelete} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">{t.cancel}</button>
              <button type="button" onClick={confirmDeleteComment} className="px-4 py-2 rounded-lg bg-[#f44336] text-white hover:bg-[#e22d41]">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`h-[72px] border-b flex items-center justify-between px-6 z-[100] shadow-sm sticky top-0 transition-colors duration-300
        ${isDarkMode ? 'bg-[#1e293b]/80 backdrop-blur-md border-gray-700' : 'bg-white/80 backdrop-blur-md border-gray-100'}`}>
        <div className="flex-1 flex items-center gap-6">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-2xl tracking-tighter hover:opacity-80 transition-opacity whitespace-nowrap">The Wanderer</Link>
          <div className="relative w-full max-w-[350px] hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={t.searchAll}
              className={`w-full pl-9 pr-3 py-2.5 rounded-full text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all shadow-sm border
                ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#f8f9fa] border-gray-200 hover:bg-white focus:bg-white'}`}
            />
          </div>
        </div>
        
        <nav className={`flex justify-center items-center gap-10 text-[15px] font-bold shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Link to="/dashboard" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">{t.home}</Link>
          <Link to="/explore" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">{t.explore}</Link>
          <Link to="/community" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">{menuT.community}</Link>
          <Link to="/friends" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">{t.friends}</Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-2 md:gap-3 shrink-0 min-w-0">
          
          <div className="relative flex items-center gap-1">
            <button 
              type="button"
              onClick={() => {
                setIsFriendDropdownOpen(false);
                setIsAvatarMenuOpen(false);
                window.dispatchEvent(new CustomEvent('openNotifications'));
              }}
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Bell size={22} strokeWidth={2} />
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsFriendDropdownOpen(false);
                setIsAvatarMenuOpen(false);
                window.dispatchEvent(new CustomEvent('openChat'));
              }}
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <MessageSquare size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="relative flex items-center">
            <button 
              type="button" 
              onClick={() => {
                setIsFriendDropdownOpen(!isFriendDropdownOpen);
                setIsAvatarMenuOpen(false);
                if (!isFriendDropdownOpen) fetchFriendData(); 
              }} 
              className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isFriendDropdownOpen ? 'text-[#f44336]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Users size={22} strokeWidth={2} />
              {receivedRequests.length > 0 ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              ) : null}
            </button>
            
            {isFriendDropdownOpen && (
              <div className={`absolute right-0 top-12 w-[340px] border shadow-2xl rounded-2xl overflow-hidden z-[130] animate-in slide-in-from-top-2 fade-in ${isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder={t.friendSearch}
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      className={`w-full rounded-full py-2 pl-9 pr-4 text-[13px] outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-[#f4f4f5] text-gray-900'}`}
                    />
                  </div>
                </div>

                <div className="max-h-[350px] overflow-y-auto pb-4">
                  {friendSearchQuery.trim() !== '' ? (
                    <div className="px-2 pt-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">{t.searchResults}</p>
                      {searchResults.length === 0 ? (
                        <p className="text-[13px] text-center text-gray-500 py-4">{t.noUsersFound}</p>
                      ) : (
                        searchResults.map(user => {
                          const strUserId = String(user._id);
                          return (
                            <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                              <div onClick={() => handleNavigateProfile(user._id)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 cursor-pointer overflow-hidden">
                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p onClick={() => handleNavigateProfile(user._id)} className="font-bold text-[13px] text-gray-900 truncate cursor-pointer hover:underline">{user.username}</p>
                              </div>
                              <div className="shrink-0 flex items-center">
                                {friends.includes(strUserId) ? (
                                  <button onClick={() => { setIsFriendDropdownOpen(false); window.dispatchEvent(new CustomEvent('openChat', { detail: { targetUserId: user._id } })); }} className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200">{t.message}</button>
                                ) : sentRequests.includes(strUserId) ? (
                                  <button onClick={() => handleUndoRequest(user._id)} className="text-[11px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200"><Clock size={12}/> {t.undo}</button>
                                ) : receivedRequests.includes(strUserId) ? (
                                  <button onClick={() => handleAcceptFriend(user._id)} className="text-[11px] font-bold text-white bg-[#f44336] px-3 py-1.5 rounded-full hover:bg-[#e22d41]">{t.accept}</button>
                                ) : (
                                  <button onClick={() => handleAddFriend(user._id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-[#f44336] rounded-full hover:bg-red-100 transition-colors">
                                    <UserPlus size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <>
                      {receivedRequests.length > 0 ? (
                        <div className="px-2 pt-3 pb-2 border-b border-gray-100">
                          <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest px-2 mb-2">{t.newFriendRequests}</p>
                          {receivedRequests.map(reqId => {
                            const user = getUserById(reqId);
                            return (
                              <div key={reqId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <div onClick={() => handleNavigateProfile(user._id)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 cursor-pointer overflow-hidden">
                                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p onClick={() => handleNavigateProfile(user._id)} className="font-bold text-[13px] text-gray-900 truncate cursor-pointer hover:underline">{user.username}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => handleAcceptFriend(reqId)} className="w-8 h-8 rounded-full bg-[#f44336] text-white flex items-center justify-center hover:bg-[#e22d41] transition-colors"><Check size={16}/></button>
                                  <button onClick={() => handleDeclineFriend(reqId)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={16}/></button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}

                      <div className="px-2 pt-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">{t.friendSuggestions}</p>
                        {recommendedUsers.length === 0 ? (
                          <p className="text-[12px] text-gray-400 text-center py-4">{t.noMoreSuggestions}</p>
                        ) : (
                          recommendedUsers.map(user => {
                            const strUserId = String(user._id);
                            return (
                              <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <div onClick={() => handleNavigateProfile(user._id)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 cursor-pointer overflow-hidden">
                                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p onClick={() => handleNavigateProfile(user._id)} className="font-bold text-[13px] text-gray-900 truncate cursor-pointer hover:underline">{user.username}</p>
                                  <p className="text-[11px] text-gray-400 truncate">{t.mutualHint}</p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                  {sentRequests.includes(strUserId) ? (
                                    <button onClick={() => handleUndoRequest(user._id)} className="text-[11px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200"><Clock size={12}/> {t.undo}</button>
                                  ) : (
                                    <button 
                                      onClick={() => handleAddFriend(user._id)}
                                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-[#f44336] rounded-full hover:bg-red-100 transition-colors shrink-0"
                                      title={t.addFriend}
                                    >
                                      <UserPlus size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            type="button"
            onClick={() => {
              toggleTheme();
              setIsAvatarMenuOpen(false);
            }}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}
            title={t.themeToggle}
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          <div className="relative shrink-0" ref={avatarMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsAvatarMenuOpen((v) => !v);
                setIsFriendDropdownOpen(false);
              }}
              className={`inline-flex h-10 items-center gap-0.5 rounded-full border overflow-hidden pl-0.5 pr-1 transition-opacity hover:opacity-95 ${
                isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}
              aria-expanded={isAvatarMenuOpen}
              aria-haspopup="true"
              title={menuT.myProfile}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                <img
                  src={getAvatarUrl(localStorage.getItem('avatar'), localStorage.getItem('username'))}
                  className="h-full w-full object-cover object-center"
                  alt=""
                />
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isAvatarMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isAvatarMenuOpen && (
              <div
                className={`absolute right-0 top-12 z-[140] w-[min(calc(100vw-1.5rem),18rem)] rounded-2xl border py-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className={`px-4 pb-2 mb-1 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <p className={`text-[13px] font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {localStorage.getItem('displayName') || localStorage.getItem('username') || ''}
                  </p>
                  <p className={`text-[11px] font-medium truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    @{String(localStorage.getItem('username') || '')
                      .toLowerCase()
                      .replace(/\s+/g, '_')}
                  </p>
                </div>

                <p
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {menuT.sectionAccount}
                </p>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/profile')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <User size={18} className="shrink-0 opacity-80" />
                  {menuT.myProfile}
                </button>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/settings')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={18} className="shrink-0 opacity-80" />
                  {menuT.settings}
                </button>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/friends')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Users size={18} className="shrink-0 opacity-80" />
                  {menuT.friends}
                </button>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/saved')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark size={18} className="shrink-0 opacity-80" />
                  {menuT.saved}
                </button>

                <div className={`my-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`} />

                <p
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {menuT.sectionMore}
                </p>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/dashboard')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Home size={18} className="shrink-0 opacity-80" />
                  {menuT.feed}
                </button>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/explore')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Compass size={18} className="shrink-0 opacity-80" />
                  {menuT.explore}
                </button>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/community')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Globe2 size={18} className="shrink-0 opacity-80" />
                  {menuT.community}
                </button>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/trending')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp size={18} className="shrink-0 opacity-80" />
                  {menuT.trending}
                </button>
                <button
                  type="button"
                  onClick={() => handleAvatarMenuNavigate('/upload')}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Upload size={18} className="shrink-0 opacity-80" />
                  {menuT.newPost}
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleAvatarMenuNavigate('/admin')}
                    className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                      isDarkMode ? 'text-amber-200 hover:bg-gray-800' : 'text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <ShieldAlert size={18} className="shrink-0 opacity-90" />
                    {menuT.adminPanel}
                  </button>
                )}

                <div className={`my-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`} />

                <button
                  type="button"
                  onClick={handleAvatarLogout}
                  className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    isDarkMode ? 'text-red-400 hover:bg-gray-800' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut size={18} className="shrink-0 opacity-90" />
                  {menuT.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chat & Notification: GlobalChatNotification in App.jsx */}
      <main className="max-w-[1200px] mx-auto pt-8 px-6 flex gap-8 items-start">
        
        <div className="flex-1 max-w-[720px]">
          <div className={`${isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-5 shadow-sm border mb-8 transition-colors duration-300`}>
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <p className={`text-[13px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.createPostTitle}</p>
                <p className={`text-[11px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.createPostSubtitle}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-[#f44336]">
                Travel Feed
              </span>
            </div>
            <div className="flex gap-3 mb-3">
              <div onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80">
                <img src={getAvatarUrl(currentUser.avatar, currentUser.username)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <textarea 
                placeholder={currentUser.role === 'admin' ? t.adminPlaceholder : t.postPlaceholder}
                className={`w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#f4f4f5] text-gray-900'} rounded-xl p-3.5 text-[14px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all`}
                rows="3"
                value={newPost.description}
                onChange={e => setNewPost({...newPost, description: e.target.value})}
              ></textarea>
            </div>

            {previewUrls.length > 0 ? (
              <div className="flex flex-wrap gap-3 mb-3 pl-12">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-gray-900/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                  </div>
                ))}
              </div>
            ) : null}
            
            {showMapPicker ? (
              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in fade-in duration-300 ml-12">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[12px] font-bold text-gray-500"><MapPin size={14} className="inline mr-1" />{t.mapPickerHelp}</p>
                  {pickedCoords ? <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">[{pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)}]</span> : null}
                </div>
                <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-inner">
                  <RealMapPicker setPickedCoords={setPickedCoords} />
                </div>
              </div>
            ) : null}

            <div className={`flex items-center justify-between border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-50'} pt-4 mt-2`}>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMapPicker(!showMapPicker)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors select-none ${pickedCoords || showMapPicker ? 'bg-red-50 text-[#f44336]' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <MapPin size={16} strokeWidth={2.5} /> {pickedCoords ? t.pinned : t.pinLocation}
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors select-none cursor-pointer">
                  <ImageIcon size={16} strokeWidth={2.5} /> {t.uploadImage}
                </button>
              </div>
              <button type="button" onClick={handleQuickPost} disabled={isPosting} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all shadow-md ${currentUser.role === 'admin' ? 'bg-gray-900 hover:bg-black' : 'bg-[#f44336] shadow-red-500/20 hover:bg-[#e53935]'} disabled:opacity-50`}>
                {isPosting ? <span>{t.posting}</span> : <span className="flex items-center gap-1.5"><Send size={16} /> {t.submitPost}</span>}
              </button>
            </div>
          </div>

          {/* TRENDING CAROUSEL */}
          {trendingPosts.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-black text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#f44336]" /> {t.trending}
                </h2>
                <button onClick={() => navigate('/trending')} className="text-[13px] font-bold text-[#f44336] hover:underline">
                  {t.viewAll}
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {trendingPosts.slice(0, 5).map((post, index) => (
                  <div 
                    key={post._id}
                    onClick={() => navigate(`/post-detail?postId=${post._id}`)}
                    className="min-w-[220px] max-w-[220px] h-[280px] rounded-2xl flex-shrink-0 relative overflow-hidden group cursor-pointer snap-start border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    {post.images && post.images.length > 0 ? (
                      <img src={post.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Trending" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">{t.noImage}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm flex items-center gap-1">
                      <span className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-700'}>TOP {index + 1}</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-[10px] font-bold text-white/90 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 uppercase tracking-wider mb-2 inline-block">
                        {post.category || t.discover}
                      </span>
                      <h3 className="text-[14px] font-black text-white leading-tight mb-2 line-clamp-2 drop-shadow-md group-hover:text-red-100 transition-colors">
                        {post.title || post.location || t.unknown}
                      </h3>
                      <div className="flex items-center gap-2 mt-auto">
                        <img src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.username)} className="w-5 h-5 rounded-full border border-white/50" alt="Avatar"/>
                        <span className="text-[11px] font-bold text-white/90 truncate">{post.createdBy?.username || t.anonymous}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6 pb-12">
            {Array.isArray(posts) ? posts.map((post) => {
              const isAdmin = post.createdBy?.role === 'admin';
              const isOwner = Boolean(currentUser.userId) && String(post.createdBy?._id || '') === String(currentUser.userId);
              
              return (
                <div key={post._id || Math.random().toString()} className={`${isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'} rounded-2xl overflow-hidden shadow-sm border ${isAdmin ? 'border-red-200' : ''} transition-colors duration-300`}>
                  {isAdmin ? (
                    <div className="bg-red-50 px-5 py-2.5 flex items-center gap-2 border-b border-red-100">
                      <ShieldAlert size={16} className="text-[#f44336]" />
                      <span className="text-[11px] font-black text-[#f44336] uppercase tracking-widest">{t.adminNotice}</span>
                    </div>
                  ) : null}

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer hover:ring-2 hover:ring-red-200 transition-all ${isAdmin ? 'border-[#f44336]' : 'border-transparent'}`}
                          onClick={() => handleNavigateProfile(post.createdBy?._id)}
                        >
                          <img src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.username)} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 
                            className={`text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-1.5 cursor-pointer hover:underline`}
                            onClick={() => handleNavigateProfile(post.createdBy?._id)}
                          >
                            {post.createdBy?.username} 
                            {isAdmin ? <CheckCircle size={14} className="text-[#f44336]" /> : null}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] font-medium text-gray-400">
                              {post.createdAt ? new Date(post.createdAt).toLocaleDateString(dateLocale) : ''}
                            </p>
                            {post.category ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-[#f44336] border border-red-100">
                                {post.category}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenPostMenuId((prev) => (prev === post._id ? null : post._id))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        {openPostMenuId === post._id ? (
                          <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleCopyPostLink(post._id)}
                              className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              {t.copyPostLink}
                            </button>
                            {(isOwner || currentUser.role === 'admin') ? (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                {t.deletePost}
                              </button>
                            ) : null}
                            {currentUser.role === 'admin' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                              >
                                {post.isHidden ? t.showPost : t.hidePost}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {(() => {
                      const desc = post.description;
                      if (desc && String(desc).trim() !== "0" && String(desc).trim() !== "" && String(desc) !== "\u200B") {
                        return (
                          <p className={`text-[14px] ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} font-medium leading-relaxed mb-4 whitespace-pre-wrap`}>
                            {String(desc)}
                          </p>
                        );
                      }
                      return null;
                    })()}

                    {post.lat && post.lng ? (
                      <div className="mb-4">
                        <button type="button" onClick={() => setExpandedMap(prev => ({ ...prev, [post._id]: !prev[post._id] }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 text-[#f44336] border-transparent hover:bg-red-100'}`}>
                          <MapPin size={16} /> 
                          {typeof post.location === 'string' && post.location !== t.unknownLocation ? post.location : t.pinnedLocation}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ml-2 transition-colors ${expandedMap[post._id] ? 'bg-black/20 text-white' : 'bg-white text-[#f44336] shadow-sm'}`}>
                            {expandedMap[post._id] ? t.closeMap : t.viewMap}
                          </span>
                        </button>
                        {expandedMap[post._id] ? (
                          <div className="mt-3 h-[250px] w-full border border-gray-200 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
                            <RealMapViewer lat={post.lat} lng={post.lng} role={post.createdBy?.role} location={post.location} />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {Array.isArray(post.images) && post.images.length > 0 ? (() => {
                      const normalizedImages = post.images.map((img) => getPostImageUrl(img)).filter(Boolean);
                      if (normalizedImages.length === 0) return null;
                      return (
                        <div className="mb-4 space-y-2">
                          <img
                            src={normalizedImages[0]}
                            alt="media-main"
                            className={`w-full rounded-2xl object-cover border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} max-h-[420px]`}
                          />
                          {normalizedImages.length > 1 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {normalizedImages.slice(1).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`media-${idx + 1}`}
                                  className={`w-full h-[150px] rounded-xl object-cover border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })() : null}

                    <div className={`flex items-center gap-6 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                      {(() => {
                        const likedByCurrentUser = Array.isArray(post.likes) && post.likes.some((userId) => userId?.toString() === currentUser.userId);
                        return (
                          <button
                            type="button"
                            onClick={() => handleLikePost(post._id)}
                            disabled={likingPosts[post._id]}
                            className={`flex items-center gap-1.5 ${likedByCurrentUser ? 'text-[#f44336]' : 'text-gray-500 hover:text-[#f44336]'} transition-colors text-[13px] font-bold disabled:opacity-50`}
                          >
                            <Heart size={20} strokeWidth={2.5} fill={likedByCurrentUser ? '#f44336' : 'none'} /> {Array.isArray(post.likes) ? post.likes.length : 0}
                          </button>
                        );
                      })()}
                      <button type="button" onClick={() => toggleComments(post._id)} className="flex items-center gap-1.5 text-gray-500 hover:text-[#f44336] transition-colors text-[13px] font-bold">
                        <MessageSquare size={20} strokeWidth={2.5} /> {post.totalReviews || t.comments}
                      </button>
                      <SavePostButton postId={post._id} initialIsSaved={savedPostsSet.has(String(post._id))} onToggleSave={handleToggleSavedPost} />
                      <button type="button" onClick={() => handleCopyPostLink(post._id)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold ml-auto">
                        <Share2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>

                    {expandedComments[post._id] ? (
                      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} animate-in fade-in duration-300`}>
                        <div className="flex gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(currentUser.userId)}>
                            <img src={getAvatarUrl(currentUser.avatar, currentUser.username)} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 relative">
                            <input 
                              type="text" 
                              placeholder={t.writeComment}
                              className={`w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#f4f4f5] text-gray-900'} rounded-full py-2 pl-4 pr-10 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all`}
                              value={commentInputs[post._id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({...prev, [post._id]: e.target.value}))}
                              onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id)}
                            />
                            <button onClick={() => handlePostComment(post._id)} disabled={isSubmittingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50">
                              <Send size={16} />
                            </button>
                          </div>
                        </div>

                        {isFetchingComments[post._id] ? (
                          <div className="flex justify-center py-4"><Loader2 size={24} className="animate-spin text-[#f44336]" /></div>
                        ) : (
                          <div className="space-y-5">
                            {Array.isArray(commentsData[post._id]) && commentsData[post._id].map(comment => {
                              const isCommentAuthor = comment.author?._id?.toString() === currentUser.userId;
                              return (
                                <div key={comment._id || Math.random().toString()} className="text-[13px]">
                                  <div className="flex gap-3 group">
                                    <img src={getAvatarUrl(comment.author?.avatar, comment.author?.username)} alt="avt" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(comment.author?._id)} />
                                    <div className="flex-1">
                                      {editingCommentId === comment._id ? (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
                                          <textarea
                                            value={editingCommentContent}
                                            onChange={(e) => setEditingCommentContent(e.target.value)}
                                            className="w-full min-h-[70px] resize-none p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f44336]/40 outline-none text-[13px]"
                                            rows={3}
                                          />
                                          <div className="mt-2 flex justify-between items-center">
                                            <button onClick={cancelEditComment} className="text-gray-600 hover:text-gray-900 text-[12px] font-semibold">{t.cancel}</button>
                                            <button onClick={() => saveEditComment(post._id, comment._id)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">{t.save}</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-[#f4f4f5] px-4 py-2.5 rounded-2xl rounded-tl-none inline-block">
                                          <p onClick={() => handleNavigateProfile(comment.author?._id)} className="font-bold text-gray-900 mb-0.5 text-[12px] cursor-pointer hover:underline">{comment.author?.username}</p>
                                          <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                        <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString(dateLocale) : ''}</span>
                                        <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: null })}>{t.reply}</button>
                                        {isCommentAuthor ? (
                                          <>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(comment._id, comment.content)}>{t.edit}</button>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, comment._id)}>{t.delete}</button>
                                          </>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>

                                  {(Array.isArray(comment.replies) && comment.replies.length > 0) ? (
                                    <div className="mt-3 ml-[44px] space-y-4 border-l-2 border-gray-100 pl-4 relative">
                                      {comment.replies.map((reply) => (
                                        <div key={reply._id || Math.random().toString()} className="flex gap-2">
                                          <img src={getAvatarUrl(reply.author?.avatar, reply.author?.username)} alt="avt" className="w-6 h-6 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(reply.author?._id)} />
                                          <div className="flex-1">
                                            <div className="bg-white border border-gray-100 shadow-sm px-3 py-2 rounded-2xl rounded-tl-none inline-block">
                                              <p onClick={() => handleNavigateProfile(reply.author?._id)} className="font-bold text-gray-900 mb-0.5 text-[12px] cursor-pointer hover:underline">{reply.author?.username}</p>
                                              {editingCommentId === reply._id ? (
                                                <div>
                                                  <textarea
                                                    value={editingCommentContent}
                                                    onChange={(e) => setEditingCommentContent(e.target.value)}
                                                    className="w-full min-h-[70px] resize-none p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f44336]/40 outline-none text-[13px]"
                                                    rows={3}
                                                  />
                                                  <div className="mt-2 flex justify-between items-center">
                                                    <button onClick={cancelEditComment} className="text-gray-600 hover:text-gray-900 text-[12px] font-semibold">{t.cancel}</button>
                                                    <button onClick={() => saveEditComment(post._id, reply._id)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">{t.save}</button>
                                                  </div>
                                                </div>
                                              ) : typeof reply.content === 'string' && reply.content.startsWith('@') ? (
                                                <p className="text-gray-800 whitespace-pre-wrap">
                                                  <span className="text-[#00897b] font-bold mr-1">{reply.content.split(' ')[0]}</span>
                                                  <span>{reply.content.substring(reply.content.indexOf(' ') + 1)}</span>
                                                </p>
                                              ) : (
                                                <p className="text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                              <span>{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString(dateLocale) : ''}</span>
                                              <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: reply.author?.username })}>{t.reply}</button>
                                              {reply.author?._id?.toString() === currentUser.userId ? (
                                                <>
                                                  <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(reply._id, reply.content)}>{t.edit}</button>
                                                  <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, reply._id)}>{t.delete}</button>
                                                </>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}

                                  {replyingTo.parentId === comment._id ? (
                                    <div className="mt-3 ml-[44px] flex gap-2 animate-in slide-in-from-top-1 fade-in">
                                      <CornerDownRight size={16} className="text-gray-300 mt-2 flex-shrink-0" />
                                      <div className="flex-1 relative">
                                        <input 
                                          type="text" autoFocus placeholder={replyingTo.childUsername ? t.replyingTo(replyingTo.childUsername) : t.replyTo(comment.author?.username)}
                                          className="w-full bg-white border border-[#f44336]/30 shadow-sm rounded-full py-2 pl-4 pr-10 text-[12px] font-medium focus:outline-none focus:border-[#f44336] transition-all"
                                          value={replyInputs[comment._id] || ''}
                                          onChange={(e) => setReplyInputs(prev => ({...prev, [comment._id]: e.target.value}))}
                                          onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id, comment._id)}
                                        />
                                        <button type="button" onClick={() => handlePostComment(post._id, comment._id)} disabled={isSubmittingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50">
                                          <Send size={14} />
                                        </button>
                                      </div>
                                      <button type="button" onClick={() => setReplyingTo({ parentId: null, childUsername: null })} className="text-gray-400 hover:text-gray-900 mt-2"><X size={16}/></button>
                                    </div>
                                  ) : null}
                                </div>
                              )})}
                              {(!commentsData[post._id] || commentsData[post._id].length === 0) ? (
                                <div className="text-center py-6 text-gray-400 text-[13px] font-bold">{t.noComments}</div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              }) : null}
          </div>
        </div>

        {}
        <aside className="w-[320px] hidden lg:block flex-shrink-0 space-y-6 sticky top-[104px]">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4"><MapPin size={14} className="inline mr-1 text-[#f44336]" />{t.hotPlaces}</h3>
            <div className="space-y-4">
              {trendingPosts.length === 0 ? (
                <p className="text-[12px] font-medium text-gray-400 text-center py-2">{t.noData}</p>
              ) : (
                trendingPosts.map((trendingPost) => (
                  <div key={trendingPost._id}>
                    <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-wider mb-0.5">
                      {trendingPost.category || t.discover}
                    </p>
                    <p 
                      onClick={() => {
                        navigate(`/post-detail?postId=${trendingPost._id}`);
                      }} 
                      className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline"
                    >
                      {trendingPost.title || trendingPost.location || t.unknownPlace}
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                      <Heart size={12} className="text-[#f44336]" fill="#f44336" /> {trendingPost.likeCount || 0} {t.likes}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4">{t.quickSuggestions}</h3>
            <div className="space-y-2">
              <button type="button" onClick={() => { setIsAiChatOpen(true); setAiChatInput(t.quickTripPrompt); }} className="w-full text-left text-[12px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2">
                {t.quickTrip}
              </button>
              <button type="button" onClick={() => { setIsAiChatOpen(true); setAiChatInput(t.quickFoodPrompt); }} className="w-full text-left text-[12px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2">
                {t.quickFood}
              </button>
              <button type="button" onClick={() => { setIsAiChatOpen(true); setAiChatInput(t.quickCheckinPrompt); }} className="w-full text-left text-[12px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2">
                {t.quickCheckin}
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#ef4444] to-[#f97316] p-5 rounded-2xl shadow-sm text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">Travel Tip</p>
            <p className="text-[13px] font-bold leading-relaxed">
              {t.travelTip}
            </p>
          </div>
        </aside>

      </main>

      {}
      <button
        type="button"
        onClick={() => setIsAiChatOpen((prev) => !prev)}
        className="fixed right-6 bottom-6 z-[101] bg-[#f44336] text-white w-14 h-14 rounded-full shadow-xl shadow-red-500/30 hover:bg-[#e53935] flex items-center justify-center"
      >
        <Bot size={24} />
      </button>

      {isAiChatOpen ? (
        <div className="fixed right-6 bottom-24 z-[101] w-[340px] bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-black text-gray-900">{t.aiTitle}</h3>
            <button type="button" onClick={() => setIsAiChatOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
          <div className="h-[320px] overflow-y-auto px-3 py-3 space-y-3 bg-[#fafafa]">
            {aiChatMessages.map((msg, index) => (
              <div key={index} className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] font-medium whitespace-pre-wrap ${msg.role === 'user' ? 'ml-auto bg-[#f44336] text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'}`}>
                {msg.content}
              </div>
            ))}
            {isAiChatLoading ? (
              <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-md px-3 py-2 text-[13px] font-medium inline-block">
                {t.aiThinking}
              </div>
            ) : null}
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiChat()}
              placeholder={t.aiPlaceholder}
              className="flex-1 bg-[#f4f4f5] rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
            />
            <button
              type="button"
              onClick={handleSendAiChat}
              disabled={isAiChatLoading || !aiChatInput.trim()}
              className="px-4 py-2 rounded-xl bg-[#f44336] text-white text-[13px] font-bold hover:bg-[#e53935] disabled:opacity-50"
            >
              {t.send}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardContent;
