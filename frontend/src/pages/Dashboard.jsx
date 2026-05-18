import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useInRouterContext, MemoryRouter } from 'react-router-dom';
import { 
  MessageSquare, Compass, Settings, 
  MapPin, Image as ImageIcon, Send, ShieldAlert,
  Heart, Share2, MoreHorizontal, CheckCircle, X, Info, CornerDownRight, Loader2, Bot,
  ArrowLeft, User, Bookmark, Users, UserPlus, Check, Search, Clock, Bell,
  UserCircle, Home, TrendingUp, LogOut, Shield, Copy
} from 'lucide-react';
import { io } from 'socket.io-client';
import NotificationBell from '../components/NotificationBell';
import AccountMenu from '../components/AccountMenu';
import { useLanguage } from '../contexts/LanguageContext';
import SavePostButton from '../components/SavePostButton';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
};

const getPostImageUrl = (img) => {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object') return img.url || img.path || '';
  return '';
};

const getAvatarUrl = (url, name) => {
  const finalUrl = getImageUrl(url);
  return finalUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

/* Language Dictionary... */
const copy = {
  vi: {
    home: 'Trang chủ',
    explore: 'Khám phá',
    community: 'Cộng đồng',
    createPost: 'Tạo bài viết mới',
    createPostHint: 'Chia sẻ ảnh, ghim bản đồ, kể lại trải nghiệm của bạn.',
    travelFeed: 'Bảng tin du lịch',
    sharePlaceholder: 'Chia sẻ địa điểm bạn vừa khám phá...',
    systemPlaceholder: 'Phát thông báo hệ thống...',
    mapPickerHint: 'Nhấn vào bản đồ để lấy tọa độ chính xác',
    pinnedLocation: 'Đã ghim vị trí',
    pinLocation: 'Ghim vị trí',
    uploadImage: 'Tải ảnh lên',
    posting: 'Đang tải...',
    submitPost: 'Đăng bài',
    hotPlaces: 'Địa điểm đang hot',
    beach: 'Biển',
    culture: 'Văn hóa',
    quickSuggestions: 'Gợi ý nhanh',
    quickTrip: 'Lịch trình Đà Nẵng 2N1Đ',
    quickFood: 'Ăn gì ở Huế?',
    quickCheckin: 'Check-in Hội An buổi tối',
    travelTip: 'Mẹo du lịch',
    chatTitle: 'AI tư vấn địa điểm',
    baySao: 'Bãi Sao, Phú Quốc',
    savedBaySao: 'Đã lưu vào danh sách xem sau: Bãi Sao',
    phoCo: 'Phố cổ Hội An',
    savedPhoCo: 'Đã thêm Phố cổ Hội An vào Gợi ý',
    chatTrip: 'Gợi ý lịch trình Đà Nẵng 2 ngày 1 đêm',
    chatFood: 'Gợi ý món ăn ngon ở Huế',
    chatCheckin: 'Điểm check-in đẹp ở Hội An buổi tối',
    noComment: 'Chưa có bình luận nào. Hãy là người đầu tiên!',
    loadingMap: 'Đang tải bản đồ...',
    pinnedSpot: 'Vị trí được ghim',
    viewMap: '📍 Xem Map',
    closeMap: 'Đóng Bản đồ',
    postSuccess: 'Đăng bài viết thành công!',
    adminNotice: 'Thông báo từ Ban Quản Trị',
    copyLink: 'Copy link bài viết',
    deletePost: 'Xóa bài viết',
    hidePost: 'Ẩn bài viết',
    showPost: 'Hiện bài viết',
    confirmDeleteComment: 'Xác nhận xóa bình luận',
    deleteCommentText: 'Bạn có chắc chắn xóa bình luận này? Hành động này không thể hoàn tác.',
    cancel: 'Hủy',
    delete: 'Xóa',
    commentPlaceholder: 'Viết bình luận...',
    reply: 'Phản hồi',
    edit: 'Sửa',
    save: 'Lưu',
    like: 'Thích',
    comment: 'Bình luận',
    loginRequired: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng bài.',
    notLoggedIn: 'Vui lòng đăng nhập để thả tim bài viết.',
    cannotLike: 'Không thể thả tim bài viết',
    noContent: 'Vui lòng nhập nội dung, ảnh hoặc ghim vị trí!',
    emptyComment: 'Nội dung bình luận không được để trống.',
    loginRequiredComment: 'Vui lòng đăng nhập để sửa bình luận.',
    cannotUpdateComment: 'Không thể cập nhật bình luận',
    updateSuccess: 'Đã cập nhật bình luận',
    invalidFile: 'Tệp không hợp lệ!',
    fileTooLarge: 'Ảnh quá 5MB!',
    maxImages: 'Chỉ tối đa 5 ảnh!',
    errorComment: 'Lỗi gửi bình luận',
    publishingSystemNotice: 'THÔNG BÁO TỪ HỆ THỐNG',
    unpublished: 'Hệ thống giả lập',
    systemSimulation: 'Do chưa kết nối được Backend, đây là bài viết mô phỏng.',
    locationUndetermined: 'Chưa xác định',
    likeSuccess: 'Không thể thả tim bài viết',
    leafletError: 'Leaflet load timeout',
    networkError: 'Lỗi mạng!',
    serverError: 'Lỗi server khi đăng bài',
    systemError: 'Lỗi hệ thống',
    notFound: 'Không tìm thấy profile hiện tại',
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    community: 'Community',
    createPost: 'Create new post',
    createPostHint: 'Share photos, pin the map, and tell your travel story.',
    travelFeed: 'Travel Feed',
    sharePlaceholder: 'Share the place you just discovered...',
    systemPlaceholder: 'Post a system announcement...',
    mapPickerHint: 'Click on the map to get exact coordinates',
    pinnedLocation: 'Location pinned',
    pinLocation: 'Pin location',
    uploadImage: 'Upload image',
    posting: 'Posting...',
    submitPost: 'Post',
    hotPlaces: 'Hot destinations',
    beach: 'Beach',
    culture: 'Culture',
    quickSuggestions: 'Quick suggestions',
    quickTrip: 'Da Nang 2D1N itinerary',
    quickFood: 'What to eat in Hue?',
    quickCheckin: 'Hoi An night check-in spots',
    travelTip: 'Travel Tip',
    chatTitle: 'AI destination assistant',
    baySao: 'Bai Sao Beach, Phu Quoc',
    savedBaySao: 'Saved to watchlist: Bai Sao',
    phoCo: 'Hoi An Old Town',
    savedPhoCo: 'Added Hoi An Old Town to suggestions',
    chatTrip: 'Suggest Da Nang 2-day 1-night itinerary',
    chatFood: 'What are good food options in Theme?',
    chatCheckin: 'Beautiful check-in spots in Hoi An at night',
    noComment: 'No comments yet. Be the first!',
    loadingMap: 'Loading map...',
    pinnedSpot: 'Pinned location',
    viewMap: '📍 View Map',
    closeMap: 'Close Map',
    postSuccess: 'Post published successfully!',
    adminNotice: 'Admin Notice',
    copyLink: 'Copy post link',
    deletePost: 'Delete post',
    hidePost: 'Hide post',
    showPost: 'Show post',
    confirmDeleteComment: 'Confirm delete comment',
    deleteCommentText: 'Are you sure you want to delete this comment? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    commentPlaceholder: 'Write a comment...',
    reply: 'Reply',
    edit: 'Edit',
    save: 'Save',
    like: 'Like',
    comment: 'Comment',
    loginRequired: 'Please sign in to post.',
    notLoggedIn: 'Please sign in to like this post.',
    cannotLike: 'Cannot like post',
    noContent: 'Please add content, image or pin location!',
    emptyComment: 'Comment cannot be empty.',
    loginRequiredComment: 'Please sign in to edit comment.',
    cannotUpdateComment: 'Cannot update comment',
    updateSuccess: 'Comment updated',
    invalidFile: 'Invalid file!',
    fileTooLarge: 'Image exceeds 5MB!',
    maxImages: 'Maximum 5 images!',
    errorComment: 'Error sending comment',
    publishingSystemNotice: 'SYSTEM NOTICE',
    unpublished: 'System simulation',
    systemSimulation: 'Backend not connected. This is a simulated post.',
    locationUndetermined: 'Location undetermined',
    likeSuccess: 'Cannot like post',
    leafletError: 'Leaflet load timeout',
    networkError: 'Network error!',
    serverError: 'Server error posting',
    systemError: 'System error',
    notFound: 'Could not load current profile',
  },
};

/* Leaflet và Bản đồ... */
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

      if (document.getElementById('leaflet-js')) {
        const waitReady = setInterval(() => {
          if (window.L) {
            clearInterval(waitReady);
            resolve();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(waitReady);
          if (!window.L) reject(new Error('Leaflet load timeout'));
        }, 7000);
        return;
      }

      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được Leaflet'));
      document.head.appendChild(script);
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
        <div className="absolute inset-0 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center text-[12px] font-bold text-gray-500 dark:text-slate-400">
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
        const popupText = typeof location === 'string' && location !== 'Chưa xác định' ? location : 'Vị trí được ghim';
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
        <div className="absolute inset-0 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center text-[12px] font-bold text-gray-500 dark:text-slate-400">
          Đang tải bản đồ...
        </div>
      )}
    </div>
  );
}

/* Khai báo State và Logic chính... */
function DashboardContent() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;

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

  const [shareModal, setShareModal] = useState({ open: false, postData: null, description: '' });
  const [isSharing, setIsSharing] = useState(false);

  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([
    { role: 'ai', content: 'Xin chào! Mình là trợ lý du lịch 🤖 Bạn muốn đi đâu cuối tuần này?' }
  ]);

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

  // STATE LƯU SOCKET CONNECTION CHO REALTIME
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);
  const friendDropdownRef = useRef(null);
  const userChatModalRef = useRef(null);

  // --- QUY TRÌNH ÁP DỤNG THEME TOÀN CỤC ---
  const applyThemeToDOM = (selectedTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');

    if (selectedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else if (selectedTheme === 'light') {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    applyThemeToDOM(savedTheme);

    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        applyThemeToDOM(e.detail.theme);
      }
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // XỬ LÝ CHỐNG ĐÈ CHÉO COMPONENT
  useEffect(() => {
    const handleCloseAll = () => {
      setIsFriendDropdownOpen(false);
      setIsUserChatOpen(false);
      setIsAiChatOpen(false);
      setOpenPostMenuId(null);
    };

    const handleClickOutside = (e) => {
      if (e.target.closest('.global-toggle-btn')) return;

      if (friendDropdownRef.current && !friendDropdownRef.current.contains(e.target)) {
        setIsFriendDropdownOpen(false);
      }
      if (userChatModalRef.current && !userChatModalRef.current.contains(e.target)) {
        setIsUserChatOpen(false);
      }
      
      // Đóng menu bài viết khi click ra ngoài
      if (!e.target.closest('.post-menu-container')) {
        setOpenPostMenuId(null);
      }
    };

    window.addEventListener('closeAllMenus', handleCloseAll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('closeAllMenus', handleCloseAll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // LOGIC SOCKET.IO CHO REALTIME CHAT
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join", userId); 
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (incomingMsg) => {
      const currentUserId = localStorage.getItem('userId');
      if (String(incomingMsg.sender._id) === currentUserId) return;

      const isGroupMsg = !!incomingMsg.groupId;
      const key = String(isGroupMsg ? incomingMsg.groupId : incomingMsg.sender._id);

      const formattedMsg = {
        sender: 'them',
        senderName: incomingMsg.sender.username,
        senderAvatar: incomingMsg.sender.avatar,
        text: incomingMsg.text
      };

      setUserMessages(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), formattedMsg]
      }));

      fetchConversations();
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, conversationsList]); // Đã thêm conversationsList vào dependency

  useEffect(() => {
    if (socket && conversationsList.length > 0) {
      conversationsList.forEach(conv => {
        if (conv.isGroup) {
          socket.emit("join_group", conv._id);
        }
      });
    }
  }, [socket, conversationsList]);

  const getUserById = (id) => allUsers.find(u => String(u._id) === String(id)) || { username: 'Người dùng', _id: id };

  const handleNavigateProfile = (userId) => {
    if(userId) {
      navigate('/profile', { state: { targetUserId: userId } });
    }
  };

  /* CÁC API CALLS CƠ BẢN... */
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
    } catch (error) {}
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
    } catch (error) {}
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
          setSavedPostsSet(new Set(data.map(p => p._id)));
        }
      }
    } catch (error) {}
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
          if(convRes.status === 403) showToast('error', 'Chỉ bạn bè mới có thể nhắn tin.');
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
        const formattedMessages = messages.map(msg => {
          const senderId = msg.sender?._id || msg.sender;
          return {
            sender: String(senderId) === String(currentUserId) ? 'me' : 'them',
            senderName: msg.sender?.username,
            senderAvatar: msg.sender?.avatar,
            text: msg.text 
          };
        });
        
        setUserMessages(prev => ({
          ...prev,
          [groupId || targetUserId]: formattedMessages
        }));
      }
    } catch (error) {
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
    } catch (error) {}
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

  /* UseEffects khởi động */
  useEffect(() => {
    const loadCurrentUser = async () => {
      const userRole = localStorage.getItem('role') || 'user';
      const userId = localStorage.getItem('userId') || ''; 
      let username = localStorage.getItem('displayName') || localStorage.getItem('username') || 'Khách Xem Trước';
      let avatar = localStorage.getItem('avatar') || '';
      
      const token = localStorage.getItem('token');
      if (userId && token) {
        try {
          const res = await fetch(`http://localhost:5000/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const user = data.user || data;
            username = user.displayName || user.username || username;
            avatar = user.avatar || avatar;
            
            localStorage.setItem('displayName', username);
            if (avatar) localStorage.setItem('avatar', avatar);
          }
        } catch (error) {}
      }
      setCurrentUser({ userId, username, role: String(userRole).toLowerCase(), avatar });
    };

    loadCurrentUser();
    loadLeafletAssets().catch(() => {});
    fetchPosts();
    fetchTrendingPosts();
    fetchSavedPosts();

    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchAllUsers();
      fetchFriendData();
      fetchConversations();
    }

    const handleOpenChat = (e) => {
      window.dispatchEvent(new Event('closeAllMenus'));
      setIsUserChatOpen(true);
      if (e.detail && e.detail.userId) {
        const user = getUserById(e.detail.userId);
        setSelectedChatUser(user);
        setChatView('conversation');
      } else {
        setChatView('list');
      }
    };
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, [navigate]);

  useEffect(() => {
    if (isUserChatOpen && chatView === 'conversation') {
      if (selectedGroup) {
        fetchChatHistory(null, selectedGroup._id);
      } else if (selectedChatUser) {
        fetchChatHistory(selectedChatUser._id, null);
      }
    }
  }, [isUserChatOpen, chatView, selectedChatUser, selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userMessages, chatView]);

  const showToast = (type, text) => {
    setNotification({ type, text: String(text) });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  /* BẠN BÈ VÀ BÌNH LUẬN... */
  const handleAddFriend = async (userId) => {
    const strUserId = String(userId);
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập để kết bạn.');

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
        showToast('error', data.message || 'Không thể gửi lời mời');
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
        showToast('success', 'Đã thu hồi lời mời');
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
        showToast('success', 'Đã trở thành bạn bè');
        setReceivedRequests(prev => prev.filter(id => id !== strUserId));
        setFriends(prev => [...prev, strUserId]);
        fetchFriendData(); 
      }
    } catch (error) {}
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
    } catch (error) {}
  };

  const toggleComments = async (postId, e) => {
    if (e) e.stopPropagation(); 
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
      if (!res.ok) throw new Error('Không thể tải bình luận');
      const data = await res.json();
      const newComments = Array.isArray(data.comments) ? data.comments : [];
      setCommentsData(prev => ({ ...prev, [postId]: newComments }));
      setPosts(prev => prev.map((post) => post._id === postId ? { ...post, totalReviews: newComments.length } : post));
    } catch (error) {}
  };

  const handlePostComment = async (postId, parentId = null, e) => {
    if (e) e.stopPropagation();
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, parentComment: parentId || null })
      });
      if (res.ok) {
        if (parentId) { setReplyInputs(prev => ({ ...prev, [parentId]: '' })); setReplyingTo({ parentId: null, childUsername: null }); } 
        else { setCommentInputs(prev => ({ ...prev, [postId]: '' })); }
        await refreshComments(postId);
      } else throw new Error('Lỗi gửi bình luận');
    } catch (error) {
      showToast('error', error.message || 'Lỗi mạng!');
    } finally { setIsSubmittingComment(false); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập để xóa bình luận.');

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể xóa bình luận');
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
  
  const showDeleteConfirm = (postId, commentId, e) => { if (e) e.stopPropagation(); setDeleteConfirm({ open: true, postId, commentId }); };
  const cancelDelete = (e) => { if (e) e.stopPropagation(); setDeleteConfirm({ open: false, postId: null, commentId: null }); };
  const confirmDeleteComment = async (e) => { if (e) e.stopPropagation(); const { postId, commentId } = deleteConfirm; if (!postId || !commentId) { cancelDelete(); return; } await handleDeleteComment(postId, commentId); cancelDelete(); };
  const startEditComment = (commentId, content, e) => { if (e) e.stopPropagation(); setEditingCommentId(commentId); setEditingCommentContent(content || ''); };
  const cancelEditComment = (e) => { if (e) e.stopPropagation(); setEditingCommentId(null); setEditingCommentContent(''); };
  
  const saveEditComment = async (postId, commentId, e) => {
    if (e) e.stopPropagation();
    if (!editingCommentContent || !editingCommentContent.trim()) {
      return showToast('error', 'Nội dung bình luận không được để trống.');
    }
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập để sửa bình luận.');

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
        throw new Error(data.message || 'Không thể cập nhật bình luận');
      }

      showToast('success', 'Đã cập nhật bình luận');
      cancelEditComment();
      await refreshComments(postId);
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi cập nhật bình luận');
    }
  };

  /* POST BÀI... */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) { showToast('error', t.invalidFile); continue; }
      if (file.size > 5 * 1024 * 1024) { showToast('error', t.fileTooLarge); continue; }
      validFiles.push(file);
    }
    if (validFiles.length + selectedFiles.length > 5) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return showToast('error', t.maxImages);
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
      if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng bài.');
      const finalLocation = pickedCoords ? `[${pickedCoords.lat.toFixed(4)}, ${pickedCoords.lng.toFixed(4)}]` : "Chưa xác định";
      let finalDescription = newPost.description ? String(newPost.description) : "";
      
      const postFormData = new FormData();
      postFormData.append('title', currentUser.role === 'admin' ? 'THÔNG BÁO TỪ HỆ THỐNG' : (newPost.title || `Trải nghiệm của ${currentUser.username}`));
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
        fetchPosts(); showToast('success', t.postSuccess);
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

  const handleLikePost = async (postId, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { showToast('error', 'Vui lòng đăng nhập để thả tim bài viết.'); return; }

    setLikingPosts((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.message || 'Không thể thả tim bài viết'); }
      const data = await res.json();
      
      setPosts((prev) => prev.map((post) => {
        if (post._id !== postId) return post;
        const existingLikes = Array.isArray(post.likes) ? [...post.likes] : [];
        const userLiked = existingLikes.some((userId) => userId?.toString() === currentUser.userId);
        if (data.liked) {
          return { ...post, likes: userLiked ? existingLikes : [...existingLikes, currentUser.userId] };
        }
        return { ...post, likes: existingLikes.filter((userId) => userId?.toString() !== currentUser.userId) };
      }));
    } catch (error) {
      showToast('error', error.message || 'Đã xảy ra lỗi khi thả tim');
    } finally {
      setLikingPosts((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCopyPostLink = async (postId, e) => {
    if(e) e.stopPropagation();
    const url = `${window.location.origin}/post-detail?postId=${postId}`;
    try { await navigator.clipboard.writeText(url); showToast('success', 'Đã copy link bài viết.'); } 
    catch (error) { showToast('error', 'Không thể copy link.'); }
    setOpenPostMenuId(null);
  };

  const handleDeletePost = async (postId, e) => {
    if(e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập.');
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Không thể xóa bài viết');
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast('success', 'Đã xóa bài viết.');
    } catch (error) { showToast('error', error.message || 'Lỗi khi xóa bài viết.'); } 
    finally { setOpenPostMenuId(null); }
  };

  const handleToggleVisibility = async (postId, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập.');
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/toggle-visibility`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Không thể thay đổi trạng thái bài viết');
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isHidden: data.isHidden } : p)));
      showToast('success', data.message || 'Đã cập nhật trạng thái bài viết.');
    } catch (error) { showToast('error', error.message || 'Lỗi hệ thống.'); } 
    finally { setOpenPostMenuId(null); }
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

      if (!res.ok) throw new Error('Không gọi được trợ lý AI');
      const data = await res.json();
      const reply = data.reply || 'Mình chưa có câu trả lời phù hợp, bạn thử lại nhé.';
      setAiChatMessages((prev) => [...prev, { role: 'ai', content: reply }]);
    } catch (error) {
      setAiChatMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Hiện tại AI đang bận hoặc thiếu cấu hình `GROQ_API_KEY` ở backend.' }
      ]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  /* Gửi tin nhắn riêng (User-to-User) hoặc Group... */
  const handleSendUserMessage = async () => {
    if (!userMessageInput.trim() || (!selectedChatUser && !selectedGroup)) return;
    const token = localStorage.getItem('token');
    const text = userMessageInput;
    
    const key = selectedGroup ? selectedGroup._id : String(selectedChatUser._id);
    
    // Optimistic Update
    setUserMessages(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { sender: 'me', text, senderName: currentUser.username, senderAvatar: currentUser.avatar }]
    }));
    setUserMessageInput('');

    try {
      let convId = currentConversationId;
      
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
        } else {
          throw new Error("Không thể tạo hội thoại");
        }
      }

      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiverId: selectedGroup ? undefined : String(selectedChatUser._id), 
          text: text, 
          conversationId: convId 
        })
      });
      if (!res.ok) {
        console.error("Gửi tin nhắn thất bại");
      }
    } catch(err) {}
  };

  // ==========================================
  // THÊM MỚI: TÍNH NĂNG SHARE BÀI VIẾT TỪ DASHBOARD
  // ==========================================
  const handleConfirmShare = async () => {
    if (!shareModal.postData) return;
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('error', 'Vui lòng đăng nhập để chia sẻ bài viết.');
      return;
    }
    
    setIsSharing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${shareModal.postData._id}/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: shareModal.description })
      });

      if (res.ok) {
        showToast('success', 'Đã chia sẻ bài viết lên trang cá nhân của bạn!');
        setShareModal({ open: false, postData: null, description: '' });
        fetchPosts(); // Reload lại feed để thấy bài vừa share
      } else {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.message || 'Chia sẻ thất bại');
      }
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setIsSharing(false);
    }
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

  const currentKey = selectedGroup ? selectedGroup._id : (selectedChatUser ? String(selectedChatUser._id) : null);
  const currentChatMessages = currentKey ? (userMessages[currentKey] || []) : [];

  /* Render View Dashboard... */
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 pb-12 transition-colors duration-300 relative">
      {notification.text && (
        <div className={`fixed bottom-6 right-6 z-[400] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${notification.type === 'error' ? 'bg-white dark:bg-slate-800 border-[#f44336] text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-slate-800 border-green-500 text-gray-800 dark:text-gray-200'}`}>
          {notification.type === 'error' ? <ShieldAlert size={24} className="text-[#f44336]" /> : <CheckCircle size={24} className="text-green-500" />}
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{notification.text}</p>
          <button onClick={() => setNotification({ type: '', text: '' })} className="ml-4 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={18} /></button>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 py-6" onClick={cancelDelete}>
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">Xác nhận xóa bình luận</h3>
            <p className="text-sm text-gray-700 dark:text-slate-300 mb-5">Bạn có chắc chắn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelDelete} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700">Hủy</button>
              <button type="button" onClick={confirmDeleteComment} className="px-4 py-2 rounded-lg bg-[#f44336] text-white hover:bg-[#e22d41]">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* THÊM MỚI: Modal Xác nhận Chia sẻ Bài viết trên Dashboard */}
      {shareModal.open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 py-6 animate-in fade-in duration-200" onClick={() => setShareModal({ open: false, postData: null, description: '' })}>
          <div className="w-full max-w-md bg-white dark:bg-[#1A2338] rounded-3xl p-6 shadow-2xl border border-transparent dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Share2 size={20} className="text-[#f44336]" /> Chia sẻ bài viết
              </h3>
              <button onClick={() => setShareModal({ open: false, postData: null, description: '' })} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={shareModal.description}
              onChange={(e) => setShareModal(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Hãy nói gì đó về bài viết này..."
              className="w-full h-24 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 resize-none transition-all mb-4"
            />

            <div className="bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl p-3 mb-6">
              <p className="text-[12px] font-bold text-gray-900 dark:text-white mb-1">
                Bài viết của: {shareModal.postData?.sharedFrom ? (shareModal.postData.sharedFrom.createdBy?.displayName || shareModal.postData.sharedFrom.createdBy?.username) : (shareModal.postData?.createdBy?.displayName || shareModal.postData?.createdBy?.username)}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-slate-400 line-clamp-2">
                {shareModal.postData?.sharedFrom ? (shareModal.postData.sharedFrom.description || shareModal.postData.sharedFrom.title) : (shareModal.postData?.description || shareModal.postData?.title)}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShareModal({ open: false, postData: null, description: '' })} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-[14px]">
                Hủy
              </button>
              <button type="button" onClick={handleConfirmShare} disabled={isSharing} className="px-5 py-2.5 rounded-xl bg-[#f44336] text-white font-bold hover:bg-[#e53935] transition-colors text-[14px] flex items-center gap-2 shadow-md shadow-red-500/20 disabled:opacity-50">
                {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} 
                Chia sẻ ngay
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="h-[72px] bg-white dark:bg-[#131B2E] border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] dark:text-red-500 font-extrabold text-xl tracking-tight hidden sm:block">The Wanderer</Link>
        </div>
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500 dark:text-slate-400">
          <Link to="/dashboard" className="text-[#f44336] dark:text-red-500 border-b-[3px] border-[#f44336] dark:border-red-500 h-[72px] flex items-center">{t.home}</Link>
          <Link to="/explore" className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">{t.explore}</Link>
          <Link to="/community" className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">{t.community}</Link>
        </nav>
        <div className="w-1/4 flex items-center justify-end gap-5">
          <NotificationBell />
          
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              if (!isUserChatOpen) {
                 window.dispatchEvent(new Event('closeAllMenus')); 
                 setIsUserChatOpen(true);
                 setChatView('list');
              } else {
                 setIsUserChatOpen(false);
              }
            }} 
            className={`transition-colors relative chat-trigger-btn ${isUserChatOpen ? 'text-[#f44336]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <MessageSquare size={22} strokeWidth={2} />
          </button>
          
          <div className="relative" ref={friendDropdownRef}>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                if (!isFriendDropdownOpen) {
                   window.dispatchEvent(new Event('closeAllMenus')); 
                   setIsFriendDropdownOpen(true);
                   fetchFriendData(); 
                } else {
                   setIsFriendDropdownOpen(false);
                }
              }} 
              className={`transition-colors relative global-toggle-btn ${isFriendDropdownOpen ? 'text-[#f44336]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Users size={22} strokeWidth={2} />
              {receivedRequests.length > 0 ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              ) : null}
            </button>
            
            {isFriendDropdownOpen && (
              <div className="absolute right-0 top-12 w-[340px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden z-[130] animate-in slide-in-from-top-2 fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Tìm kiếm bạn bè..."
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      className="w-full bg-[#f4f4f5] dark:bg-slate-750 dark:text-white rounded-full py-2 pl-9 pr-4 text-[13px] outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all border border-transparent dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="max-h-[350px] overflow-y-auto pb-4">
                  {friendSearchQuery.trim() !== '' ? (
                    <div className="px-2 pt-2">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest px-2 mb-2">Kết quả tìm kiếm</p>
                      {searchResults.length === 0 ? (
                        <p className="text-[13px] text-center text-gray-500 dark:text-slate-400 py-4">Không tìm thấy người dùng nào.</p>
                      ) : (
                        searchResults.map(user => {
                          const strUserId = String(user._id);
                          return (
                            <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                              <div onClick={() => handleNavigateProfile(user._id)} className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-400 shrink-0 cursor-pointer overflow-hidden">
                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p onClick={() => handleNavigateProfile(user._id)} className="font-bold text-[13px] text-gray-900 dark:text-white truncate cursor-pointer hover:underline">{user.username}</p>
                              </div>
                              <div className="shrink-0 flex items-center">
                                {friends.includes(strUserId) ? (
                                  <button onClick={() => { setIsFriendDropdownOpen(false); setIsUserChatOpen(true); setSelectedChatUser(user); setChatView('conversation'); }} className="text-[11px] font-bold text-gray-500 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600">Nhắn tin</button>
                                ) : sentRequests.includes(strUserId) ? (
                                  <button onClick={() => handleUndoRequest(user._id)} className="text-[11px] font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-slate-600"><Clock size={12}/> Hoàn tác</button>
                                ) : receivedRequests.includes(strUserId) ? (
                                  <button onClick={() => handleAcceptFriend(user._id)} className="text-[11px] font-bold text-white bg-[#f44336] px-3 py-1.5 rounded-full hover:bg-[#e22d41]">Chấp nhận</button>
                                ) : (
                                  <button onClick={() => handleAddFriend(user._id)} className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900">
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
                        <div className="px-2 pt-3 pb-2 border-b border-gray-100 dark:border-slate-700">
                          <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest px-2 mb-2">Lời mời kết bạn mới</p>
                          {receivedRequests.map(reqId => {
                            const user = getUserById(reqId);
                            return (
                              <div key={reqId} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                <div onClick={() => handleNavigateProfile(user._id)} className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-400 shrink-0 cursor-pointer overflow-hidden">
                                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p onClick={() => handleNavigateProfile(user._id)} className="font-bold text-[13px] text-gray-900 dark:text-white truncate cursor-pointer hover:underline">{user.username}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => handleAcceptFriend(reqId)} className="w-8 h-8 rounded-full bg-[#f44336] text-white flex items-center justify-center hover:bg-[#e22d41] transition-colors"><Check size={16}/></button>
                                  <button onClick={() => handleDeclineFriend(reqId)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"><X size={16}/></button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}

                      <div className="px-2 pt-3">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest px-2 mb-2">Gợi ý kết nối</p>
                        {recommendedUsers.length === 0 ? (
                          <p className="text-[12px] text-gray-400 dark:text-slate-400 text-center py-4">Bạn đã kết nối với tất cả mọi người!</p>
                        ) : (
                          recommendedUsers.map(user => {
                            const strUserId = String(user._id);
                            return (
                              <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                <div onClick={() => handleNavigateProfile(user._id)} className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-400 shrink-0 cursor-pointer overflow-hidden">
                                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p onClick={() => handleNavigateProfile(user._id)} className="font-bold text-[13px] text-gray-900 dark:text-white truncate cursor-pointer hover:underline">{user.username}</p>
                                  <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">Có thể bạn quen</p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                  {sentRequests.includes(strUserId) ? (
                                    <button onClick={() => handleUndoRequest(user._id)} className="text-[11px] font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-slate-600"><Clock size={12}/> Hoàn tác</button>
                                  ) : (
                                    <button 
                                      onClick={() => handleAddFriend(user._id)}
                                      className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors shrink-0"
                                      title="Kết bạn"
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
          
          <AccountMenu avatar={currentUser.avatar} username={currentUser.username} />
        </div>
      </header>

      {/* Giao diện Modal Chat... */}
      {isUserChatOpen && (
        <div ref={userChatModalRef} onClick={e => e.stopPropagation()} className="fixed right-6 top-[85px] z-[120] w-[340px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-top-4 fade-in rounded-2xl">
          <div className="bg-[#f44336] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              {chatView === 'conversation' ? (
                <>
                  <button onClick={() => setChatView('list')} className="hover:bg-red-600 p-1 rounded-full transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <span onClick={() => {
                      if(selectedChatUser) handleNavigateProfile(selectedChatUser?._id)
                  }} className={`font-bold text-[14px] ${selectedChatUser ? 'cursor-pointer hover:underline' : ''}`}>
                    {selectedGroup ? selectedGroup.groupName : (selectedChatUser?.username || 'Trò chuyện')}
                  </span>
                </>
              ) : (
                <>
                  <MessageSquare size={18} />
                  <span className="font-bold text-[14px]">Tin nhắn</span>
                </>
              )}
            </div>
            <button onClick={() => setIsUserChatOpen(false)} className="hover:bg-red-600 p-1 rounded-full transition-colors"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 flex flex-col">
            {chatView === 'list' ? (
              <div className="p-2 pb-4 flex flex-col h-full bg-white dark:bg-slate-800">
                <button onClick={() => setIsCreateGroupOpen(true)} className="mb-2 bg-red-50 dark:bg-red-950/30 text-[#f44336] dark:text-red-400 text-[13px] font-bold py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                  + Tạo nhóm chat
                </button>
                <div className="flex-1 overflow-y-auto">
                  {conversationsList.length === 0 ? (
                    <div className="p-6 text-center text-[12px] text-gray-500 dark:text-slate-400">
                      <Users size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                      Chưa có cuộc trò chuyện nào.<br/>Tạo nhóm hoặc chọn bạn bè để chat!
                    </div>
                  ) : (
                    conversationsList.map(conv => {
                      const isGroup = conv.isGroup;
                      const otherUser = !isGroup ? conv.participants.find(p => String(p._id) !== currentUser.userId) : null;
                      const displayName = isGroup ? conv.groupName : (otherUser?.username || 'Người dùng');
                      const displayAvatar = isGroup ? null : otherUser?.avatar;
                      const lastMessage = conv.lastMessage || 'Bắt đầu trò chuyện';

                      return (
                        <div key={conv._id} onClick={() => { 
                            if (isGroup) {
                                setSelectedGroup(conv);
                                setSelectedChatUser(null);
                            } else {
                                setSelectedGroup(null);
                                setSelectedChatUser(otherUser);
                            }
                            setChatView('conversation'); 
                          }} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 dark:border-slate-600 relative overflow-hidden hover:opacity-80">
                            {isGroup ? <Users size={20} /> : (displayAvatar ? <img src={displayAvatar} className="w-full h-full object-cover"/> : <User size={20} />)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[13px] text-gray-900 dark:text-white truncate">{displayName}</p>
                            <p className="text-[12px] text-gray-500 dark:text-slate-400 truncate">{lastMessage}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-white dark:bg-slate-800 relative">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-white dark:bg-[#131B2E]">
                  {isChatLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#f44336]" /></div>
                  ) : (
                    <>
                      <div className="text-center text-[11px] text-gray-400 dark:text-slate-500 mb-4">
                        {selectedGroup ? `Bắt đầu trò chuyện trong ${selectedGroup.groupName}` : `Bắt đầu trò chuyện với ${selectedChatUser?.username}`}
                      </div>
                      
                      {currentChatMessages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                          {msg.sender === 'them' && selectedGroup && (
                            <span className="text-[10px] text-gray-400 dark:text-slate-400 ml-10 mb-0.5">{msg.senderName}</span>
                          )}
                          <div className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} w-full`}>
                            {msg.sender === 'them' && (
                              <div onClick={() => !selectedGroup && handleNavigateProfile(msg.senderId)} className="w-7 h-7 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 dark:border-slate-600 mr-2 self-end mb-1 overflow-hidden cursor-pointer hover:opacity-80">
                                {msg.senderAvatar ? <img src={msg.senderAvatar} className="w-full h-full object-cover"/> : (selectedChatUser?.avatar ? <img src={selectedChatUser.avatar} className="w-full h-full object-cover"/> : <User size={14} />)}
                              </div>
                            )}
                            <div className={`px-4 py-2 rounded-2xl max-w-[75%] text-[13px] ${msg.sender === 'me' ? 'bg-[#f44336] text-white rounded-br-sm shadow-sm' : 'bg-[#f4f4f5] dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-sm border border-transparent dark:border-slate-700 shadow-sm'}`}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      ))}
                      {currentChatMessages.length === 0 && (
                         <div className="flex justify-center text-[12px] text-gray-400 dark:text-slate-500 mt-4">
                           Hãy nói lời chào 👋
                         </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 transition-colors">
                  <div className="relative">
                    <input
                      type="text"
                      value={userMessageInput}
                      onChange={(e) => setUserMessageInput(e.target.value)}
                      placeholder="Aa"
                      className="w-full bg-[#f4f4f5] dark:bg-slate-750 dark:text-white rounded-full py-2 pl-4 pr-10 text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all border border-transparent dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userMessageInput.trim()) handleSendUserMessage();
                      }}
                    />
                    <button
                      onClick={handleSendUserMessage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Giao diện News Feed Main... */}
      <main className="max-w-[1480px] mx-auto pt-8 px-6 2xl:px-8 flex gap-8 items-start">
        
        <div className="flex-1 min-w-0 flex justify-center">
          <div className="w-full max-w-[680px] flex flex-col gap-14 pb-12">
            {/* Form tạo bài viết */}
            <div className="bg-white dark:bg-[#1A2338] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <p className="text-[13px] font-black text-gray-900 dark:text-white">Tạo bài viết mới</p>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Chia sẻ ảnh, ghim bản đồ, kể lại trải nghiệm của bạn.</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400">
                  BẢNG TIN DU LỊCH
                </span>
              </div>
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 flex-shrink-0">
                  <img src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <textarea 
                  placeholder={currentUser.role === 'admin' ? "Phát thông báo hệ thống..." : "Chia sẻ địa điểm bạn vừa khám phá..."}
                  className="w-full bg-[#f4f4f5] dark:bg-slate-800 dark:text-white rounded-xl p-3.5 text-[14px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all border border-transparent dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-400"
                  rows="3"
                  value={newPost.description}
                  onChange={e => setNewPost({...newPost, description: e.target.value})}
                ></textarea>
              </div>

              {previewUrls.length > 0 ? (
                <div className="flex flex-wrap gap-3 mb-3 pl-12">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 group animate-in zoom-in-90">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-gray-900/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              ) : null}
              
              {showMapPicker ? (
                <div className="mb-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 animate-in fade-in duration-300 ml-12">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[12px] font-bold text-gray-500 dark:text-slate-400">📍 Nhấn vào bản đồ để lấy tọa độ chính xác</p>
                    {pickedCoords ? <span className="text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded border border-green-200 dark:border-green-900">[{pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)}]</span> : null}
                  </div>
                  <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700 relative z-0 shadow-inner">
                    <RealMapPicker setPickedCoords={setPickedCoords} />
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-700 pt-4 mt-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowMapPicker(!showMapPicker)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors select-none ${pickedCoords || showMapPicker ? 'bg-red-50 dark:bg-red-950/30 text-[#f44336] dark:text-red-400' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                    <MapPin size={16} strokeWidth={2.5} /> {pickedCoords ? 'Đã ghim vị trí' : 'Ghim vị trí'}
                  </button>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors select-none cursor-pointer">
                    <ImageIcon size={16} strokeWidth={2.5} /> Tải ảnh lên
                  </button>
                </div>
                <button type="button" onClick={handleQuickPost} disabled={isPosting} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all shadow-md ${currentUser.role === 'admin' ? 'bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200' : 'bg-[#f44336] shadow-red-500/20 hover:bg-[#e53935]'} disabled:opacity-50`}>
                  {isPosting ? <span>Đang tải...</span> : <span className="flex items-center gap-1.5"><Send size={16} /> Đăng bài</span>}
                </button>
              </div>
            </div>

            {/* List Bài Viết (ĐÃ BỌC Sự kiện Click Chuyển Trang) */}
            <div className="space-y-6 pb-12">
              {Array.isArray(posts) ? posts.map((post) => {
                const isAdmin = post.createdBy?.role === 'admin';
                const isOwner = Boolean(currentUser.userId) && String(post.createdBy?._id || '') === String(currentUser.userId);
                
                // NHẬN DIỆN BÀI LÀ BÀI SHARE HAY BÀI THƯỜNG
                const isShared = Boolean(post.sharedFrom && typeof post.sharedFrom === 'object');
                const originalPost = isShared ? post.sharedFrom : null;

                return (
                  <div 
                    key={post._id || Math.random().toString()} 
                    onClick={() => navigate(`/post-detail?postId=${post._id}`)}
                    className={`bg-white dark:bg-[#1A2338] rounded-2xl overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${isAdmin ? 'border-red-200 dark:border-red-950' : 'border-gray-100 dark:border-slate-800'}`}
                  >
                    {isAdmin ? (
                      <div className="bg-red-50 dark:bg-red-950/50 px-5 py-2.5 flex items-center gap-2 border-b border-red-100 dark:border-red-900">
                        <ShieldAlert size={16} className="text-[#f44336] dark:text-red-400" />
                        <span className="text-[11px] font-black text-[#f44336] dark:text-red-400 uppercase tracking-widest">Thông báo từ Ban Quản Trị</span>
                      </div>
                    ) : null}

                    <div className="p-6">
                      {/* HEADER Bài viết (Của người Share hoặc Người đăng gốc) */}
                      <div className="flex justify-between items-center mb-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer hover:ring-2 hover:ring-red-200 transition-all ${isAdmin ? 'border-[#f44336]' : 'border-transparent'}`}
                            onClick={() => handleNavigateProfile(post.createdBy?._id)}
                          >
                            <img src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.displayName || post.createdBy?.username)} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 
                              className="text-[14px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5 cursor-pointer hover:underline"
                              onClick={() => handleNavigateProfile(post.createdBy?._id)}
                            >
                              {post.createdBy?.displayName || post.createdBy?.username} 
                              {isAdmin ? <CheckCircle size={14} className="text-[#f44336] dark:text-red-400" /> : null}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400">
                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}
                              </p>
                              {!isShared && post.category ? (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400 border border-red-100 dark:border-red-900/50">
                                  {post.category}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="relative post-menu-container">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setOpenPostMenuId((prev) => (prev === post._id ? null : post._id)); }}
                            className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white p-1"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          {openPostMenuId === post._id ? (
                            <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-1">
                              <button
                                type="button"
                                onClick={(e) => handleCopyPostLink(post._id, e)}
                                className="w-full flex items-center gap-2 text-left px-3 py-2 text-[12px] font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
                              >
                                <Copy size={14} /> Copy link bài viết
                              </button>
                              {(isOwner || currentUser.role === 'admin') ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePost(post._id, e)}
                                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg mt-1 border-t border-gray-50 dark:border-slate-700 pt-2"
                                >
                                  <Trash2 size={14} /> Xóa bài viết
                                </button>
                              ) : null}
                              {currentUser.role === 'admin' ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleVisibility(post._id, e)}
                                  className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
                                >
                                  {post.isHidden ? "Hiện bài viết" : "Ẩn bài viết"}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {post.title && post.title !== `Trải nghiệm của ${post.createdBy?.username}` && (
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-[#f44336] dark:group-hover:text-red-400 transition-colors">{post.title}</h2>
                      )}

                      {/* Lời bình của người đăng (hoặc người share) */}
                      {(() => {
                        const desc = post.description;
                        if (desc && String(desc).trim() !== "0" && String(desc).trim() !== "" && String(desc) !== "\u200B") {
                          return (
                            <p className="text-[14px] text-gray-800 dark:text-slate-200 font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                              {String(desc)}
                            </p>
                          );
                        }
                        return null;
                      })()}

                      {/* HIỂN THỊ BÀI LỒNG GHÉP NẾU ĐÂY LÀ BÀI SHARE */}
                      {isShared ? (
                        <div className="mt-3 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-[#131B2E]" onClick={e => e.stopPropagation()}>
                          
                          {/* Header bài gốc */}
                          <div className="p-4 pb-2 flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 cursor-pointer hover:opacity-80"
                              onClick={() => handleNavigateProfile(originalPost.createdBy?._id)}
                            >
                              <img src={getAvatarUrl(originalPost.createdBy?.avatar, originalPost.createdBy?.displayName || originalPost.createdBy?.username)} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h3 
                                className="text-[13px] font-bold text-gray-900 dark:text-white cursor-pointer hover:underline"
                                onClick={() => handleNavigateProfile(originalPost.createdBy?._id)}
                              >
                                {originalPost.createdBy?.displayName || originalPost.createdBy?.username}
                              </h3>
                              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                                {originalPost.createdAt ? new Date(originalPost.createdAt).toLocaleDateString('vi-VN') : ''}
                              </p>
                            </div>
                          </div>

                          <div 
                            className="cursor-pointer"
                            onClick={() => navigate(`/post-detail?postId=${originalPost._id}`)}
                          >
                            {/* Text bài gốc */}
                            {originalPost.description && (
                              <div className="px-4 pb-3 text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                                {originalPost.description}
                              </div>
                            )}

                            {/* Bản đồ của bài gốc (Mượn lat/lng đã được copy ra ngoài bài share) */}
                            {post.lat && post.lng ? (
                              <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
                                <button type="button" onClick={() => setExpandedMap(prev => ({ ...prev, [post._id]: !prev[post._id] }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400 border-transparent hover:bg-red-100 dark:hover:bg-red-950/20'}`}>
                                  <MapPin size={14} /> 
                                  {typeof originalPost.location === 'string' && originalPost.location !== 'Chưa xác định' ? originalPost.location : "Vị trí được ghim"}
                                </button>
                                {expandedMap[post._id] ? (
                                  <div className="mt-2 h-[200px] w-full border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
                                    <RealMapViewer lat={post.lat} lng={post.lng} role={originalPost.createdBy?.role} location={originalPost.location} />
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {/* Hình ảnh của bài gốc */}
                            {Array.isArray(originalPost.images) && originalPost.images.length > 0 && (
                                <img
                                  src={getPostImageUrl(originalPost.images[0])}
                                  alt="media"
                                  className="w-full object-cover border-t border-gray-100 dark:border-slate-750 max-h-[350px]"
                                />
                            )}
                          </div>
                        </div>
                      ) : (
                        /* NẾU LÀ BÀI BÌNH THƯỜNG THÌ RENDER NHƯ CŨ */
                        <>
                          {post.lat && post.lng ? (
                            <div className="mb-4" onClick={e => e.stopPropagation()}>
                              <button type="button" onClick={() => setExpandedMap(prev => ({ ...prev, [post._id]: !prev[post._id] }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400 border-transparent hover:bg-red-100 dark:hover:bg-red-950/20'}`}>
                                <MapPin size={16} /> 
                                {typeof post.location === 'string' && post.location !== 'Chưa xác định' ? post.location : "Vị trí được ghim"}
                                <span className={`text-[10px] px-2 py-0.5 rounded-md ml-2 transition-colors ${expandedMap[post._id] ? 'bg-black/20 text-white' : 'bg-white dark:bg-slate-800 text-[#f44336] dark:text-red-400 shadow-sm'}`}>
                                  {expandedMap[post._id] ? "Đóng Bản đồ" : "📍 Xem Map"}
                                </span>
                              </button>
                              {expandedMap[post._id] ? (
                                <div className="mt-3 h-[250px] w-full border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
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
                                  className="w-full rounded-2xl object-cover border border-gray-100 dark:border-slate-750 max-h-[420px]"
                                />
                                {normalizedImages.length > 1 ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {normalizedImages.slice(1).map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img}
                                        alt={`media-${idx + 1}`}
                                        className="w-full h-[150px] rounded-xl object-cover border border-gray-100 dark:border-slate-750"
                                      />
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })() : null}
                        </>
                      )}

                      {/* ACTIONS Bài viết */}
                      <div className="flex items-center gap-6 pt-3 border-t border-gray-50 dark:border-slate-700 mt-4" onClick={e => e.stopPropagation()}>
                        {(() => {
                          const likedByCurrentUser = Array.isArray(post.likes) && post.likes.some((userId) => userId?.toString() === currentUser.userId);
                          return (
                            <button
                              type="button"
                              onClick={(e) => handleLikePost(post._id, e)}
                              disabled={likingPosts[post._id]}
                              className={`flex items-center gap-1.5 ${likedByCurrentUser ? 'text-[#f44336]' : 'text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400'} transition-colors text-[13px] font-bold disabled:opacity-50`}
                            >
                              <Heart size={20} strokeWidth={2.5} fill={likedByCurrentUser ? '#f44336' : 'none'} /> {Array.isArray(post.likes) ? post.likes.length : 0}
                            </button>
                          );
                        })()}
                        
                        <button type="button" onClick={(e) => toggleComments(post._id, e)} className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400 transition-colors text-[13px] font-bold">
                          <MessageSquare size={20} strokeWidth={2.5} /> {post.totalReviews || "Bình luận"}
                        </button>
                        
                        {/* NÚT MỞ MODAL CHIA SẺ VÀO ĐÂY */}
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setShareModal({ open: true, postData: post, description: '' }); }} 
                          className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400 transition-colors text-[13px] font-bold"
                        >
                          <Share2 size={20} strokeWidth={2.5} /> Chia sẻ
                        </button>

                        <div className="ml-auto flex items-center">
                          <SavePostButton postId={post._id} initialIsSaved={savedPostsSet.has(post._id)} />
                        </div>
                      </div>

                      {/* BÌNH LUẬN */}
                      {expandedComments[post._id] ? (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 animate-in fade-in duration-300" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 flex-shrink-0 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(currentUser.userId)}>
                              <img src={getAvatarUrl(currentUser.avatar, currentUser.username)} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 relative">
                              <input 
                                type="text" 
                                placeholder="Viết bình luận..."
                                className="w-full bg-[#f4f4f5] dark:bg-slate-800 dark:text-white rounded-full py-2 pl-4 pr-10 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 dark:focus:ring-red-500/20 transition-all border border-transparent dark:border-slate-700"
                                value={commentInputs[post._id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({...prev, [post._id]: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id, null, e)}
                              />
                              <button onClick={(e) => handlePostComment(post._id, null, e)} disabled={isSubmittingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors disabled:opacity-50">
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
                                      <img src={getAvatarUrl(comment.author?.avatar, comment.author?.username)} alt="avt" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100 dark:border-slate-700 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(comment.author?._id)} />
                                      <div className="flex-1">
                                        {editingCommentId === comment._id ? (
                                          <div className="bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-3">
                                            <textarea
                                              value={editingCommentContent}
                                              onChange={(e) => setEditingCommentContent(e.target.value)}
                                              className="w-full min-h-[70px] resize-none p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f44336]/40 outline-none text-[13px]"
                                              rows={3}
                                            />
                                            <div className="mt-2 flex justify-between items-center">
                                              <button onClick={(e) => cancelEditComment(e)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 text-[12px] font-semibold">Hủy</button>
                                              <button onClick={(e) => saveEditComment(post._id, comment._id, e)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">Lưu</button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="bg-[#f4f4f5] dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-none inline-block border border-transparent dark:border-slate-700">
                                            <p onClick={() => handleNavigateProfile(comment.author?._id)} className="font-bold text-gray-900 dark:text-white mb-0.5 text-[12px] cursor-pointer hover:underline">{comment.author?.displayName || comment.author?.username}</p>
                                            <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{comment.content}</p>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                          <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                          <button type="button" className="hover:text-[#f44336] dark:hover:text-red-400 transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: null })}>Phản hồi</button>
                                          {isCommentAuthor ? (
                                            <>
                                              <button type="button" className="hover:text-[#f44336] dark:hover:text-red-400 transition-colors" onClick={(e) => startEditComment(comment._id, comment.content, e)}>Sửa</button>
                                              <button type="button" className="hover:text-[#f44336] dark:hover:text-red-400 transition-colors" onClick={(e) => showDeleteConfirm(post._id, comment._id, e)}>Xóa</button>
                                            </>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>

                                    {(Array.isArray(comment.replies) && comment.replies.length > 0) ? (
                                      <div className="mt-3 ml-[44px] space-y-4 border-l-2 border-gray-100 dark:border-slate-700 pl-4 relative">
                                        {comment.replies.map((reply) => (
                                          <div key={reply._id || Math.random().toString()} className="flex gap-2">
                                            <img src={getAvatarUrl(reply.author?.avatar, reply.author?.username)} alt="avt" className="w-6 h-6 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(reply.author?._id)} />
                                            <div className="flex-1">
                                              <div className="bg-white dark:bg-slate-850 border border-gray-100 dark:border-slate-700 shadow-sm px-3 py-2 rounded-2xl rounded-tl-none inline-block">
                                                <p onClick={() => handleNavigateProfile(reply.author?._id)} className="font-bold text-gray-900 dark:text-white mb-0.5 text-[12px] cursor-pointer hover:underline">{reply.author?.displayName || reply.author?.username}</p>
                                                {editingCommentId === reply._id ? (
                                                  <div>
                                                    <textarea
                                                      value={editingCommentContent}
                                                      onChange={(e) => setEditingCommentContent(e.target.value)}
                                                      className="w-full min-h-[70px] resize-none p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f44336]/40 outline-none text-[13px]"
                                                      rows={3}
                                                    />
                                                    <div className="mt-2 flex justify-between items-center">
                                                      <button onClick={(e) => cancelEditComment(e)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 text-[12px] font-semibold">Hủy</button>
                                                      <button onClick={(e) => saveEditComment(post._id, reply._id, e)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">Lưu</button>
                                                    </div>
                                                  </div>
                                                ) : typeof reply.content === 'string' && reply.content.startsWith('@') ? (
                                                  <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
                                                    <span className="text-[#00897b] font-bold mr-1">{reply.content.split(' ')[0]}</span>
                                                    <span>{reply.content.substring(reply.content.indexOf(' ') + 1)}</span>
                                                  </p>
                                                ) : (
                                                  <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{reply.content}</p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                                <span>{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                                <button type="button" className="hover:text-[#f44336] dark:hover:text-red-400 transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: reply.author?.username })}>Phản hồi</button>
                                                {reply.author?._id?.toString() === currentUser.userId ? (
                                                  <>
                                                    <button type="button" className="hover:text-[#f44336] dark:hover:text-red-400 transition-colors" onClick={(e) => startEditComment(reply._id, reply.content, e)}>Sửa</button>
                                                    <button type="button" className="hover:text-[#f44336] dark:hover:text-red-400 transition-colors" onClick={(e) => showDeleteConfirm(post._id, reply._id, e)}>Xóa</button>
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
                                        <CornerDownRight size={16} className="text-gray-300 dark:text-slate-500 mt-2 flex-shrink-0" />
                                        <div className="flex-1 relative">
                                          <input 
                                            type="text" autoFocus placeholder={replyingTo.childUsername ? `Đang phản hồi @${replyingTo.childUsername}...` : `Phản hồi ${comment.author?.username}...`}
                                            className="w-full bg-white dark:bg-slate-800 border border-[#f44336]/30 dark:border-slate-700 shadow-sm rounded-full py-2 pl-4 pr-10 text-[12px] font-medium focus:outline-none focus:border-[#f44336] transition-all"
                                            value={replyInputs[comment._id] || ''}
                                            onChange={(e) => setReplyInputs(prev => ({...prev, [comment._id]: e.target.value}))}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id, comment._id, e)}
                                          />
                                          <button type="button" onClick={(e) => handlePostComment(post._id, comment._id, e)} disabled={isSubmittingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors disabled:opacity-50">
                                            <Send size={14} />
                                          </button>
                                        </div>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setReplyingTo({ parentId: null, childUsername: null }) }} className="text-gray-400 hover:text-gray-900 mt-2"><X size={16}/></button>
                                      </div>
                                    ) : null}
                                  </div>
                                )
                              })}
                              {(!commentsData[post._id] || commentsData[post._id].length === 0) ? (
                                <div className="text-center py-6 text-gray-400 text-[13px] font-bold">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
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
        </div>

        {/* Vùng Cột phải (Gợi ý và Trending)... */}
        <aside className="w-[340px] hidden lg:block flex-shrink-0 space-y-6 sticky top-[104px]">
          <div className="bg-white dark:bg-[#1A2338] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <h3 className="text-[12px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">📍 Địa điểm đang hot</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-wider mb-0.5">Biển</p>
                <p onClick={() => showToast('success', 'Đã lưu vào danh sách xem sau: Bãi Sao')} className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight cursor-pointer hover:underline">Bãi Sao, Phú Quốc</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#00897b] uppercase tracking-wider mb-0.5">Văn hóa</p>
                <p onClick={() => showToast('success', 'Đã thêm Phố cổ Hội An vào Gợi ý')} className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight cursor-pointer hover:underline">Phố cổ Hội An</p>
              </div>
              {trendingPosts.map((trendingPost) => (
                <div key={trendingPost._id}>
                  <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-wider mb-0.5">
                    {trendingPost.category || 'Khám phá'}
                  </p>
                  <p 
                    onClick={() => {
                      navigate(`/post-detail?postId=${trendingPost._id}`);
                    }} 
                    className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight cursor-pointer hover:underline"
                  >
                    {trendingPost.title || trendingPost.location || "Chưa xác định"}
                  </p>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <Heart size={12} className="text-[#f44336]" fill="#f44336" /> {trendingPost.likeCount || 0} lượt thích
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1A2338] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <h3 className="text-[12px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">✨ Gợi ý nhanh</h3>
            <div className="space-y-2">
              <button type="button" onClick={(e) => { 
                e.stopPropagation();
                window.dispatchEvent(new Event('closeAllMenus'));
                setIsAiChatOpen(true); 
                setAiChatInput("Gợi ý lịch trình Đà Nẵng 2 ngày 1 đêm"); 
              }} className="w-full text-left text-[12px] font-bold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg px-3 py-2">
                Lịch trình Đà Nẵng 2N1Đ
              </button>
              <button type="button" onClick={(e) => { 
                e.stopPropagation();
                window.dispatchEvent(new Event('closeAllMenus'));
                setIsAiChatOpen(true); 
                setAiChatInput("Gợi ý món ăn ngon ở Huế"); 
              }} className="w-full text-left text-[12px] font-bold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg px-3 py-2">
                Ăn gì ở Huế?
              </button>
              <button type="button" onClick={(e) => { 
                e.stopPropagation();
                window.dispatchEvent(new Event('closeAllMenus'));
                setIsAiChatOpen(true); 
                setAiChatInput("Điểm check-in đẹp ở Hội An buổi tối"); 
              }} className="w-full text-left text-[12px] font-bold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg px-3 py-2">
                Check-in Hội An buổi tối
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#ef4444] to-[#f97316] p-5 rounded-2xl shadow-sm text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">Mẹo du lịch</p>
            <p className="text-[13px] font-bold leading-relaxed">
              Đăng bài có ảnh thật + tọa độ ghim sẽ giúp bài nổi bật hơn và dễ được cộng đồng tương tác.
            </p>
          </div>
        </aside>

      </main>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isAiChatOpen) {
             window.dispatchEvent(new Event('closeAllMenus'));
             setIsAiChatOpen(true);
          } else {
             setIsAiChatOpen(false);
          }
        }}
        className="fixed right-6 bottom-6 z-[101] bg-[#f44336] text-white w-14 h-14 rounded-full shadow-xl shadow-red-500/30 hover:bg-[#e53935] flex items-center justify-center"
      >
        <Bot size={24} />
      </button>

      {/* Giao diện Modal AI Tư vấn (Groq)... */}
      {isAiChatOpen ? (
        <div className="fixed right-6 bottom-24 z-[101] w-[340px] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-850">
            <h3 className="text-[13px] font-black text-gray-900 dark:text-white">AI tư vấn địa điểm</h3>
            <button type="button" onClick={() => setIsAiChatOpen(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
          <div className="h-[320px] overflow-y-auto px-3 py-3 space-y-3 bg-[#fafafa] dark:bg-slate-900">
            {aiChatMessages.map((msg, index) => (
              <div key={index} className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] font-medium whitespace-pre-wrap ${msg.role === 'user' ? 'ml-auto bg-[#f44336] text-white rounded-br-md' : 'bg-white dark:bg-slate-850 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-md'}`}>
                {msg.content}
              </div>
            ))}
            {isAiChatLoading ? (
              <div className="bg-white dark:bg-slate-850 text-gray-500 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-md px-3 py-2 text-[13px] font-medium inline-block animate-pulse">
                Đang tư vấn...
              </div>
            ) : null}
          </div>
          <div className="p-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2">
            <input
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiChat()}
              placeholder="Ví dụ: Gợi ý lịch trình Đà Lạt 2 ngày"
              className="flex-1 bg-[#f4f4f5] dark:bg-slate-750 dark:text-white rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all border border-transparent dark:border-slate-750"
            />
            <button
              type="button"
              onClick={handleSendAiChat}
              disabled={isAiChatLoading || !aiChatInput.trim()}
              className="px-4 py-2 rounded-xl bg-[#f44336] text-white text-[13px] font-bold hover:bg-[#e53935] disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  if (!hasRouter) return <MemoryRouter><DashboardContent /></MemoryRouter>;
  return <DashboardContent />;
}