import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useInRouterContext } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Bell, MessageSquare, Compass, Settings, 
  MapPin, Image as ImageIcon, Send, ShieldAlert,
  Heart, Share2, MoreHorizontal, CheckCircle, X, Info, CornerDownRight, Loader2, Bot,
  ArrowLeft, User, Bookmark, Users, UserPlus, Check, Search, Clock, TrendingUp, Trash2,
  Sun, Moon
} from 'lucide-react';

const getAvatarUrl = (url, name) => {
  return url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

const SavePostButton = ({ postId, initialIsSaved, onToggleSave }) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  
  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleSave = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/save-post/${postId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.isSaved);
        if(onToggleSave) onToggleSave(postId, data.isSaved);
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
        script.onerror = () => reject(new Error('Không tải được Leaflet'));
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
    { role: 'ai', content: 'Xin chào! Mình là trợ lý du lịch 🤖 Bạn muốn đi đâu cuối tuần này?' }
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
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [typingInfo, setTypingInfo] = useState(null); // { username }

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

    if (notif.type === 'message' && notif.sender) {
      setIsUserChatOpen(true);
      setIsFriendDropdownOpen(false);
      setSelectedChatUser(notif.sender);
      setChatView('conversation');
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

        // Sau khi lấy history, tự động đánh dấu đã xem
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
          setSavedPostsSet(new Set(data.map(p => p._id)));
        }
      }
    } catch (error) {}
  };

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
      fetchNotifications();
      fetchConversations();
    }

    const handleOpenChat = (e) => {
      setIsUserChatOpen(true);
      setIsFriendDropdownOpen(false);
      setIsNotificationOpen(false);
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

  // ── SOCKET.IO REAL-TIME CHAT ──────────────────────────────
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    socketRef.current = socket;

    // Đăng ký user online
    socket.emit('user_online', userId);

    // Nhận tin nhắn thời gian thực
    socket.on('receive_message', (data) => {
      console.log('SOCKET RECEIVE:', data);
      const { conversationId, text, image, readBy, sender, createdAt } = data;
      const currentUserId = localStorage.getItem('userId');
      const isMine = String(sender._id || sender) === String(currentUserId);
      
      console.log('SOCKET PROCESS:', { isMine, currentUserId, senderId: sender._id || sender });

      const msgObj = {
        sender: isMine ? 'me' : 'them',
        text,
        image,
        readBy: readBy || [],
        senderName: sender.username,
        senderAvatar: sender.avatar,
        senderId: sender._id || sender,
        createdAt
      };

      setUserMessages(prev => {
        const existing = prev[conversationId] || [];
        console.log('UPDATING STATE for conv:', conversationId, 'Existing count:', existing.length);
        
        // Tránh duplicate tin nhắn vừa gửi
        const isDuplicate = existing.some(m => 
          m.text === text && 
          m.sender === (isMine ? 'me' : 'them') && 
          Math.abs(new Date(m.createdAt || Date.now()) - new Date(createdAt)) < 2000
        );
        
        if (isDuplicate) {
          console.log('DUPLICATE DETECTED, SKIPPING');
          return prev;
        }
        
        const newState = { ...prev, [conversationId]: [...existing, msgObj] };
        console.log('NEW STATE KEYS:', Object.keys(newState));
        return newState;
      });

      // Nếu đang mở chính cuộc hội thoại này, tự động đánh dấu đã xem
      if (currentConversationId === conversationId) {
        markAsSeen(conversationId);
      }
    });

    // Nhận sự kiện đã xem tin nhắn
    socket.on('message_seen', ({ conversationId, userId }) => {
      setUserMessages(prev => {
        const messages = prev[conversationId] || [];
        const updated = messages.map(m => {
          const currentReadBy = m.readBy || [];
          if (!currentReadBy.includes(userId)) {
            return { ...m, readBy: [...currentReadBy, userId] };
          }
          return m;
        });
        return { ...prev, [conversationId]: updated };
      });
    });

    // Typing indicators
    socket.on('user_typing', ({ username }) => {
      setTypingInfo({ username });
    });
    socket.on('user_stop_typing', () => {
      setTypingInfo(null);
    });

    // Nhận thông báo thời gian thực
    socket.on(`notification_${userId}`, (newNotif) => {
      console.log('REALTIME NOTIFICATION:', newNotif);
      setNotifications(prev => [newNotif, ...prev]);
      // Hiển thị toast nhẹ nếu đang không mở thông báo
      if (!isNotificationOpen) {
        showToast('info', `${newNotif.sender.username} ${newNotif.content}`);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join room khi mở conversation
  useEffect(() => {
    if (!socketRef.current) return;
    if (currentConversationId) {
      socketRef.current.emit('join_room', currentConversationId);
    }
  }, [currentConversationId]);

  // Dark Mode side effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const showToast = (type, text) => {
    setNotification({ type, text: String(text) });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

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
    setIsPosting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập để đăng bài.');
      }
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
        showToast('success', 'Đã xóa cuộc trò chuyện');
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
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Xác nhận xóa bình luận</h3>
            <p className="text-sm text-gray-700 mb-5">Bạn có chắc chắn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelDelete} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">Hủy</button>
              <button type="button" onClick={confirmDeleteComment} className="px-4 py-2 rounded-lg bg-[#f44336] text-white hover:bg-[#e22d41]">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`h-[72px] border-b flex items-center justify-between px-6 z-[100] shadow-sm sticky top-0 transition-colors duration-300
        ${isDarkMode ? 'bg-[#1e293b]/80 backdrop-blur-md border-gray-700' : 'bg-white/80 backdrop-blur-md border-gray-100'}`}>
        <div className="w-1/4">
          <Link to="/dashboard" className="text-[#f44336] font-extrabold text-2xl tracking-tighter hover:opacity-80 transition-opacity">The Wanderer</Link>
        </div>
        
        <nav className={`flex-1 flex justify-center items-center gap-10 text-[15px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Link to="/dashboard" className="text-[#f44336] border-b-[3px] border-[#f44336] h-[72px] flex items-center">Home</Link>
          <Link to="/explore" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">Explore</Link>
          <Link to="/community" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">Community</Link>
          <Link to="/friends" className="hover:text-[#f44336] transition-colors h-[72px] flex items-center">Friends</Link>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-4">
          <div className="relative w-full max-w-[200px] hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm mọi thứ..." 
              className={`w-full pl-9 pr-3 py-2 rounded-full text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all
                ${isDarkMode ? 'bg-gray-800 border-transparent text-white' : 'bg-[#f4f4f5] border-transparent'}`}
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsFriendDropdownOpen(false);
                setIsUserChatOpen(false);
                if (!isNotificationOpen) fetchNotifications();
              }}
              className={`relative transition-colors ${isNotificationOpen ? 'text-[#f44336]' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Bell size={22} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#f44336] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {displayBadgeCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-12 w-[340px] bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden z-[130] animate-in slide-in-from-top-2 fade-in">
                <div className={`px-4 py-3 border-b flex justify-between items-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className={`font-bold text-[14px] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Thông báo</h3>
                  {unreadCount > 0 ? (
                    <button 
                      onClick={handleMarkAllAsRead} 
                      className="text-[11px] font-semibold text-[#f44336] hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  ) : null}
                </div>
                <div className={`max-h-[350px] overflow-y-auto ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[12px] text-gray-500">
                      Không có thông báo mới.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => handleReadNotification(notif)}
                        className={`flex items-start gap-3 p-3 border-b cursor-pointer transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-50 hover:bg-gray-50'} ${!notif.isRead ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/30') : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`} onClick={(e) => { e.stopPropagation(); handleNavigateProfile(notif.sender?._id); }}>
                          {notif.sender?.avatar ? <img src={notif.sender.avatar} className="w-full h-full object-cover"/> : <User size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                            <span onClick={(e) => { e.stopPropagation(); handleNavigateProfile(notif.sender?._id); }} className={`font-bold mr-1 hover:underline ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{notif.sender?.username}</span>
                            {notif.content}
                          </p>
                          <p className="text-[11px] text-[#f44336] font-medium mt-1">Vừa xong</p>
                        </div>
                        {!notif.isRead && <div className="w-2.5 h-2.5 bg-[#f44336] rounded-full shrink-0 mt-1.5 shadow-sm"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              type="button" 
              onClick={() => {
                setIsFriendDropdownOpen(!isFriendDropdownOpen);
                setIsNotificationOpen(false); 
                setIsUserChatOpen(false);
                if (!isFriendDropdownOpen) fetchFriendData(); 
              }} 
              className={`text-gray-500 hover:text-gray-900 transition-colors relative ${isFriendDropdownOpen ? 'text-[#f44336]' : ''}`}
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
                      placeholder="Tìm kiếm bạn bè..."
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      className={`w-full rounded-full py-2 pl-9 pr-4 text-[13px] outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-[#f4f4f5] text-gray-900'}`}
                    />
                  </div>
                </div>

                <div className="max-h-[350px] overflow-y-auto pb-4">
                  {friendSearchQuery.trim() !== '' ? (
                    <div className="px-2 pt-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Kết quả tìm kiếm</p>
                      {searchResults.length === 0 ? (
                        <p className="text-[13px] text-center text-gray-500 py-4">Không tìm thấy người dùng nào.</p>
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
                    <>
                      {receivedRequests.length > 0 ? (
                        <div className="px-2 pt-3 pb-2 border-b border-gray-100">
                          <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest px-2 mb-2">Lời mời kết bạn mới</p>
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
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Gợi ý kết nối</p>
                        {recommendedUsers.length === 0 ? (
                          <p className="text-[12px] text-gray-400 text-center py-4">Bạn đã kết nối với tất cả mọi người!</p>
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
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}
            title="Chuyển chế độ tối/sáng"
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          <button 
            type="button" 
            onClick={() => { 
              setIsUserChatOpen((prev) => !prev); 
              setIsFriendDropdownOpen(false);
              setIsNotificationOpen(false);
              if(!isUserChatOpen) setChatView('list'); 
            }} 
            className={`text-gray-500 hover:text-gray-900 transition-colors ${isUserChatOpen ? 'text-[#f44336]' : ''}`}
          >
            <MessageSquare size={22} strokeWidth={2} />
          </button>
          
          <button onClick={() => navigate('/profile')} className="block cursor-pointer hover:opacity-80 transition-opacity">
            <img 
              src={getAvatarUrl(localStorage.getItem('avatar'), localStorage.getItem('username'))} 
              className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              alt="Profile"
            />
          </button>
        </div>
      </header>

      {}
      {isUserChatOpen && (
        <div className="fixed right-6 top-[85px] z-[120] w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 h-[520px] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-[#f44336] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              {chatView === 'conversation' ? (
                <>
                  <button onClick={() => { setChatView('list'); setIsChatOptionsOpen(false); }} className="hover:bg-red-600 p-1 rounded-full transition-colors">
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
            <div className="flex items-center gap-1">
              {chatView === 'conversation' && (
                <div className="relative">
                  <button 
                    onClick={() => setIsChatOptionsOpen(!isChatOptionsOpen)}
                    className="hover:bg-red-600 p-1 rounded-full transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {isChatOptionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[130] text-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={() => { setIsChatOptionsOpen(false); handleDeleteConversation(); }}
                        className="w-full text-left px-4 py-2 text-[12px] font-bold hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 size={14} /> Xóa cuộc trò chuyện
                      </button>
                      {selectedChatUser && (
                        <button 
                          onClick={() => { setIsChatOptionsOpen(false); handleBlockUser(); }}
                          className="w-full text-left px-4 py-2 text-[12px] font-bold hover:bg-gray-50 flex items-center gap-2 text-red-600 border-t border-gray-50"
                        >
                          <ShieldAlert size={14} /> Chặn người dùng
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => { setIsUserChatOpen(false); setIsChatOptionsOpen(false); }} className="hover:bg-red-600 p-1 rounded-full transition-colors"><X size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white flex flex-col">
            {chatView === 'list' ? (
              <div className="p-2 pb-4 flex flex-col h-full overflow-hidden">
                <div className="px-2 mb-3 space-y-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Tìm kiếm bạn bè hoặc nhóm..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full bg-[#f4f4f5] rounded-full py-1.5 pl-9 pr-4 text-[12px] outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all"
                    />
                  </div>
                  <button onClick={() => setIsCreateGroupOpen(true)} className="w-full bg-red-50 text-[#f44336] text-[12px] font-bold py-2 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                    <Users size={16} /> Tạo nhóm chat
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-1">
                  {chatSearchQuery.trim() === '' ? (
                    <>
                      {conversationsList.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Cuộc trò chuyện</p>
                          {conversationsList.map(conv => {
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
                                      setCurrentConversationId(conv._id);
                                  } else {
                                      setSelectedGroup(null);
                                      setSelectedChatUser(otherUser);
                                      setCurrentConversationId(conv._id);
                                  }
                                  setChatView('conversation'); 
                                }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 relative overflow-hidden">
                                  {isGroup ? <Users size={18} /> : (displayAvatar ? <img src={displayAvatar} className="w-full h-full object-cover"/> : <User size={18} />)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[12px] text-gray-900 truncate">{displayName}</p>
                                  <p className="text-[11px] text-gray-500 truncate">{lastMessage}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Bạn bè</p>
                        {friends.length === 0 ? (
                          <p className="text-[11px] text-gray-400 text-center py-4 px-2 italic">Hãy kết thêm bạn để bắt đầu trò chuyện!</p>
                        ) : (
                          allUsers.filter(u => friends.includes(String(u._id))).map(friend => (
                            <div key={friend._id} onClick={() => { 
                                setSelectedGroup(null);
                                setSelectedChatUser(friend);
                                setCurrentConversationId(null);
                                setChatView('conversation'); 
                              }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 relative overflow-hidden">
                                {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover"/> : <User size={18} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[12px] text-gray-900 truncate">{friend.username}</p>
                                <p className="text-[11px] text-gray-400 truncate">Nhấn để nhắn tin</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-widest px-2 mb-2">Kết quả tìm kiếm</p>
                        {allUsers.filter(u => 
                          friends.includes(String(u._id)) && 
                          u.username.toLowerCase().includes(chatSearchQuery.toLowerCase())
                        ).map(friend => (
                          <div key={friend._id} onClick={() => { 
                              setSelectedGroup(null);
                              setSelectedChatUser(friend);
                              setCurrentConversationId(null);
                              setChatView('conversation'); 
                              setChatSearchQuery('');
                            }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 relative overflow-hidden">
                              {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover"/> : <User size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[12px] text-gray-900 truncate">{friend.username}</p>
                              <p className="text-[11px] text-gray-400 truncate">Bạn bè</p>
                            </div>
                          </div>
                        ))}
                        {conversationsList.filter(conv => 
                          conv.isGroup && conv.groupName.toLowerCase().includes(chatSearchQuery.toLowerCase())
                        ).map(conv => (
                          <div key={conv._id} onClick={() => { 
                              setSelectedGroup(conv);
                              setSelectedChatUser(null);
                              setCurrentConversationId(conv._id);
                              setChatView('conversation'); 
                              setChatSearchQuery('');
                            }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 relative overflow-hidden">
                              <Users size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[12px] text-gray-900 truncate">{conv.groupName}</p>
                              <p className="text-[11px] text-gray-400 truncate">Nhóm chat</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {isChatLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#f44336]" /></div>
                  ) : (
                    <>
                      <div className="text-center text-[11px] text-gray-400 mb-4">
                        {selectedGroup ? `Bắt đầu trò chuyện trong ${selectedGroup.groupName}` : `Bắt đầu trò chuyện với ${selectedChatUser?.username}`}
                      </div>
                      
                      {currentChatMessages.map((msg, i) => {
                        const isMe = msg.sender === 'me';
                        return (
                          <div key={i} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div className="flex max-w-[80%] items-end gap-2">
                              {/* Avatar for receiver side (others) */}
                              {!isMe && (
                                <div 
                                  onClick={() => !selectedGroup && handleNavigateProfile(msg.senderId)} 
                                  className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gray-100 mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                  {msg.senderAvatar ? (
                                    <img src={msg.senderAvatar} className="w-full h-full object-cover" alt="avt"/>
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                      <User size={14} />
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {/* Name for Group Chat on receiver side */}
                                {!isMe && selectedGroup && (
                                  <span className="text-[10px] text-gray-400 ml-1 mb-0.5">{msg.senderName}</span>
                                )}
                                
                                <div className={`px-4 py-2 text-[13px] font-medium shadow-sm flex flex-col gap-2
                                  ${isMe 
                                    ? 'bg-[#f44336] text-white rounded-2xl rounded-br-none' 
                                    : 'bg-[#f4f4f5] text-gray-800 rounded-2xl rounded-bl-none border border-gray-100'
                                  }`}
                                >
                                  {msg.image && (
                                    <div className="w-full max-w-[200px] rounded-lg overflow-hidden border border-white/20">
                                      <img src={msg.image} className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(msg.image, '_blank')} />
                                    </div>
                                  )}
                                  {msg.text && <div>{msg.text}</div>}
                                </div>
                                
                                {isMe && i === currentChatMessages.length - 1 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {msg.readBy && msg.readBy.length > 1 ? (
                                      <span className="text-[10px] text-gray-400 font-bold">Đã xem</span>
                                    ) : (
                                      <span className="text-[10px] text-gray-300 font-medium">Đã gửi</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {currentChatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 opacity-40">
                          <MessageSquare size={48} className="text-gray-300 mb-2" />
                          <p className="text-[12px] font-bold text-gray-500">Hãy nói lời chào 👋</p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                  {typingInfo && (
                    <p className="text-[11px] text-gray-400 font-medium px-1 pb-1 animate-pulse">
                      ✏️ {typingInfo.username} đang gõ...
                    </p>
                  )}
                  {chatImageFile && (
                    <div className="mb-2 p-2 bg-gray-50 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                        <img src={URL.createObjectURL(chatImageFile)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-gray-600 truncate">{chatImageFile.name}</p>
                        <p className="text-[10px] text-gray-400">Sẵn sàng gửi</p>
                      </div>
                      <button onClick={() => setChatImageFile(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      id="chat-image" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setChatImageFile(e.target.files[0])}
                    />
                    <label htmlFor="chat-image" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer transition-colors">
                      <ImageIcon size={20} />
                    </label>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={userMessageInput}
                        onChange={handleChatInputChange}
                        placeholder={isUploadingImage ? "Đang tải ảnh..." : "Aa"}
                        disabled={isUploadingImage}
                        className="w-full bg-[#f4f4f5] rounded-full py-2 pl-4 pr-10 text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#f44336]/20 transition-all disabled:opacity-50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendUserMessage();
                        }}
                      />
                      <button
                        onClick={handleSendUserMessage}
                        disabled={isUploadingImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

                        <main className="max-w-[1200px] mx-auto pt-8 px-6 flex gap-8 items-start">
        
        <div className="flex-1 max-w-[720px]">
          <div className={`${isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-5 shadow-sm border mb-8 transition-colors duration-300`}>
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <p className={`text-[13px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tạo bài viết mới</p>
                <p className={`text-[11px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chia sẻ ảnh, ghim map, kể lại trải nghiệm của bạn.</p>
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
                placeholder={currentUser.role === 'admin' ? "Phát thông báo hệ thống..." : "Chia sẻ địa điểm bạn vừa khám phá..."}
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
                  <p className="text-[12px] font-bold text-gray-500">📍 Click vào bản đồ để lấy tọa độ chính xác</p>
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

          {/* TRENDING CAROUSEL */}
          {trendingPosts.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-black text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#f44336]" /> Đang thịnh hành
                </h2>
                <button onClick={() => navigate('/trending')} className="text-[13px] font-bold text-[#f44336] hover:underline">
                  Xem tất cả
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
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">Không có ảnh</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm flex items-center gap-1">
                      <span className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-700'}>TOP {index + 1}</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-[10px] font-bold text-white/90 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded border border-white/20 uppercase tracking-wider mb-2 inline-block">
                        {post.category || 'Khám phá'}
                      </span>
                      <h3 className="text-[14px] font-black text-white leading-tight mb-2 line-clamp-2 drop-shadow-md group-hover:text-red-100 transition-colors">
                        {post.title || post.location || 'Chưa rõ'}
                      </h3>
                      <div className="flex items-center gap-2 mt-auto">
                        <img src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.username)} className="w-5 h-5 rounded-full border border-white/50" alt="Avatar"/>
                        <span className="text-[11px] font-bold text-white/90 truncate">{post.createdBy?.username || 'Ẩn danh'}</span>
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
                      <span className="text-[11px] font-black text-[#f44336] uppercase tracking-widest">Thông báo từ Ban Quản Trị</span>
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
                              {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''}
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
                              Copy link bài viết
                            </button>
                            {(isOwner || currentUser.role === 'admin') ? (
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                Xóa bài viết
                              </button>
                            ) : null}
                            {currentUser.role === 'admin' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(post._id)}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                              >
                                {post.isHidden ? 'Hiện bài viết' : 'Ẩn bài viết'}
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
                          {typeof post.location === 'string' && post.location !== 'Chưa xác định' ? post.location : "Vị trí được ghim"}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ml-2 transition-colors ${expandedMap[post._id] ? 'bg-black/20 text-white' : 'bg-white text-[#f44336] shadow-sm'}`}>
                            {expandedMap[post._id] ? 'Đóng Bản đồ' : '📍 Xem Map'}
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
                        <MessageSquare size={20} strokeWidth={2.5} /> {post.totalReviews || 'Bình luận'}
                      </button>
                      <SavePostButton postId={post._id} initialIsSaved={savedPostsSet.has(post._id)} />
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
                              placeholder="Viết bình luận..." 
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
                                            <button onClick={cancelEditComment} className="text-gray-600 hover:text-gray-900 text-[12px] font-semibold">Hủy</button>
                                            <button onClick={() => saveEditComment(post._id, comment._id)} className="bg-[#f44336] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#e22d41]">Lưu</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-[#f4f4f5] px-4 py-2.5 rounded-2xl rounded-tl-none inline-block">
                                          <p onClick={() => handleNavigateProfile(comment.author?._id)} className="font-bold text-gray-900 mb-0.5 text-[12px] cursor-pointer hover:underline">{comment.author?.username}</p>
                                          <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                      )}

                                      <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-bold text-gray-500">
                                        <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                        <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => setReplyingTo({ parentId: comment._id, childUsername: null })}>Phản hồi</button>
                                        {isCommentAuthor ? (
                                          <>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(comment._id, comment.content)}>Sửa</button>
                                            <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, comment._id)}>Xóa</button>
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
                                              {reply.author?._id?.toString() === currentUser.userId ? (
                                                <>
                                                  <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => startEditComment(reply._id, reply.content)}>Sửa</button>
                                                  <button type="button" className="hover:text-[#f44336] transition-colors" onClick={() => showDeleteConfirm(post._id, reply._id)}>Xóa</button>
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
                                  ) : null}
                                </div>
                              )})}
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

        {}
        <aside className="w-[320px] hidden lg:block flex-shrink-0 space-y-6 sticky top-[104px]">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-4">📍 Địa điểm Đang Hot</h3>
            <div className="space-y-4">
              {trendingPosts.length === 0 ? (
                <p className="text-[12px] font-medium text-gray-400 text-center py-2">Chưa có dữ liệu</p>
              ) : (
                trendingPosts.map((trendingPost) => (
                  <div key={trendingPost._id}>
                    <p className="text-[10px] font-bold text-[#f44336] uppercase tracking-wider mb-0.5">
                      {trendingPost.category || 'Khám phá'}
                    </p>
                    <p 
                      onClick={() => {
                        navigate(`/post-detail?postId=${trendingPost._id}`);
                      }} 
                      className="text-[13px] font-bold text-gray-900 leading-tight cursor-pointer hover:underline"
                    >
                      {trendingPost.title || trendingPost.location || 'Chưa rõ vị trí'}
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                      <Heart size={12} className="text-[#f44336]" fill="#f44336" /> {trendingPost.likeCount || 0} lượt thích
                    </p>
                  </div>
                ))
              )}
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
            {isAiChatLoading ? (
              <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-md px-3 py-2 text-[13px] font-medium inline-block">
                Đang tư vấn...
              </div>
            ) : null}
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
      ) : null}
    </div>
  );
}

export default DashboardContent;