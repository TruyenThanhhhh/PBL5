import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, MemoryRouter, useInRouterContext } from 'react-router-dom';
import { 
  Bell, MessageSquare, Compass, Settings, 
  MapPin, Image as ImageIcon, Send, ShieldAlert,
  Heart, Share2, MoreHorizontal, CheckCircle, X, Info, CornerDownRight, Loader2, Bot,
  ArrowLeft, User, Bookmark, Users, UserPlus, Check, Search, Clock
} from 'lucide-react';

// ==========================================
// COMPONENT PHỤ TRỢ
// ==========================================
const NotificationBell = () => (
  <button type="button" className="text-gray-500 hover:text-gray-900 transition-colors relative">
    <Bell size={22} strokeWidth={2} />
  </button>
);

const SavePostButton = ({ postId, postImage }) => (
  <button type="button" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold">
    <Bookmark size={20} strokeWidth={2.5} />
  </button>
);

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

// ==========================================
// COMPONENT BẢN ĐỒ
// ==========================================
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

// ==========================================
// GIAO DIỆN CHÍNH
// ==========================================
function DashboardContent() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState({ userId: '', username: 'Khách', role: 'user', avatar: '' });
  
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
    { role: 'ai', content: 'Xin chào! Mình là trợ lý du lịch 🤖 Bạn muốn đi đâu cuối tuần này?' }
  ]);

  // ==============================================================
  // STATE HỆ THỐNG BẠN BÈ VÀ CHAT
  // ==============================================================
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
  const [currentConversationId, setCurrentConversationId] = useState(null); // Quản lý ID cuộc hội thoại

  const getUserById = (id) => allUsers.find(u => String(u._id) === String(id)) || { username: 'Người dùng', _id: id };

  // ==============================================================
  // TẢI DỮ LIỆU TỪ DATABASE
  // ==============================================================
  
  const fetchAllUsers = async () => {
    const token = localStorage.getItem('token');
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
      }
    } catch (error) { console.error('Lỗi API lấy users:', error); }
  };

  const fetchFriendData = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const myFollowing = (data.user.following || []).map(u => String(u._id || u));
          const myFollowers = (data.user.followers || []).map(u => String(u._id || u));

          const mutualFriends = myFollowing.filter(id => myFollowers.includes(id));
          const sent = myFollowing.filter(id => !myFollowers.includes(id));
          const received = myFollowers.filter(id => !myFollowing.includes(id));

          setFriends(mutualFriends);
          setSentRequests(sent);
          setReceivedRequests(received);

          const combinedUsers = [...(data.user.followers || []), ...(data.user.following || [])];
          setAllUsers(prev => {
            const newUsers = [...prev];
            combinedUsers.forEach(u => {
              if (u._id && !newUsers.find(exist => String(exist._id) === String(u._id))) {
                newUsers.push(u);
              }
            });
            return newUsers;
          });
        }
      }
    } catch (error) { console.error('Lỗi API lấy dữ liệu bạn bè:', error); }
  };

  // ==============================================================
  // FETCH LỊCH SỬ TIN NHẮN TỪ DATABASE (CẬP NHẬT THEO CƠ CHẾ CONVERSATION)
  // ==============================================================
  const fetchChatHistory = async (targetUserId) => {
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');
    if (!token || !targetUserId) return;
    
    try {
      // 1. Tạo hoặc lấy thông tin Cuộc hội thoại (Conversation)
      const convRes = await fetch('http://localhost:5000/api/messages/conversation', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (!convRes.ok) return;
      const conversation = await convRes.json();
      setCurrentConversationId(conversation._id); // Lưu lại Id Cuộc trò chuyện

      // 2. Lấy danh sách tin nhắn dựa trên Conversation ID
      const msgRes = await fetch(`http://localhost:5000/api/messages/${conversation._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (msgRes.ok) {
        const messages = await msgRes.json();
        const formattedMessages = messages.map(msg => {
          const senderId = msg.sender?._id || msg.sender;
          return {
            sender: String(senderId) === String(currentUserId) ? 'me' : 'them',
            text: msg.text // Sửa 'content' thành 'text' theo Model của bạn
          };
        });
        
        setUserMessages(prev => ({
          ...prev,
          [targetUserId]: formattedMessages
        }));
      }
    } catch (error) {
      console.error('Lỗi lấy lịch sử tin nhắn:', error);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('role') || 'user';
    const userId = localStorage.getItem('userId') || ''; 
    const username = localStorage.getItem('username') || '';
    const avatar = localStorage.getItem('avatar') || '';
    setCurrentUser({ userId, username, role: String(userRole).toLowerCase(), avatar });
    
    loadLeafletAssets().catch(() => {});
    fetchPosts();

    if (userId) {
      fetchAllUsers();
      fetchFriendData();
    }

    const handleOpenChat = (e) => {
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

  // Tự động Load tin nhắn khi mở khung chat với một User cụ thể
  useEffect(() => {
    if (isUserChatOpen && chatView === 'conversation' && selectedChatUser) {
      fetchChatHistory(selectedChatUser._id);
    }
  }, [isUserChatOpen, chatView, selectedChatUser]);

  const showToast = (type, text) => {
    setNotification({ type, text: String(text) });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  // ==============================================================
  // ACTIONS BẠN BÈ
  // ==============================================================
  
  const handleAddFriend = async (userId) => {
    const strUserId = String(userId);
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập để kết bạn.');

    setSentRequests(prev => [...prev, strUserId]);

    try {
      const res = await fetch(`http://localhost:5000/api/users/follow/${strUserId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.following) {
        showToast('success', 'Đã gửi lời mời kết bạn');
      } else {
        setSentRequests(prev => prev.filter(id => id !== strUserId));
        showToast('error', data.message || 'Lỗi gửi yêu cầu');
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
      const res = await fetch(`http://localhost:5000/api/users/follow/${strUserId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && !data.following) {
        showToast('success', 'Đã thu hồi lời mời');
      } else {
        setSentRequests(prev => [...prev, strUserId]);
      }
    } catch (error) {
      setSentRequests(prev => [...prev, strUserId]);
    }
  };

  const handleAcceptFriend = async (userId) => {
    const strUserId = String(userId);
    const token = localStorage.getItem('token');
    if (!token) return;

    setReceivedRequests(prev => prev.filter(id => id !== strUserId));
    setFriends(prev => [...prev, strUserId]);

    try {
      const res = await fetch(`http://localhost:5000/api/users/follow/${strUserId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast('success', 'Đã trở thành bạn bè');
      } else {
        setReceivedRequests(prev => [...prev, strUserId]);
        setFriends(prev => prev.filter(id => id !== strUserId));
      }
    } catch (error) {
      setReceivedRequests(prev => [...prev, strUserId]);
      setFriends(prev => prev.filter(id => id !== strUserId));
      showToast('error', 'Lỗi kết nối server');
    }
  };

  const handleDeclineFriend = (userId) => {
    const strUserId = String(userId);
    setReceivedRequests(prev => prev.filter(id => id !== strUserId));
    showToast('success', 'Đã từ chối lời mời');
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
      if (!res.ok) throw new Error('Không thể tải bình luận');
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) { showToast('error', `Tệp không hợp lệ!`); continue; }
      if (file.size > 5 * 1024 * 1024) { showToast('error', `Ảnh quá 5MB!`); continue; }
      validFiles.push(file);
    }
    if (validFiles.length + selectedFiles.length > 5) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return showToast('error', "Chỉ tối đa 5 ảnh!");
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
    if (!newPost.description?.trim() && selectedFiles.length === 0 && !pickedCoords) {
      return showToast('error', "Vui lòng nhập nội dung, ảnh hoặc ghim vị trí!");
    }
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng bài.');
      }
      const finalLocation = pickedCoords ? `[${pickedCoords.lat.toFixed(4)}, ${pickedCoords.lng.toFixed(4)}]` : "Chưa xác định";
      let finalDescription = newPost.description ? String(newPost.description) : "";
      if (finalDescription.trim() === "") finalDescription = "\u200B"; 
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
      showToast('error', 'Vui lòng đăng nhập để thả tim bài viết.');
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
        throw new Error(data.message || 'Không thể thả tim bài viết');
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
      showToast('error', 'Không thể copy link.');
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('error', 'Vui lòng đăng nhập.');
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể xóa bài viết');
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
    if (!token) return showToast('error', 'Vui lòng đăng nhập.');
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/toggle-visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể thay đổi trạng thái bài viết');
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

  // ==============================================================
  // GỬI TIN NHẮN TỚI BACKEND
  // ==============================================================
  const handleSendUserMessage = async () => {
    if (!userMessageInput.trim() || !selectedChatUser) return;
    const token = localStorage.getItem('token');
    const userId = String(selectedChatUser._id);
    const text = userMessageInput;
    
    // UI Update (Optimistic)
    setUserMessages(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), { sender: 'me', text }]
    }));
    setUserMessageInput('');

    try {
      // Gọi API POST /api/messages/ (Kèm theo conversationId và text)
      await fetch('http://localhost:5000/api/messages/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiverId: userId, 
          text: text, // Trường 'text' để Backend hứng đúng
          conversationId: currentConversationId 
        })
      });
    } catch(err) { console.log(err) }
  };

  // ==============================================================
  // BỘ LỌC TÌM KIẾM VÀ ĐỀ XUẤT
  // ==============================================================
  const currentUserIdStr = String(currentUser.userId);

  const searchResults = allUsers.filter(u => 
    u.role !== 'admin' && 
    String(u._id) !== currentUserIdStr && 
    u.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  const recommendedUsers = allUsers.filter(u => {
    const targetIdStr = String(u._id);
    return u.role !== 'admin' && 
           targetIdStr !== currentUserIdStr && 
           !friends.includes(targetIdStr) &&
           !receivedRequests.includes(targetIdStr);
  });

  const currentChatMessages = selectedChatUser ? (userMessages[selectedChatUser._id] || []) : [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans relative">
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
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Xác nhận xóa bình luận</h3>
            <p className="text-sm text-gray-700 mb-5">Bạn có chắc chắn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelDelete} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Hủy</button>
              <button type="button" onClick={confirmDeleteComment} className="px-4 py-2 rounded-lg bg-[#f44336] text-white hover:bg-[#e22d41]">Xóa</button>
            </div>
          </div>
        </div>
      )}

      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-xl tracking-tight">The Wanderer</Link>
        </div>
        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500">
          <Link to="/dashboard" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">Home</Link>
          <Link to="/explore" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Explore</Link>
          <Link to="/community" className="hover:text-gray-900 transition-colors h-[72px] flex items-center">Community</Link>
        </nav>
        <div className="w-1/4 flex items-center justify-end gap-5">
          <NotificationBell />
          
          {/* =========================================
              MENU BẠN BÈ VÀ LỜI MỜI
          ========================================= */}
          <div className="relative">
            <button 
              type="button" 
              onClick={() => {
                setIsFriendDropdownOpen(!isFriendDropdownOpen);
                if (!isFriendDropdownOpen) fetchFriendData(); // Fetch khi mở menu
              }} 
              className={`text-gray-500 hover:text-gray-900 transition-colors relative ${isFriendDropdownOpen ? 'text-[#f44336]' : ''}`}
            >
              <Users size={22} strokeWidth={2} />
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
            
            {isFriendDropdownOpen && (
              <div className="absolute right-0 top-10 w-[340px] bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden z-[110] animate-in slide-in-from-top-2 fade-in">
                {/* Thanh tìm kiếm */}
                <div className="p-3 border-b border-gray-100 bg-white">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Tìm kiếm bạn bè..."
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      className="w-full bg-[#f4f4f5] rounded-full py-2 pl-9 pr-4 text-[13px] outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="max-h-[350px] overflow-y-auto pb-4">
                  {friendSearchQuery.trim() !== '' ? (
                    /* KHI TÌM KIẾM */
                    <div className="px-2 pt-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Kết quả tìm kiếm</p>
                      {searchResults.length === 0 ? (
                        <p className="text-[13px] text-center text-gray-500 py-4">Không tìm thấy người dùng nào.</p>
                      ) : (
                        searchResults.map(user => {
                          const strUserId = String(user._id);
                          return (
                            <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                                <User size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[13px] text-gray-900 truncate">{user.username}</p>
                              </div>
                              <div className="shrink-0 flex items-center">
                                {friends.includes(strUserId) ? (
                                  <button onClick={() => { setIsFriendDropdownOpen(false); setIsUserChatOpen(true); setSelectedChatUser(user); setChatView('conversation'); }} className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200">Nhắn tin</button>
                                ) : sentRequests.includes(strUserId) ? (
                                  <button onClick={() => handleUndoRequest(user._id)} className="text-[11px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200"><Clock size={12}/> Hoàn tác</button>
                                ) : receivedRequests.includes(strUserId) ? (
                                  <button onClick={() => handleAcceptFriend(user._id)} className="text-[11px] font-bold text-white bg-[#f44336] px-3 py-1.5 rounded-full hover:bg-[#e22d41]">Chấp nhận</button>
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
                    /* LỜI MỜI & GỢI Ý */
                    <>
                      {receivedRequests.length > 0 && (
                        <div className="px-2 pt-3 pb-2 border-b border-gray-100">
                          <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest px-2 mb-2">Lời mời kết bạn mới</p>
                          {receivedRequests.map(reqId => {
                            const user = getUserById(reqId);
                            return (
                              <div key={reqId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                                  <User size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[13px] text-gray-900 truncate">{user.username}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => handleAcceptFriend(reqId)} className="w-8 h-8 rounded-full bg-[#f44336] text-white flex items-center justify-center hover:bg-[#e22d41] transition-colors"><Check size={16}/></button>
                                  <button onClick={() => handleDeclineFriend(reqId)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={16}/></button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="px-2 pt-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Gợi ý kết nối</p>
                        {recommendedUsers.length === 0 ? (
                          <p className="text-[12px] text-gray-400 text-center py-4">Bạn đã kết nối với tất cả mọi người!</p>
                        ) : (
                          recommendedUsers.map(user => {
                            const strUserId = String(user._id);
                            return (
                              <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                                  <User size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[13px] text-gray-900 truncate">{user.username}</p>
                                  <p className="text-[11px] text-gray-400 truncate">Có thể bạn quen</p>
                                </div>
                                <div className="shrink-0 flex items-center">
                                  {sentRequests.includes(strUserId) ? (
                                    <button onClick={() => handleUndoRequest(user._id)} className="text-[11px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-200"><Clock size={12}/> Hoàn tác</button>
                                  ) : (
                                    <button 
                                      onClick={() => handleAddFriend(user._id)}
                                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-[#f44336] rounded-full hover:bg-red-100 transition-colors shrink-0"
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

          <button 
            type="button" 
            onClick={() => { setIsUserChatOpen((prev) => !prev); if(!isUserChatOpen) setChatView('list'); }} 
            className={`text-gray-500 hover:text-gray-900 transition-colors ${isUserChatOpen ? 'text-[#f44336]' : ''}`}
          >
            <MessageSquare size={22} strokeWidth={2} />
          </button>
          
          <Link to="/profile" className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden cursor-pointer border border-gray-200">
            <img src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Me" className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>

      {/* =========================================
          WIDGET CHAT USER (CHỈ HIỂN THỊ BẠN BÈ)
      ========================================= */}
      {isUserChatOpen && (
        <div className="fixed right-6 top-[85px] z-[100] w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 h-[520px] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-[#f44336] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              {chatView === 'conversation' ? (
                <>
                  <button onClick={() => setChatView('list')} className="hover:bg-red-600 p-1 rounded-full transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <span className="font-bold text-[14px]">{selectedChatUser?.username || 'Trò chuyện'}</span>
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

          <div className="flex-1 overflow-y-auto bg-white flex flex-col">
            {chatView === 'list' ? (
              <div className="p-2 pb-4">
                {friends.length === 0 ? (
                  <div className="p-6 text-center text-[12px] text-gray-500">
                    <Users size={32} className="mx-auto text-gray-300 mb-3" />
                    Bạn chưa có bạn bè nào.<br/>Hãy tìm kiếm và kết bạn để bắt đầu trò chuyện nhé!
                  </div>
                ) : (
                  friends.map(friendId => {
                    const user = getUserById(friendId);
                    const lastMsgObj = userMessages[friendId]?.slice(-1)[0];
                    const lastMessage = lastMsgObj ? (lastMsgObj.sender === 'me' ? `Bạn: ${lastMsgObj.text}` : lastMsgObj.text) : 'Bắt đầu trò chuyện';

                    return (
                      <div key={user._id} onClick={() => { setSelectedChatUser(user); setChatView('conversation'); }} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 relative">
                          <User size={20} />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[13px] text-gray-900 truncate">{user.username}</p>
                          <p className="text-[12px] text-gray-500 truncate">{lastMessage}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="text-center text-[11px] text-gray-400 mb-4">Bắt đầu trò chuyện với {selectedChatUser?.username}</div>
                  
                  {currentChatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'them' && (
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 mr-2 self-end mb-1">
                          <User size={14} />
                        </div>
                      )}
                      <div className={`px-4 py-2 rounded-2xl max-w-[75%] text-[13px] ${msg.sender === 'me' ? 'bg-[#f44336] text-white rounded-br-sm' : 'bg-[#f4f4f5] text-gray-900 rounded-bl-sm border border-gray-100'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {currentChatMessages.length === 0 && (
                     <div className="flex justify-center text-[12px] text-gray-400 mt-4">
                       Hãy nói lời chào 👋
                     </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={userMessageInput}
                      onChange={(e) => setUserMessageInput(e.target.value)}
                      placeholder="Aa"
                      className="w-full bg-[#f4f4f5] rounded-full py-2 pl-4 pr-10 text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendUserMessage();
                      }}
                    />
                    <button
                      onClick={handleSendUserMessage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 rounded-full transition-colors"
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

      <main className="max-w-[1100px] mx-auto pt-8 px-4 flex gap-8 items-start">
        
        <div className="flex-1 max-w-[650px]">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <p className="text-[13px] font-black text-gray-900">Tạo bài viết mới</p>
                <p className="text-[11px] font-semibold text-gray-500">Chia sẻ ảnh, ghim map, kể lại trải nghiệm của bạn.</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-[#f44336]">
                Travel Feed
              </span>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <textarea 
                placeholder={currentUser.role === 'admin' ? "Phát thông báo hệ thống..." : "Chia sẻ địa điểm bạn vừa khám phá..."}
                className="w-full bg-[#f4f4f5] rounded-xl p-3.5 text-[14px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                rows="3"
                value={newPost.description}
                onChange={e => setNewPost({...newPost, description: e.target.value})}
              ></textarea>
            </div>

            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3 pl-12">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-gray-900/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            
            {showMapPicker && (
              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in fade-in duration-300 ml-12">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[12px] font-bold text-gray-500">📍 Click vào bản đồ để lấy tọa độ chính xác</p>
                  {pickedCoords && <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">[{pickedCoords.lat.toFixed(4)}, {pickedCoords.lng.toFixed(4)}]</span>}
                </div>
                <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-inner">
                  <RealMapPicker setPickedCoords={setPickedCoords} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMapPicker(!showMapPicker)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors select-none ${pickedCoords || showMapPicker ? 'bg-red-50 text-[#f44336]' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <MapPin size={16} strokeWidth={2.5} /> {pickedCoords ? 'Đã ghim vị trí' : 'Ghim vị trí'}
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors select-none cursor-pointer">
                  <ImageIcon size={16} strokeWidth={2.5} /> Tải ảnh lên
                </button>
              </div>
              <button type="button" onClick={handleQuickPost} disabled={isPosting} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold text-white transition-all shadow-md ${currentUser.role === 'admin' ? 'bg-gray-900 hover:bg-black' : 'bg-[#f44336] shadow-red-500/20 hover:bg-[#e53935]'} disabled:opacity-50`}>
                {isPosting ? <span>Đang tải...</span> : <span className="flex items-center gap-1.5"><Send size={16} /> Đăng Bài</span>}
              </button>
            </div>
          </div>

          <div className="space-y-6 pb-12">
            {Array.isArray(posts) && posts.map((post) => {
              const isAdmin = post.createdBy?.role === 'admin';
              const isOwner = Boolean(currentUser.userId) && String(post.createdBy?._id || '') === String(currentUser.userId);
              
              return (
                <div key={post._id || Math.random().toString()} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isAdmin ? 'border-red-200' : 'border-gray-100'}`}>
                  {isAdmin && (
                    <div className="bg-red-50 px-5 py-2.5 flex items-center gap-2 border-b border-red-100">
                      <ShieldAlert size={16} className="text-[#f44336]" />
                      <span className="text-[11px] font-black text-[#f44336] uppercase tracking-widest">Thông báo từ Ban Quản Trị</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer hover:ring-2 hover:ring-red-200 transition-all ${isAdmin ? 'border-[#f44336]' : 'border-transparent'}`}
                          onClick={() => {
                            if (post.createdBy && String(post.createdBy._id) !== String(currentUser.userId)) {
                              window.dispatchEvent(new CustomEvent('openChat', { detail: { userId: post.createdBy._id, username: post.createdBy.username } }));
                            }
                          }}
                        >
                          <img src={post.createdBy?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 
                            className="text-[14px] font-bold text-gray-900 flex items-center gap-1.5 cursor-pointer hover:underline"
                            onClick={() => {
                              if (post.createdBy && String(post.createdBy._id) !== String(currentUser.userId)) {
                                window.dispatchEvent(new CustomEvent('openChat', { detail: { userId: post.createdBy._id, username: post.createdBy.username } }));
                              }
                            }}
                          >
                            {post.createdBy?.username || "Ẩn danh"} 
                            {isAdmin && <CheckCircle size={14} className="text-[#f44336]" />}
                          </h3>
                          <p className="text-[11px] font-medium text-gray-400">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}
                          </p>
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
                        {openPostMenuId === post._id && (
                          <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleCopyPostLink(post._id)}
                              className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                              Copy link bài viết
                            </button>
                            {(isOwner || currentUser.role === 'admin') && (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                Xóa bài viết
                              </button>
                            )}
                            {currentUser.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                              >
                                {post.isHidden ? 'Hiện bài viết' : 'Ẩn bài viết'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {post.description && typeof post.description === 'string' && post.description !== '\u200B' && (
                      <p className="text-[14px] text-gray-800 font-medium leading-relaxed mb-4 whitespace-pre-wrap">{post.description}</p>
                    )}

                    {post.lat && post.lng && (
                      <div className="mb-4">
                        <button type="button" onClick={() => setExpandedMap(prev => ({ ...prev, [post._id]: !prev[post._id] }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 text-[#f44336] border-transparent hover:bg-red-100'}`}>
                          <MapPin size={16} /> 
                          {typeof post.location === 'string' && post.location !== 'Chưa xác định' ? post.location : "Vị trí được ghim"}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ml-2 transition-colors ${expandedMap[post._id] ? 'bg-black/20 text-white' : 'bg-white text-[#f44336] shadow-sm'}`}>
                            {expandedMap[post._id] ? 'Đóng Bản đồ' : '📍 Xem Map'}
                          </span>
                        </button>
                        {expandedMap[post._id] && (
                          <div className="mt-3 h-[250px] w-full border border-gray-200 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
                            <RealMapViewer lat={post.lat} lng={post.lng} role={post.createdBy?.role} location={post.location} />
                          </div>
                        )}
                      </div>
                    )}

                    {Array.isArray(post.images) && post.images.length > 0 && (() => {
                      const normalizedImages = post.images.map((img) => getPostImageUrl(img)).filter(Boolean);
                      if (normalizedImages.length === 0) return null;
                      return (
                        <div className="mb-4 space-y-2">
                          <img
                            src={normalizedImages[0]}
                            alt="media-main"
                            className="w-full rounded-2xl object-cover border border-gray-100 max-h-[420px]"
                          />
                          {normalizedImages.length > 1 && (
                            <div className="grid grid-cols-2 gap-2">
                              {normalizedImages.slice(1).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`media-${idx + 1}`}
                                  className="w-full h-[150px] rounded-xl object-cover border border-gray-100"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
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
                        <MessageSquare size={20} strokeWidth={2.5} /> {post.totalReviews || 'Bình luận'}
                      </button>
                      <SavePostButton postId={post._id} postImage={post.images?.[0]} />
                      <button type="button" onClick={() => handleCopyPostLink(post._id)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-[13px] font-bold ml-auto">
                        <Share2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>

                    {expandedComments[post._id] && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in duration-300">
                        <div className="flex gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                            <img src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 relative">
                            <input 
                              type="text" 
                              placeholder="Viết bình luận..." 
                              className="w-full bg-[#f4f4f5] rounded-full py-2 pl-4 pr-10 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
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
                                    <img src={comment.author?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="avt" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100" />
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
                                            <button onClick={cancelEditComment} className="text-gray-600 hover:text-gray-900 text-[12px] font-semibold">Hủy</button>
                                            <button onClick={() => saveEditComment(post._id, comment._id)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">Lưu</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-[#f4f4f5] px-4 py-2.5 rounded-2xl rounded-tl-none inline-block">
                                          <p className="font-bold text-gray-900 mb-0.5 text-[12px]">{comment.author?.username}</p>
                                          <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                        <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                        <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: null })}>Phản hồi</button>
                                        {isCommentAuthor && (
                                          <>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(comment._id, comment.content)}>Sửa</button>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, comment._id)}>Xóa</button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                  <div className="mt-3 ml-[44px] space-y-4 border-l-2 border-gray-100 pl-4 relative">
                                    {comment.replies.map((reply) => (
                                      <div key={reply._id || Math.random().toString()} className="flex gap-2">
                                        <img src={reply.author?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="avt" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="bg-white border border-gray-100 shadow-sm px-3 py-2 rounded-2xl rounded-tl-none inline-block">
                                            <p className="font-bold text-gray-900 mb-0.5 text-[12px]">{reply.author?.username}</p>
                                            {editingCommentId === reply._id ? (
                                              <div>
                                                <textarea
                                                  value={editingCommentContent}
                                                  onChange={(e) => setEditingCommentContent(e.target.value)}
                                                  className="w-full min-h-[70px] resize-none p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f44336]/40 outline-none text-[13px]"
                                                  rows={3}
                                                />
                                                <div className="mt-2 flex justify-between items-center">
                                                  <button onClick={cancelEditComment} className="text-gray-600 hover:text-gray-900 text-[12px] font-semibold">Hủy</button>
                                                  <button onClick={() => saveEditComment(post._id, reply._id)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">Lưu</button>
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
                                            <span>{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: reply.author?.username })}>Phản hồi</button>
                                            {reply.author?._id?.toString() === currentUser.userId && (
                                              <>
                                                <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(reply._id, reply.content)}>Sửa</button>
                                                <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, reply._id)}>Xóa</button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {replyingTo.parentId === comment._id && (
                                  <div className="mt-3 ml-[44px] flex gap-2 animate-in slide-in-from-top-1 fade-in">
                                    <CornerDownRight size={16} className="text-gray-300 mt-2 flex-shrink-0" />
                                    <div className="flex-1 relative">
                                      <input 
                                        type="text" autoFocus placeholder={replyingTo.childUsername ? `Đang phản hồi @${replyingTo.childUsername}...` : `Phản hồi ${comment.author?.username}...`}
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
                                )}
                              </div>
                            )})}
                            {(!commentsData[post._id] || commentsData[post._id].length === 0) && (
                              <div className="text-center py-6 text-gray-400 text-[13px] font-bold">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="w-[320px] hidden lg:block flex-shrink-0 space-y-6 sticky top-[104px]">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4">📍 Địa điểm Đang Hot</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-wider mb-0.5">Biển</p>
                <p onClick={() => showToast('success', 'Đã lưu vào danh sách xem sau: Bãi Sao')} className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline">Bãi Sao, Phú Quốc</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#00897b] uppercase tracking-wider mb-0.5">Văn Hóa</p>
                <p onClick={() => showToast('success', 'Đã thêm Phố cổ Hội An vào Gợi ý')} className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline">Phố cổ Hội An</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4">✨ Gợi ý nhanh</h3>
            <div className="space-y-2">
              <button type="button" onClick={() => { setIsAiChatOpen(true); setAiChatInput('Gợi ý lịch trình Đà Nẵng 2 ngày 1 đêm'); }} className="w-full text-left text-[12px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2">
                Lịch trình Đà Nẵng 2N1Đ
              </button>
              <button type="button" onClick={() => { setIsAiChatOpen(true); setAiChatInput('Gợi ý món ăn ngon ở Huế'); }} className="w-full text-left text-[12px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2">
                Ăn gì ở Huế?
              </button>
              <button type="button" onClick={() => { setIsAiChatOpen(true); setAiChatInput('Điểm check-in đẹp ở Hội An buổi tối'); }} className="w-full text-left text-[12px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2">
                Check-in Hội An buổi tối
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#ef4444] to-[#f97316] p-5 rounded-2xl shadow-sm text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">Travel Tip</p>
            <p className="text-[13px] font-bold leading-relaxed">
              Đăng bài có ảnh thật + tọa độ ghim sẽ giúp bài nổi bật hơn và dễ được cộng đồng tương tác.
            </p>
          </div>
        </aside>

      </main>

      {/* WIDGET TRỢ LÝ AI */}
      <button
        type="button"
        onClick={() => setIsAiChatOpen((prev) => !prev)}
        className="fixed right-6 bottom-6 z-[101] bg-[#f44336] text-white w-14 h-14 rounded-full shadow-xl shadow-red-500/30 hover:bg-[#e53935] flex items-center justify-center"
      >
        <Bot size={24} />
      </button>

      {isAiChatOpen && (
        <div className="fixed right-6 bottom-24 z-[101] w-[340px] bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-black text-gray-900">AI Tư vấn địa điểm</h3>
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
            {isAiChatLoading && (
              <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-md px-3 py-2 text-[13px] font-medium inline-block">
                Đang tư vấn...
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiChat()}
              placeholder="Ví dụ: Gợi ý lịch trình Đà Lạt 2 ngày"
              className="flex-1 bg-[#f4f4f5] rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20"
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
      )}
    </div>
  );
}

// Bọc Router
export default function Dashboard() {
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  if (!hasRouter) return <MemoryRouter><DashboardContent /></MemoryRouter>;
  return <DashboardContent />;
}