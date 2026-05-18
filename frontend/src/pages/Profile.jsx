import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, BrowserRouter, useInRouterContext, Link, useLocation } from 'react-router-dom'; 
import { 
  Bell, MessageSquare, Home, Compass, TrendingUp, 
  Bookmark, Settings, MoreHorizontal, ArrowUp, 
  ArrowDown, Share2, FolderHeart, Trash2, Loader2, MapPin, Edit3, X, Camera,
  ShieldAlert, Image as ImageIcon, CheckCircle, Heart, Send, Maximize2, UserPlus, UserMinus, Clock, Copy
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AccountMenu from '../components/AccountMenu';
import NotificationBell from '../components/NotificationBell';
import SavePostButton from '../components/SavePostButton';

const copy = {
  vi: {
    posts: 'Bài viết',
    media: 'Hình ảnh',
    about: 'Giới thiệu',
    map: 'Bản đồ',
    home: 'Trang chủ',
    explore: 'Khám phá',
    trending: 'Xu hướng',
    saved: 'Đã lưu',
    settings: 'Cài đặt',
    editProfile: 'Chỉnh sửa hồ sơ',
    traveler: 'Người du hành',
    followers: 'Người theo dõi',
    following: 'Đang theo dõi',
    trendingKeywords: 'Từ khóa xu hướng',
    suggestedForYou: 'Gợi ý cho bạn',
    mentions: 'lượt thích',
    follow: 'Theo dõi',
    coverAlt: 'Ảnh bìa',
  },
};

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 75%, 50%)`;
};

const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanUrl = url.replace(/\\/g, '/');
  return `http://localhost:5000/${cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl}`;
};

const getPostImageUrl = (img) => {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object') return img.url || img.path || '';
  return '';
};

const getAvatarUrl = (url, name) => {
  return getImageUrl(url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

let leafletAssetsPromise = null;
const loadLeafletAssets = async () => {
  if (window.L) return;
  if (!leafletAssetsPromise) {
    leafletAssetsPromise = new Promise((resolve, reject) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      }
      if (window.L) return resolve();
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script'); script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.onload = resolve; script.onerror = () => reject(new Error('Không tải được Leaflet')); document.head.appendChild(script);
      }
    });
  }
  await leafletAssetsPromise;
};

function ProfileMap({ posts, username }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      await loadLeafletAssets();
      if (isMounted && mapRef.current && window.L && !mapInstance.current) {
        const L = window.L;
        const map = L.map(mapRef.current).setView([16.0, 108.0], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

        const userColor = stringToColor(username || 'user');
        const bounds = [];

        posts.filter(Boolean).forEach(post => {
          if (post.lat && post.lng) {
            bounds.push([post.lat, post.lng]);
            const customIcon = L.divIcon({
              className: 'custom-pin',
              html: `<div style="background-color: ${userColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 2px 2px 6px rgba(0,0,0,0.4);"></div>`,
              iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -26]
            });
            const marker = L.marker([post.lat, post.lng], { icon: customIcon }).addTo(map);
            marker.bindPopup(`
              <div style="min-width: 180px; font-family: sans-serif;">
                <span style="font-size: 10px; font-weight: bold; background: #f3f4f6; color: ${userColor}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                  ${post.category || 'Địa điểm'}
                </span>
                <h4 style="margin: 8px 0 4px 0; font-size: 15px; font-weight: 900; color: #111827;">${post.title || post.location}</h4>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563; line-height: 1.4;">${post.description}</p>
              </div>
            `);
          }
        });

        if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
        mapInstance.current = map;
      }
    };
    loadMap();
    return () => { isMounted = false; if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [posts, username]);

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner relative z-0">
      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
}

function RealMapViewer({ lat, lng, location }) {
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
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        const popupText = typeof location === 'string' && location !== 'Chưa xác định' ? location : 'Vị trí được ghim';
        L.marker([lat, lng], { icon: defaultIcon }).addTo(map).bindPopup(`<b>${popupText}</b>`);
        mapInstance.current = map;
        setIsMapReady(true);
      }
    };
    loadMap().catch(() => setIsMapReady(false));
    return () => { isMounted = false; if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [lat, lng, location]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-[12px] font-bold text-gray-500 dark:text-slate-400">Đang tải bản đồ...</div>
      )}
    </div>
  );
}

function ProfileContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = copy[language] || copy.vi;
  
  const myUserId = localStorage.getItem('userId');
  const targetUserId = location.state?.targetUserId || myUserId;
  const isMyProfile = String(targetUserId) === String(myUserId);
  const currentUserRole = localStorage.getItem('role') || 'user';

  const [profile, setProfile] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [savedPostsSet, setSavedPostsSet] = useState(new Set());
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [friendStatus, setFriendStatus] = useState('none'); 

  const [likingPosts, setLikingPosts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [isFetchingComments, setIsFetchingComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState(null);
  const [expandedMap, setExpandedMap] = useState({});

  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  const [zoomedImage, setZoomedImage] = useState(null); 
  const [zoomedImageType, setZoomedImageType] = useState(null); 
  
  const [followModal, setFollowModal] = useState({ open: false, type: '', list: [] });
  const [editBioModal, setEditBioModal] = useState({ open: false, bio: '' });
  
  const [shareModal, setShareModal] = useState({ open: false, postData: null, description: '' });
  const [isSharing, setIsSharing] = useState(false);
  
  // Custom Toast State (Thay cho alert bị lỗi trên iFrame)
  const [notification, setNotification] = useState({ type: '', text: '' });
  const showToast = (text, type = 'success') => { 
    setNotification({ type, text });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };

  // --- CÁC HÀM BỊ MẤT TRƯỚC ĐÓ ĐÃ ĐƯỢC KHÔI PHỤC ---
  const handleSettingsClick = () => navigate('/settings');
  const handlePostClick = (postId) => navigate(`/post-detail?postId=${postId}`);
  // -------------------------------------------------

  const applyThemeToDOM = (selectedTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');

    if (selectedTheme === 'dark') { root.classList.add('dark'); root.style.colorScheme = 'dark'; } 
    else if (selectedTheme === 'light') { root.classList.add('light'); root.style.colorScheme = 'light'; } 
    else { const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; if (systemPrefersDark) { root.classList.add('dark'); root.style.colorScheme = 'dark'; } else { root.classList.add('light'); root.style.colorScheme = 'light'; } }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light'; applyThemeToDOM(savedTheme);
    const handleThemeChange = (e) => { if (e.detail && e.detail.theme) applyThemeToDOM(e.detail.theme); };
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  useEffect(() => {
    const handleCloseAll = () => setOpenPostMenuId(null);
    document.addEventListener('mousedown', (e) => { if (!e.target.closest('.post-menu-container')) handleCloseAll(); });
    return () => document.removeEventListener('mousedown', handleCloseAll);
  }, []);

  const openImageZoom = (url, type) => { setZoomedImage(url); setZoomedImageType(type); };
  const closeImageZoom = () => { setZoomedImage(null); setZoomedImageType(null); };

  const handleUpdateBio = async () => {
    const token = localStorage.getItem('token'); if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/update-profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ bio: editBioModal.bio })
      });
      if (res.ok) { 
        setProfile(prev => ({ ...prev, bio: editBioModal.bio })); 
        setEditBioModal({ open: false, bio: '' }); 
        showToast('Cập nhật tiểu sử thành công!');
      }
    } catch (error) { console.error(error); }
  };

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !myUserId) { setError('Vui lòng đăng nhập để xem trang cá nhân'); setIsLoading(false); return; }
      
      const res = await fetch(`http://localhost:5000/api/users/${targetUserId}/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setError('Không tải được thông tin cá nhân'); setIsLoading(false); return; }
      
      const data = await res.json();
      setProfile(data.user || {});
      setUserPosts(Array.isArray(data.posts) ? data.posts.filter(Boolean) : []);
      setFriendStatus(data.user?.friendStatus || 'none');

      const savedRes = await fetch('http://localhost:5000/api/users/saved-posts', { headers: { Authorization: `Bearer ${token}` } });
      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setSavedPostsSet(new Set(savedData.filter(Boolean).map(p => p._id)));
      }
    } catch (err) { setError('Lỗi hệ thống khi load profile'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadProfile(); }, [targetUserId]);

  useEffect(() => {
    const fetchTrendingAndUsers = async () => {
      setIsLoadingTrending(true);
      try {
        const token = localStorage.getItem('token');
        const trendingRes = await fetch('http://localhost:5000/api/posts/trending').catch(() => null);
        if (trendingRes && trendingRes.ok) {
          const trendingData = await trendingRes.json(); setTrendingKeywords(Array.isArray(trendingData) ? trendingData.filter(Boolean) : []);
        }
        if (token) {
          const usersRes = await fetch('http://localhost:5000/api/users/search', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
          if (usersRes && usersRes.ok) {
            const usersData = await usersRes.json(); setSuggestedUsers(Array.isArray(usersData) ? usersData.filter(Boolean).slice(0, 5) : []);
          }
        }
      } catch (err) {} 
      finally { setIsLoadingTrending(false); }
    };
    fetchTrendingAndUsers();
  }, []);

  const handleFriendAction = async (action) => {
    const token = localStorage.getItem('token'); if (!token) return;
    try {
      let url = ''; let method = 'POST';
      if (action === 'request' || action === 'undo') url = `http://localhost:5000/api/users/friend-request/${targetUserId}`;
      else if (action === 'accept') url = `http://localhost:5000/api/users/accept-friend/${targetUserId}`;
      else if (action === 'unfriend') { url = `http://localhost:5000/api/users/unfriend/${targetUserId}`; method = 'DELETE'; }

      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) loadProfile(); 
    } catch (error) {}
  };

  const fetchCollections = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/users/saved-posts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setCollections(Array.isArray(data) ? data.filter(Boolean) : []); }
    } catch (err) {}
  };

  // --- CÁC HÀM XỬ LÝ BÀI VIẾT (LIKE, COMMENT, SHARE, COPY) ---
  const handleLikePost = async (targetPostId, e) => {
    if (e) e.stopPropagation(); const token = localStorage.getItem('token');
    if (!token) return showToast('Vui lòng đăng nhập để thả tim bài viết.', 'error');
    setLikingPosts(prev => ({ ...prev, [targetPostId]: true }));
    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${targetPostId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Không thể thả tim bài viết');
      const data = await res.json();
      
      const updatePostInArray = (arr) => arr.map(post => {
        if (!post) return null;
        let updatedPost = { ...post };
        if (updatedPost._id === targetPostId) {
          const existingLikes = Array.isArray(updatedPost.likes) ? [...updatedPost.likes] : [];
          const userLiked = existingLikes.some((userId) => userId?.toString() === myUserId);
          updatedPost.likes = data.liked ? (userLiked ? existingLikes : [...existingLikes, myUserId]) : existingLikes.filter((userId) => userId?.toString() !== myUserId);
        }
        if (updatedPost.sharedFrom && typeof updatedPost.sharedFrom === 'object' && updatedPost.sharedFrom._id === targetPostId) {
          const innerLikes = Array.isArray(updatedPost.sharedFrom.likes) ? [...updatedPost.sharedFrom.likes] : [];
          const innerUserLiked = innerLikes.some((userId) => userId?.toString() === myUserId);
          updatedPost.sharedFrom = {
            ...updatedPost.sharedFrom,
            likes: data.liked ? (innerUserLiked ? innerLikes : [...innerLikes, myUserId]) : innerLikes.filter((userId) => userId?.toString() !== myUserId)
          };
        }
        return updatedPost;
      });

      if (activeTab === 'posts') setUserPosts(updatePostInArray(userPosts).filter(Boolean));
      else if (activeTab === 'collections') setCollections(updatePostInArray(collections).filter(Boolean));
    } catch (error) { showToast(error.message, 'error'); } 
    finally { setLikingPosts(prev => ({ ...prev, [targetPostId]: false })); }
  };

  const toggleComments = async (postId, e) => {
    if (e) e.stopPropagation(); 
    const isExpanded = expandedComments[postId]; setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));
    if (!isExpanded && !commentsData[postId]) {
      setIsFetchingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`);
        if (res.ok) { const data = await res.json(); setCommentsData(prev => ({ ...prev, [postId]: Array.isArray(data.comments) ? data.comments : [] })); }
      } catch (error) {} finally { setIsFetchingComments(prev => ({ ...prev, [postId]: false })); }
    }
  };

  const handlePostComment = async (postId, e) => {
    if (e) e.stopPropagation(); const token = localStorage.getItem('token');
    if (!token) return showToast('Vui lòng đăng nhập để bình luận.', 'error');
    let text = commentInputs[postId]; if (!text || !text.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        const commentRes = await fetch(`http://localhost:5000/api/posts/${postId}/comments`);
        const commentData = await commentRes.json();
        setCommentsData(prev => ({ ...prev, [postId]: Array.isArray(commentData.comments) ? commentData.comments : [] }));
      }
    } catch (error) {} finally { setIsSubmittingComment(false); }
  };

  const handleCopyPostLink = async (postId, e) => {
    if(e) e.stopPropagation(); try { await navigator.clipboard.writeText(`${window.location.origin}/post-detail?postId=${postId}`); showToast('Đã copy link bài viết.'); } catch (error) {} setOpenPostMenuId(null);
  };

  const handleDeletePost = async (postId, e) => {
    if(e) e.stopPropagation(); const token = localStorage.getItem('token'); if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        showToast('Đã xóa bài viết.');
        if (activeTab === 'posts') setUserPosts(prev => prev.filter(p => p._id !== postId));
        else if (activeTab === 'collections') setCollections(prev => prev.filter(p => p._id !== postId));
      }
    } catch (error) {} finally { setOpenPostMenuId(null); }
  };

  const handleConfirmShare = async () => {
    if (!shareModal.postData) return; const token = localStorage.getItem('token');
    if (!token) return showToast('Vui lòng đăng nhập để chia sẻ bài viết.', 'error');
    setIsSharing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${shareModal.postData._id}/share`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ description: shareModal.description }) });
      if (res.ok) { showToast('Đã chia sẻ bài viết lên trang cá nhân!'); setShareModal({ open: false, postData: null, description: '' }); loadProfile(); } 
      else throw new Error('Chia sẻ thất bại');
    } catch (error) { showToast(error.message, 'error'); } finally { setIsSharing(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c1322] flex items-center justify-center transition-colors duration-300"><Loader2 size={32} className="animate-spin text-[#f44336]" /></div>;
  if (error) return <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c1322] flex flex-col items-center justify-center transition-colors duration-300"><ShieldAlert size={48} className="text-red-500 mb-4" /><p className="text-gray-800 dark:text-white font-bold text-lg mb-6">{error}</p><button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#f44336] text-white font-bold rounded-full hover:bg-red-600 transition-colors">Về trang chủ</button></div>;

  const displayAvatar = getAvatarUrl(profile.avatar, profile.displayName || profile.username);
  const displayCover = getImageUrl(profile.cover) || 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80';

  const allImages = userPosts.reduce((acc, post) => {
    if (post && Array.isArray(post.images) && post.images.length > 0) post.images.forEach(img => acc.push({ url: getImageUrl(img), postId: post._id }));
    return acc;
  }, []);

  const postsCount = userPosts.length;
  const followersCount = Array.isArray(profile.followers) ? profile.followers.length : 0;
  const followingCount = Array.isArray(profile.following) ? profile.following.length : 0;

  // --- RENDER BÀI VIẾT TỔNG QUÁT ---
  const renderPost = (post) => {
    if (!post || !post.createdBy) return null;
    const isOwner = Boolean(myUserId) && String(post.createdBy?._id) === String(myUserId);
    const isAdmin = currentUserRole === 'admin';
    
    const isShared = Boolean(post.sharedFrom && typeof post.sharedFrom === 'object' && post.sharedFrom._id);
    const originalPost = isShared ? post.sharedFrom : null;

    const targetImages = isShared ? (originalPost?.images || []) : (post.images || []);
    const postImages = Array.isArray(targetImages) ? targetImages.map(getPostImageUrl).filter(Boolean) : [];
    const mainImage = postImages.length > 0 ? postImages[0] : null;

    const targetLat = isShared ? originalPost?.lat : post.lat;
    const targetLng = isShared ? originalPost?.lng : post.lng;
    const targetLocation = isShared ? originalPost?.location : post.location;

    const topLikedByMe = Array.isArray(post.likes) && post.likes.some(u => String(u) === String(myUserId));
    const originalLikedByMe = isShared && Array.isArray(originalPost?.likes) && originalPost.likes.some(u => String(u) === String(myUserId));

    return (
      <div 
        key={post._id}
        onClick={() => handlePostClick(post._id)}
        className="bg-white dark:bg-[#1A2338] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <img 
               src={getAvatarUrl(post.createdBy?.avatar, post.createdBy?.displayName || post.createdBy?.username)} 
               alt="Avatar" 
               className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-slate-700 hover:opacity-80" 
               onClick={(e) => { e.stopPropagation(); navigate('/profile', { state: { targetUserId: post.createdBy?._id } }); }}
            />
            <div>
              <h3 
                className="text-[14px] font-bold text-gray-900 dark:text-white hover:underline"
                onClick={(e) => { e.stopPropagation(); navigate('/profile', { state: { targetUserId: post.createdBy?._id } }); }}
              >
                {post.createdBy?.displayName || post.createdBy?.username}
              </h3>
              <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400">
                {!isShared && post.location && post.location !== 'Chưa xác định' ? `${post.location} • ` : ''} 
                {new Date(post.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          <div className="relative post-menu-container">
            <button type="button" onClick={(e) => { e.stopPropagation(); setOpenPostMenuId((prev) => (prev === post._id ? null : post._id)); }} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white p-1">
              <MoreHorizontal size={20} />
            </button>
            {openPostMenuId === post._id && (
              <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-1">
                <button type="button" onClick={(e) => handleCopyPostLink(post._id, e)} className="w-full flex items-center gap-2 text-left px-3 py-2 text-[12px] font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg">
                  <Copy size={14} /> Copy link bài viết
                </button>
                {(isOwner || isAdmin) && (
                  <button type="button" onClick={(e) => handleDeletePost(post._id, e)} className="w-full flex items-center gap-2 text-left px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg mt-1 border-t border-gray-50 dark:border-slate-700 pt-2">
                    <Trash2 size={14} /> Xóa bài viết
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {post.title && post.title !== `Trải nghiệm của ${post.createdBy?.username}` && (
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-[#f44336] dark:group-hover:text-red-400 transition-colors">{post.title}</h2>
        )}
        
        {post.description && (
          <div className="text-[14px] text-gray-700 dark:text-slate-300 leading-relaxed font-medium mb-4 whitespace-pre-wrap">{post.description}</div>
        )}

        {isShared ? (
          <div className="mt-3 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-[#131B2E]" onClick={e => e.stopPropagation()}>
            <div className="p-4 pb-2 flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 cursor-pointer"
                onClick={() => navigate('/profile', { state: { targetUserId: originalPost.createdBy?._id } })}
              >
                <img src={getAvatarUrl(originalPost?.createdBy?.avatar, originalPost?.createdBy?.displayName || originalPost?.createdBy?.username)} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 
                  className="text-[13px] font-bold text-gray-900 dark:text-white cursor-pointer hover:underline"
                  onClick={() => navigate('/profile', { state: { targetUserId: originalPost?.createdBy?._id } })}
                >
                  {originalPost?.createdBy?.displayName || originalPost?.createdBy?.username || 'Người dùng'}
                </h3>
                <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                  {originalPost?.createdAt ? new Date(originalPost.createdAt).toLocaleDateString('vi-VN') : ''}
                </p>
              </div>
            </div>
            <div className="cursor-pointer" onClick={() => navigate(`/post-detail?postId=${originalPost._id}`)}>
              {originalPost?.description && (
                <div className="px-4 pb-3 text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {originalPost.description}
                </div>
              )}
              {targetLat && targetLng && (
                <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => setExpandedMap(prev => ({ ...prev, [post._id]: !prev[post._id] }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400 border-transparent hover:bg-red-100 dark:hover:bg-red-950/20'}`}>
                    <MapPin size={14} /> 
                    {typeof targetLocation === 'string' && targetLocation !== 'Chưa xác định' ? targetLocation : "Vị trí được ghim"}
                  </button>
                  {expandedMap[post._id] && (
                    <div className="mt-2 h-[200px] w-full border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
                      <RealMapViewer lat={targetLat} lng={targetLng} location={targetLocation} />
                    </div>
                  )}
                </div>
              )}
              {mainImage && (
                  <img src={mainImage} alt="media" className="w-full object-cover border-t border-gray-100 dark:border-slate-750 max-h-[350px]" />
              )}
            </div>
            <div className="px-4 py-3 flex items-center gap-6 bg-white dark:bg-[#1A2338] border-t border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={(e) => handleLikePost(originalPost._id, e)} className={`flex items-center gap-1.5 ${originalLikedByMe ? 'text-[#f44336]' : 'text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400'} transition-colors text-[12px] font-bold`}>
                <Heart size={16} strokeWidth={2.5} fill={originalLikedByMe ? '#f44336' : 'none'} /> 
                {Array.isArray(originalPost?.likes) ? originalPost.likes.length : 0} Thích
              </button>
              <button type="button" onClick={() => navigate(`/post-detail?postId=${originalPost._id}`)} className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400 transition-colors text-[12px] font-bold">
                <MessageSquare size={16} strokeWidth={2.5} /> Xem bình luận
              </button>
            </div>
          </div>
        ) : (
          <>
            {targetLat && targetLng && (
              <div className="mb-4" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => setExpandedMap(prev => ({ ...prev, [post._id]: !prev[post._id] }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold transition-all border ${expandedMap[post._id] ? 'bg-[#f44336] text-white border-[#f44336] shadow-md shadow-red-500/20' : 'bg-red-50 dark:bg-red-950/40 text-[#f44336] dark:text-red-400 border-transparent hover:bg-red-100 dark:hover:bg-red-950/20'}`}>
                  <MapPin size={16} /> 
                  {typeof targetLocation === 'string' && targetLocation !== 'Chưa xác định' ? targetLocation : "Vị trí được ghim"}
                  <span className={`text-[10px] px-2 py-0.5 rounded-md ml-2 transition-colors ${expandedMap[post._id] ? 'bg-black/20 text-white' : 'bg-white dark:bg-slate-800 text-[#f44336] dark:text-red-400 shadow-sm'}`}>
                    {expandedMap[post._id] ? "Đóng Bản đồ" : "📍 Xem Map"}
                  </span>
                </button>
                {expandedMap[post._id] && (
                  <div className="mt-3 h-[250px] w-full border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden relative z-0 animate-in slide-in-from-top-2 duration-200">
                    <RealMapViewer lat={targetLat} lng={targetLng} location={targetLocation} />
                  </div>
                )}
              </div>
            )}
            {mainImage && (
              <div className="w-full rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
                <img src={mainImage} className="w-full object-cover max-h-[420px]" />
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-6 pt-3 border-t border-gray-50 dark:border-slate-700 mt-4" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={(e) => handleLikePost(post._id, e)} disabled={likingPosts[post._id]} className={`flex items-center gap-1.5 ${topLikedByMe ? 'text-[#f44336]' : 'text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400'} transition-colors text-[13px] font-bold disabled:opacity-50`}>
            <Heart size={20} strokeWidth={2.5} fill={topLikedByMe ? '#f44336' : 'none'} /> 
            {Array.isArray(post.likes) ? post.likes.length : 0}
          </button>
          
          <button type="button" onClick={(e) => toggleComments(post._id, e)} className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400 transition-colors text-[13px] font-bold">
            <MessageSquare size={20} strokeWidth={2.5} /> {post.totalReviews || "Bình luận"}
          </button>
          
          <button type="button" onClick={(e) => { e.stopPropagation(); setShareModal({ open: true, postData: post, description: '' }); }} className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400 transition-colors text-[13px] font-bold">
            <Share2 size={20} strokeWidth={2.5} />
          </button>

          <div className="ml-auto">
            <SavePostButton postId={post._id} initialIsSaved={savedPostsSet.has(post._id)} />
          </div>
        </div>

        {expandedComments[post._id] && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 animate-in fade-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 flex-shrink-0 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(myUserId)}>
                <img src={getAvatarUrl(profile.avatar, profile.displayName || profile.username)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Viết bình luận..."
                  className="w-full bg-[#f4f4f5] dark:bg-slate-800 dark:text-white rounded-full py-2 pl-4 pr-10 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 dark:focus:ring-red-500/20 transition-all border border-transparent dark:border-slate-700"
                  value={commentInputs[post._id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({...prev, [post._id]: e.target.value}))}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post._id, e)}
                />
                <button onClick={(e) => handlePostComment(post._id, e)} disabled={isSubmittingComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f44336] p-1.5 hover:bg-red-50 dark:bg-red-950/20 rounded-full transition-colors disabled:opacity-50">
                  <Send size={16} />
                </button>
              </div>
            </div>
            
            {isFetchingComments[post._id] ? (
              <div className="flex justify-center py-4"><Loader2 size={24} className="animate-spin text-[#f44336]" /></div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(commentsData[post._id]) && commentsData[post._id].map(comment => (
                  <div key={comment._id} className="flex gap-3 text-[13px]">
                    <img src={getAvatarUrl(comment.author?.avatar, comment.author?.username)} alt="avt" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100 dark:border-slate-700 cursor-pointer hover:opacity-80" onClick={() => handleNavigateProfile(comment.author?._id)} />
                    <div className="flex-1">
                      <div className="bg-[#f4f4f5] dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-none inline-block border border-transparent dark:border-slate-700">
                        <p onClick={() => handleNavigateProfile(comment.author?._id)} className="font-bold text-gray-900 dark:text-white mb-0.5 text-[12px] cursor-pointer hover:underline">{comment.author?.displayName || comment.author?.username}</p>
                        <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mt-1 ml-2">
                        {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c1322] font-sans text-gray-900 dark:text-gray-100 pb-12 relative transition-colors duration-300">
      
      {/* KHU VỰC THÔNG BÁO (TOAST) */}
      {notification.text && (
        <div className={`fixed bottom-6 right-6 z-[400] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${notification.type === 'error' ? 'bg-white dark:bg-slate-800 border-[#f44336] text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-slate-800 border-green-500 text-gray-800 dark:text-gray-200'}`}>
          {notification.type === 'error' ? <ShieldAlert size={24} className="text-[#f44336]" /> : <CheckCircle size={24} className="text-green-500" />}
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{notification.text}</p>
          <button onClick={() => setNotification({ type: '', text: '' })} className="ml-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={18} /></button>
        </div>
      )}
      
      {/* Các Modal Khác Giữ Nguyên Giao Diện Của Dark Mode */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="absolute top-6 right-6 flex gap-4">
            {isMyProfile && (
              <button 
                onClick={() => { closeImageZoom(); navigate('/settings'); }} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-[13px] flex items-center gap-2 transition-colors"
              >
                <Camera size={16} /> Thay đổi {zoomedImageType === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa'}
              </button>
            )}
            <button onClick={closeImageZoom} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="max-w-[90vw] max-h-[85vh] relative">
            <img 
              src={zoomedImage} 
              alt="Zoomed Profile Media" 
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80'; }}
              className={`${zoomedImageType === 'avatar' ? 'rounded-full w-[300px] h-[300px] md:w-[400px] md:h-[400px] object-cover' : 'rounded-xl max-w-full max-h-[80vh] object-contain'} shadow-2xl`}
            />
          </div>
        </div>
      )}

      {followModal.open && (
        <div className="fixed inset-0 z-[300] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A2338] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-transparent dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-lg text-gray-900 dark:text-white">{followModal.type}</h3>
              <button onClick={() => setFollowModal({ open: false, type: '', list: [] })} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {followModal.list.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-slate-400 text-sm font-bold">
                  Chưa có ai trong danh sách này.
                </div>
              ) : (
                followModal.list.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getAvatarUrl(u.avatar, u.displayName || u.username)} 
                        alt="avt" 
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || 'User')}&background=f44336&color=fff`; }}
                        className="w-11 h-11 rounded-full object-cover border border-gray-100 dark:border-slate-700" 
                      />
                      <div>
                        <p className="font-extrabold text-[14px] text-gray-900 dark:text-white leading-tight">{u.displayName || u.username}</p>
                        <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500">@{u.username?.toLowerCase().replace(/\s+/g, '_')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setFollowModal({ open: false, type: '', list: [] }); navigate('/profile', { state: { targetUserId: u._id } }); }}
                      className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl font-bold text-[12px] hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Xem trang
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {editBioModal.open && (
        <div className="fixed inset-0 z-[300] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A2338] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-transparent dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-black text-lg text-gray-900 dark:text-white">Chỉnh sửa tiểu sử</h3>
              <button onClick={() => setEditBioModal({ open: false, bio: '' })} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={editBioModal.bio}
                onChange={e => setEditBioModal({ ...editBioModal, bio: e.target.value })}
                placeholder="Viết một chút về bản thân bạn..."
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 dark:focus:ring-red-500/20 focus:border-[#f44336] dark:focus:border-red-500 resize-none h-32 transition-all"
              />
              <button onClick={handleUpdateBio} className="w-full mt-4 bg-[#f44336] hover:bg-red-600 text-white font-bold text-[15px] py-3 rounded-xl transition-colors shadow-md shadow-red-500/20">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chia Sẻ */}
      {shareModal.open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 py-6 animate-in fade-in duration-200" onClick={() => setShareModal({ open: false, postData: null, description: '' })}>
          <div className="w-full max-w-md bg-white dark:bg-[#1A2338] rounded-3xl p-6 shadow-2xl border border-transparent dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Share2 size={20} className="text-[#f44336]" /> Chia sẻ bài viết
              </h3>
              <button onClick={() => setShareModal({ open: false, postData: null, description: '' })} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={shareModal.description}
              onChange={e => setShareModal({ ...shareModal, description: e.target.value })}
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
                Chia sẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER TƯƠNG ĐỒNG KHẮP APP */}
      <header className="flex items-center justify-between py-3 px-6 bg-white dark:bg-[#131B2E] sticky top-0 z-50 border-b border-gray-100 dark:border-slate-800 h-[72px] transition-colors duration-300">
        <div className="w-1/4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-[#f44336] dark:text-red-500 font-extrabold text-xl tracking-tight hidden sm:block">The Wanderer</button>
        </div>

        <nav className="flex-1 flex justify-center items-center gap-10 text-[15px] font-bold text-gray-500 dark:text-slate-400">
          <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">{t.home}</button>
          <button onClick={() => navigate('/explore')} className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">{t.explore}</button>
          <button onClick={() => navigate('/community')} className="hover:text-gray-900 dark:hover:text-white transition-colors h-[72px] flex items-center">Cộng đồng</button>
        </nav>

        <div className="w-1/4 flex items-center justify-end gap-5">
          <NotificationBell />
          <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <MessageSquare size={22} strokeWidth={2} />
          </button>
          <AccountMenu avatar={profile.avatar} username={profile.username} />
        </div>
      </header>

      <main className="max-w-[1360px] mx-auto px-6 2xl:px-8 pt-6 flex gap-6 lg:gap-8 items-start">
        
        {/* CENTER CONTENT */}
        <section className="flex-1 min-w-0">
          <div className="bg-white dark:bg-[#1A2338] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 mb-6 transition-colors duration-300">
            <div 
              className="h-[220px] w-full bg-gray-200 dark:bg-slate-700 relative cursor-pointer group"
              onClick={() => openImageZoom(displayCover, 'cover')}
            >
              <img 
                src={displayCover} 
                alt={t.coverAlt} 
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80'; }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white drop-shadow-md" size={32} />
              </div>
            </div>

            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end mb-4">
                <div className="relative -mt-16 z-10 group cursor-pointer" onClick={() => openImageZoom(displayAvatar, 'avatar')}>
                  <img
                    src={displayAvatar}
                    alt="Avatar"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username || 'User')}&background=f44336&color=fff&size=200`; }}
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-[#1A2338] object-cover bg-white dark:bg-slate-800 shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 border-4 border-transparent rounded-full flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="text-white drop-shadow-md" size={24} />
                  </div>
                </div>
                
                {isMyProfile ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditBioModal({ open: true, bio: profile.bio || '' })} className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20">
                      <Edit3 size={16} /> {t.editProfile}
                    </button>
                    <button onClick={handleSettingsClick} className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors inline-block">
                      <Settings size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {friendStatus === 'friends' && (
                      <>
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('openChat', { detail: { userId: targetUserId, username: profile.username } }))} 
                          className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20"
                        >
                          <MessageSquare size={16} /> Nhắn tin
                        </button>
                        <button 
                          onClick={() => handleFriendAction('unfriend')}
                          className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                        >
                          <UserMinus size={16} /> Hủy kết bạn
                        </button>
                      </>
                    )}
                    {friendStatus === 'pending' && (
                      <button 
                        onClick={() => handleFriendAction('undo')}
                        className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Clock size={16} /> Đã gửi yêu cầu (Hủy)
                      </button>
                    )}
                    {friendStatus === 'none' && (
                      <button 
                        onClick={() => handleFriendAction('request')}
                        className="bg-[#f44336] text-white text-[13px] font-bold px-5 py-2 rounded-lg hover:bg-[#e53935] transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/20"
                      >
                        <UserPlus size={16} /> Thêm bạn bè
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">{profile.displayName || profile.username || t.traveler}</h1>
                <p className="text-[13px] font-medium text-gray-500 dark:text-slate-400 mb-4">@{(profile.username || 'unknown').toLowerCase().replace(/\s+/g, '_')}</p>
                <p className="text-[14px] text-gray-700 dark:text-slate-300 leading-relaxed font-medium mb-6 whitespace-pre-wrap">
                  {profile.bio || (isMyProfile ? 'Bạn chưa cập nhật thông tin giới thiệu (Bio). Hãy nhấn Edit Profile để chia sẻ nhiều hơn nhé!' : 'Người dùng này chưa có thông tin giới thiệu.')}
                </p>

                <div className="flex gap-4 border-t border-gray-100 dark:border-slate-800 pt-6">
                  <div className="flex-1 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 rounded-2xl p-4 text-center transition-colors cursor-default border border-gray-100/50 dark:border-slate-700">
                    <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">{postsCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest uppercase">{t.posts}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 rounded-2xl p-4 text-center transition-colors cursor-pointer border border-gray-100/50 dark:border-slate-700 shadow-sm" onClick={() => setFollowModal({ open: true, type: 'Người theo dõi', list: profile.followers || [] })}>
                    <p className="text-2xl font-black text-[#f44336] dark:text-red-500 mb-1">{followersCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest uppercase">{t.followers}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 rounded-2xl p-4 text-center transition-colors cursor-pointer border border-gray-100/50 dark:border-slate-700 shadow-sm" onClick={() => setFollowModal({ open: true, type: 'Đang theo dõi', list: profile.following || [] })}>
                    <p className="text-2xl font-black text-[#f44336] dark:text-red-500 mb-1">{followingCount}</p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest uppercase">{t.following}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A2338] rounded-xl p-2 flex text-center text-[13px] font-bold text-gray-500 dark:text-slate-400 mb-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <button onClick={() => setActiveTab('posts')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'posts' ? 'text-[#f44336] dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>{t.posts}</button>
            <button onClick={() => setActiveTab('media')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'media' ? 'text-[#f44336] dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>{t.media}</button>
            
            {isMyProfile && (
              <button onClick={() => { setActiveTab('collections'); fetchCollections(); }} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'collections' ? 'text-[#f44336] dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                🗂️ {t.saved}
              </button>
            )}

            <button onClick={() => setActiveTab('about')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'about' ? 'text-[#f44336] dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>{t.about}</button>
            <button onClick={() => setActiveTab('map')} className={`flex-1 py-2 rounded-lg transition-colors ${activeTab === 'map' ? 'text-[#f44336] dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>{t.map}</button>
          </div>

          <div className="pb-12">
            {activeTab === 'map' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white dark:bg-[#1A2338] p-4 rounded-t-2xl border border-gray-100 dark:border-slate-800 border-b-0 shadow-sm flex items-center gap-3">
                  <MapPin className="text-[#f44336] dark:text-red-400" size={20} />
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">Bản đồ dấu chân</h3>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Các địa điểm đã đăng bài check-in.</p>
                  </div>
                </div>
                <ProfileMap posts={userPosts} username={profile.username} />
              </div>
            )}

            {activeTab === 'media' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {allImages.length === 0 ? (
                  <div className="bg-white dark:bg-[#1A2338] rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center text-gray-400 dark:text-slate-500 gap-3">
                    <ImageIcon size={44} className="opacity-40" />
                    <p className="text-[14px] font-bold">Chưa có hình ảnh nào.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {allImages.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 dark:bg-slate-800 cursor-pointer overflow-hidden rounded-2xl relative group shadow-sm border border-gray-100 dark:border-slate-800" onClick={() => openImageZoom(img.url, 'post')}>
                        <img 
                           src={img.url} 
                           onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1502602898657-3e90760b628e?auto=format&fit=crop&w=1000&q=80'; }}
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                           alt="" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={28} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB BÀI VIẾT HOẶC ĐÃ LƯU: ĐÃ LỌC NULL AN TOÀN TRÁNH TRẮNG MÀN HÌNH */}
            {(activeTab === 'posts' || activeTab === 'collections') && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {(activeTab === 'posts' ? userPosts : collections).length === 0 ? (
                  <div className="bg-white dark:bg-[#1A2338] rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <ImageIcon size={44} className="opacity-40 text-gray-400 mb-3" />
                    <h3 className="text-[15px] font-black text-gray-900 dark:text-white">Chưa có bài viết nào</h3>
                  </div>
                ) : (
                  (activeTab === 'posts' ? userPosts : collections).filter(Boolean).map(post => renderPost(post))
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white dark:bg-[#1A2338] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">{t.about}</h3>
                <p className="text-[14px] leading-relaxed">{profile.bio || 'Bạn chưa cập nhật phần giới thiệu.'}</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR - XU HƯỚNG VÀ GỢI Ý KẾT BẠN */}
        <aside className="w-[340px] hidden xl:block flex-shrink-0 space-y-6 sticky top-[104px]">
          <div className="bg-white dark:bg-[#1A2338] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <h3 className="text-[11px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">🔥 {t.trendingKeywords}</h3>
            {isLoadingTrending ? (
              <p className="text-[13px] text-gray-500 dark:text-slate-400">Đang tải...</p>
            ) : trendingKeywords.length > 0 ? (
              <div className="space-y-4">
                {trendingKeywords.map((item, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] font-bold text-[#f44336] dark:text-red-400 uppercase tracking-wider mb-0.5">{item.category || 'Khám phá'}</p>
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight cursor-pointer hover:underline" onClick={() => navigate(`/post-detail?postId=${item._id}`)}>
                      {item.title || item.location}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 flex items-center gap-1"><Heart size={10}/> {item.likeCount} lượt thích</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 dark:text-slate-500">Chưa có dữ liệu</p>
            )}
          </div>

          <div className="bg-white dark:bg-[#1A2338] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <h3 className="text-[11px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">👥 {t.suggestedForYou}</h3>
            {suggestedUsers.length > 0 ? (
              <div className="space-y-4 mb-4">
                {suggestedUsers.filter(Boolean).map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src={getAvatarUrl(user.avatar, user.displayName || user.username)} 
                        alt={user.username} 
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username || 'User')}&background=f44336&color=fff`; }}
                        className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-slate-700 cursor-pointer" 
                        onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}
                      />
                      <div>
                        <p className="text-[12px] font-bold text-gray-900 dark:text-white cursor-pointer hover:underline" onClick={() => navigate('/profile', { state: { targetUserId: user._id } })}>{user.displayName || user.username}</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400">{(user.followers || []).length} {t.followers}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/profile', { state: { targetUserId: user._id } })} className="text-[12px] font-bold text-[#f44336] dark:text-red-400 hover:underline">{t.follow}</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 dark:text-slate-500">Chưa có dữ liệu</p>
            )}
          </div>
        </aside>

      </main>
    </div>
  );
}

export default function Profile() {
  const hasRouter = typeof useInRouterContext === 'function' ? useInRouterContext() : false;
  if (!hasRouter) return <BrowserRouter><ProfileContent /></BrowserRouter>;
  return <ProfileContent />;
}