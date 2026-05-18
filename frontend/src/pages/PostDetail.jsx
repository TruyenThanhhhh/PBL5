import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Home, Compass, Bookmark, MapPin, Star,
  MessageSquare, ArrowUp, ArrowDown, Loader2, User, Send, Heart, Share2, Bell, X, CheckCircle, ShieldAlert
} from 'lucide-react';
import { io } from 'socket.io-client';
import AccountMenu from '../components/AccountMenu';
import NotificationBell from '../components/NotificationBell';
import SavePostButton from '../components/SavePostButton';


// --- TIỆN ÍCH XỬ LÝ ẢNH ---
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
};

const getAvatarUrl = (url, name) => {
  const finalUrl = getImageUrl(url);
  return finalUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f44336&color=fff&size=200`;
};

// --- LOGIC BẢN ĐỒ LEAFLET ---
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
        <div className="absolute inset-0 bg-gray-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-[12px] font-bold text-gray-500 dark:text-slate-400">
          Đang tải bản đồ...
        </div>
      )}
    </div>
  );
}

// --- COMPONENT CHÍNH ---
export default function PostDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('postId');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mới: State Modal chia sẻ
  const [shareModal, setShareModal] = useState({ open: false, description: '' });
  const [isSharing, setIsSharing] = useState(false);
  
  // Custom Toast State
  const [notification, setNotification] = useState({ type: '', text: '' });
  const showToast = (text, type = 'success') => { 
    setNotification({ type, text });
    setTimeout(() => setNotification({ type: '', text: '' }), 5000);
  };
  
  const currentUser = { 
    userId: localStorage.getItem('userId'),
    avatar: localStorage.getItem('avatar'),
    username: localStorage.getItem('displayName') || localStorage.getItem('username')
  };

  // --- QUY TRÌNH ÁP DỤNG THEME TOÀN CỤC ---
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
    if (!postId) {
      setError('Không tìm thấy mã bài viết.');
      setLoading(false);
      return;
    }

    const fetchPostAndComments = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let postData = null;

        const postRes = await fetch(`http://localhost:5000/api/posts/${postId}`, { headers });
        
        if (!postRes.ok) {
          const allPostsRes = await fetch(`http://localhost:5000/api/posts`, { headers });
          if (!allPostsRes.ok) throw new Error('Bài viết không tồn tại hoặc đã bị xóa.');
          
          const allPostsData = await allPostsRes.json();
          const postsArray = Array.isArray(allPostsData) ? allPostsData : (allPostsData.posts || []);
          
          const foundPost = postsArray.find(p => String(p._id) === String(postId));
          if (!foundPost) throw new Error('Bài viết không tồn tại hoặc đã bị xóa.');
          postData = foundPost;
        } else {
          const resData = await postRes.json();
          postData = resData.post || resData;
        }

        setPost(postData);

        if (token) {
          const savedRes = await fetch('http://localhost:5000/api/users/saved-posts', { headers });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            setIsSaved(savedData.some(p => String(p._id) === String(postId)));
          }
        }

        const commentRes = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, { headers });
        if (commentRes.ok) {
          const commentData = await commentRes.json();
          setComments(Array.isArray(commentData.comments) ? commentData.comments : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleLikePost = async () => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('Vui lòng đăng nhập để thả tim bài viết.', 'error');

    setIsLiking(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/like/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPost(prev => {
          const existingLikes = Array.isArray(prev.likes) ? [...prev.likes] : [];
          const userLiked = existingLikes.includes(currentUser.userId);
          const updatedLikes = data.liked 
            ? (userLiked ? existingLikes : [...existingLikes, currentUser.userId])
            : existingLikes.filter(id => id !== currentUser.userId);
          return { ...prev, likes: updatedLikes };
        });
      }
    } catch (error) {
      showToast('Lỗi khi thả tim', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handlePostComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('Vui lòng đăng nhập để bình luận.', 'error');
    if (!commentInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentInput })
      });

      if (res.ok) {
        setCommentInput('');
        const commentRes = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const commentData = await commentRes.json();
        setComments(Array.isArray(commentData.comments) ? commentData.comments : []);
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPostLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Đã copy link bài viết thành công!');
    } catch (error) {}
  };

  const handleConfirmShare = async () => {
    const token = localStorage.getItem('token');
    if (!token) return showToast('Vui lòng đăng nhập để chia sẻ bài viết.', 'error');
    
    setIsSharing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: shareModal.description })
      });

      if (res.ok) {
        showToast('Đã chia sẻ bài viết lên trang cá nhân của bạn!');
        setShareModal({ open: false, description: '' });
      } else {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.message || 'Chia sẻ thất bại');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] dark:bg-[#0c1322] transition-colors duration-300"><Loader2 className="animate-spin text-[#f44336]" size={40} /></div>;
  if (error || !post) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] dark:bg-[#0c1322] transition-colors duration-300"><h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{error || 'Không thể tải bài viết.'}</h2><button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#f44336] text-white rounded-full font-bold shadow-md hover:bg-red-600 transition-colors">Về trang chủ</button></div>;

  // LOGIC NHẬN DIỆN BÀI SHARE
  const isShared = Boolean(post.sharedFrom && typeof post.sharedFrom === 'object');
  const originalPost = isShared ? post.sharedFrom : null;

  const targetImages = isShared ? (originalPost?.images || []) : (post.images || []);
  const postImages = Array.isArray(targetImages) ? targetImages.map(getImageUrl).filter(Boolean) : [];
  const mainImage = postImages.length > 0 ? postImages[0] : null;

  const authorName = post.createdBy?.displayName || post.createdBy?.username || 'Người dùng';
  const authorAvatar = getAvatarUrl(post.createdBy?.avatar, authorName);
  const likedByCurrentUser = Array.isArray(post.likes) && post.likes.includes(currentUser.userId);

  const targetLat = isShared ? originalPost?.lat : post.lat;
  const targetLng = isShared ? originalPost?.lng : post.lng;
  const targetLocation = isShared ? originalPost?.location : post.location;

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#0c1322] font-sans text-gray-900 dark:text-gray-100 pb-16 transition-colors duration-300 relative">
      
      {/* KHU VỰC THÔNG BÁO (TOAST) */}
      {notification.text && (
        <div className={`fixed bottom-6 right-6 z-[400] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 border-l-4 ${notification.type === 'error' ? 'bg-white dark:bg-slate-800 border-[#f44336] text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-slate-800 border-green-500 text-gray-800 dark:text-gray-200'}`}>
          {notification.type === 'error' ? <ShieldAlert size={24} className="text-[#f44336]" /> : <CheckCircle size={24} className="text-green-500" />}
          <p className="text-[14px] font-bold max-w-[300px] leading-tight">{notification.text}</p>
          <button onClick={() => setNotification({ type: '', text: '' })} className="ml-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={18} /></button>
        </div>
      )}

      {/* Modal Chia Sẻ Tối Ưu */}
      {shareModal.open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 py-6 animate-in fade-in duration-200" onClick={() => setShareModal({ open: false, description: '' })}>
          <div className="w-full max-w-md bg-white dark:bg-[#1A2338] rounded-3xl p-6 shadow-2xl border border-transparent dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Share2 size={20} className="text-[#f44336]" /> Chia sẻ bài viết
              </h3>
              <button onClick={() => setShareModal({ open: false, description: '' })} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 transition-colors">
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
                Bài viết của: {isShared ? (originalPost?.createdBy?.displayName || originalPost?.createdBy?.username) : authorName}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-slate-400 line-clamp-2">
                {isShared ? (originalPost?.description || originalPost?.title) : (post.description || post.title)}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShareModal({ open: false, description: '' })} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-[14px]">
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

      {/* NAVBAR */}
      <header className="flex items-center justify-between py-3 px-6 bg-white dark:bg-[#131B2E] sticky top-0 z-50 border-b border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-8 w-1/4">
          <Link to="/dashboard" className="text-[#f44336] dark:text-red-500 font-extrabold text-xl tracking-tight hidden sm:block">
            The Wanderer
          </Link>
        </div>

        <div className="flex-1 max-w-2xl relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="w-full pl-11 pr-4 py-2.5 bg-[#f4f4f5] dark:bg-slate-800 dark:text-white border border-transparent dark:border-slate-700 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 font-medium placeholder-gray-400 dark:placeholder-slate-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-gray-500 dark:text-slate-400">
            <Link to="/explore" className="hover:text-gray-900 dark:hover:text-white transition-colors">Khám phá</Link>
            <Link to="/community" className="hover:text-gray-900 dark:hover:text-white transition-colors">Cộng đồng</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <MessageSquare size={20} />
            </button>
            <AccountMenu avatar={currentUser.avatar} username={currentUser.username} />
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-[1500px] mx-auto px-6 2xl:px-8 py-6 flex gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-[220px] hidden md:block flex-shrink-0">
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Khám phá</h2>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tâm điểm hành trình</p>
          </div>

          <nav className="space-y-1 text-[13px] font-bold text-gray-500 dark:text-slate-400">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors">
              <Home size={18} strokeWidth={2.5} /> Trang chủ
            </Link>
            <Link to="/explore" className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-[#f44336] dark:text-red-400 rounded-xl mb-2 transition-colors">
              <Compass size={18} strokeWidth={2.5} /> Khám phá
            </Link>
            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
              <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors w-full text-left">
                <Bookmark size={18} strokeWidth={2.5} /> Bài viết đã lưu
              </button>
            </div>
          </nav>
        </aside>

        {/* FEED CONTENT (POST DETAIL) */}
        <section className="flex-1 min-w-0 pt-2">
          
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#b2ebf2] dark:bg-cyan-900/40 text-[#00838f] dark:text-cyan-400 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-cyan-100 dark:border-cyan-800/50">
              {post.category || 'CHUNG'}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-[1.2] tracking-tight mb-4 whitespace-pre-wrap">
            {post.title || `Trải nghiệm của ${authorName}`}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 text-[13px] font-bold text-gray-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 text-gray-800 dark:text-slate-300">
                <MapPin size={16} className="text-[#f44336]" /> {targetLocation && targetLocation !== "Chưa xác định" ? targetLocation : "Vị trí bí mật"}
              </div>
              <span className="text-gray-300 dark:text-slate-600">/</span>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => navigate('/profile', { state: { targetUserId: post.createdBy?._id } })}
              >
                <img src={authorAvatar} className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-slate-700" alt="Author" />
                {authorName}
              </div>
              <span className="text-gray-300 dark:text-slate-600">/</span>
              <span className="text-gray-400 dark:text-slate-500 font-medium">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          {/* Description của bài Share (nếu có) hoặc bài gốc */}
          {post.description && (
            <div className="text-[15px] text-gray-800 dark:text-slate-300 leading-relaxed font-medium space-y-6 mb-8 whitespace-pre-wrap">
              {post.description}
            </div>
          )}

          {/* HIỂN THỊ BÀI LỒNG GHÉP NẾU ĐÂY LÀ BÀI SHARE */}
          {isShared ? (
            <div 
              className="mb-8 border border-gray-200 dark:border-slate-700 rounded-3xl overflow-hidden bg-white dark:bg-[#131B2E] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/post-detail?postId=${originalPost._id}`)}
            >
              <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800">
                <img 
                  src={getAvatarUrl(originalPost?.createdBy?.avatar, originalPost?.createdBy?.displayName || originalPost?.createdBy?.username)} 
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-600 object-cover" 
                  alt="Original Author" 
                />
                <div>
                  <h3 
                    className="font-bold text-[14px] text-gray-900 dark:text-white hover:underline" 
                    onClick={(e) => { e.stopPropagation(); navigate('/profile', { state: { targetUserId: originalPost?.createdBy?._id } })}}
                  >
                    {originalPost?.createdBy?.displayName || originalPost?.createdBy?.username || 'Người dùng'}
                  </h3>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400">
                    {originalPost?.createdAt ? new Date(originalPost.createdAt).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
              </div>
              {originalPost?.description && (
                <div className="px-5 py-4 text-[14px] text-gray-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {originalPost.description}
                </div>
              )}
              {mainImage && (
                <div className="w-full h-[300px] md:h-[450px] bg-gray-100 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800">
                  <img src={mainImage} className="w-full h-full object-contain bg-black/5 dark:bg-black/40" alt="Main" />
                </div>
              )}
              {postImages.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-gray-50 dark:bg-slate-900">
                  {postImages.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                      <img src={img} className="w-full h-full object-cover" alt={`Sub ${idx}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* HIỂN THỊ BÌNH THƯỜNG CHO BÀI VIẾT GỐC */
            <>
              {mainImage && (
                <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-8 shadow-sm border border-gray-100 dark:border-slate-800 bg-gray-100 dark:bg-slate-800">
                  <img 
                    src={mainImage} 
                    alt="Post Main" 
                    className="w-full h-full object-contain bg-black/5 dark:bg-black/40"
                  />
                </div>
              )}
              {postImages.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {postImages.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="h-32 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 bg-gray-100 dark:bg-slate-800">
                       <img src={img} className="w-full h-full object-cover" alt={`Sub img ${idx}`} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ACTION BARS (LIKE, COMMENT, SHARE, SAVE) */}
          <div className="flex items-center gap-6 py-4 border-t border-b border-gray-100 dark:border-slate-800 mb-10">
            <button
              type="button"
              onClick={handleLikePost}
              disabled={isLiking}
              className={`flex items-center gap-1.5 ${likedByCurrentUser ? 'text-[#f44336]' : 'text-gray-500 dark:text-slate-400 hover:text-[#f44336] dark:hover:text-red-400'} transition-colors text-[14px] font-bold disabled:opacity-50`}
            >
              <Heart size={22} strokeWidth={2.5} fill={likedByCurrentUser ? '#f44336' : 'none'} /> 
              {Array.isArray(post.likes) ? post.likes.length : 0} Lượt thích
            </button>
            
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 text-[14px] font-bold">
              <MessageSquare size={22} strokeWidth={2.5} /> {comments.length} Bình luận
            </div>

            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setShareModal({ open: true, description: '' }); }} 
              className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-[#f44336] transition-colors text-[14px] font-bold"
            >
              <Share2 size={22} strokeWidth={2.5} /> Chia sẻ
            </button>

            <div className="ml-auto">
               <SavePostButton postId={post._id} initialIsSaved={isSaved} />
            </div>
          </div>

          {/* Discussion Section */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Bình luận ({comments.length})</h3>
          </div>

          {/* Comment Input */}
          <div className="mb-10">
            <div className="flex gap-4">
              <img src={getAvatarUrl(currentUser.avatar, currentUser.username)} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700" alt="User" />
              <div className="flex-1">
                <textarea 
                  className="w-full bg-[#f4f4f5] dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl p-4 text-[13px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 resize-none h-[100px] transition-colors"
                  placeholder="Chia sẻ cảm nghĩ của bạn về bài viết này..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button onClick={handlePostComment} disabled={isSubmitting} className="bg-[#f44336] text-white text-[13px] font-bold px-6 py-2.5 rounded-full hover:bg-[#e53935] shadow-sm disabled:opacity-50 transition-colors">
                    Gửi bình luận
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-8">
            {comments.length === 0 ? (
               <div className="text-center text-gray-400 dark:text-slate-500 text-[13px] font-bold py-10 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
            ) : (
               comments.map(comment => (
                 <div key={comment._id} className="flex gap-4">
                  <div className="flex flex-col items-center text-gray-400 dark:text-slate-500 w-8">
                    <button className="hover:text-[#f44336]"><ArrowUp size={20} /></button>
                    <span className="text-[12px] font-bold text-gray-700 dark:text-slate-300 my-1">0</span>
                    <button className="hover:text-[#f44336]"><ArrowDown size={20} /></button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 
                        className="text-[13px] font-extrabold text-gray-900 dark:text-white cursor-pointer hover:underline"
                        onClick={() => navigate('/profile', { state: { targetUserId: comment.author?._id } })}
                      >
                        {comment.author?.displayName || comment.author?.username}
                      </h4>
                      {comment.author?._id === post.createdBy?._id && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-[#f44336] dark:text-red-400 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">Tác giả</span>
                      )}
                      <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-[13px] text-gray-700 dark:text-slate-300 font-medium leading-relaxed mb-3 whitespace-pre-wrap bg-[#f4f4f5] dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none inline-block border border-transparent dark:border-slate-700">
                      {comment.content}
                    </p>
                  </div>
                </div>
               ))
            )}
          </div>
        </section>

        {/* RIGHT SIDEBAR - BẢN ĐỒ CHI TIẾT */}
        <aside className="w-[340px] hidden xl:block flex-shrink-0 space-y-6">
          {targetLat && targetLng ? (
            <div className="bg-white dark:bg-[#1A2338] p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 sticky top-[100px] transition-colors">
              <h4 className="text-[14px] font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-[#f44336]" /> Vị trí trên bản đồ
              </h4>
              <div className="h-[250px] w-full rounded-2xl overflow-hidden relative z-0 border border-gray-200 dark:border-slate-700 shadow-inner">
                <RealMapViewer lat={targetLat} lng={targetLng} location={targetLocation} />
              </div>
              <div className="mt-4 flex flex-col gap-1 text-[13px] font-medium text-gray-600 dark:text-slate-400 mb-4 px-1">
                <p>📍 {targetLocation || 'Chưa xác định'}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">Tọa độ: {Number(targetLat).toFixed(4)}, {Number(targetLng).toFixed(4)}</p>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps?q=${targetLat},${targetLng}`, '_blank')}
                className="w-full bg-red-50 dark:bg-red-900/20 text-[#f44336] text-[13px] font-bold py-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
              >
                Mở Google Maps
              </button>
            </div>
          ) : (
            <div className="bg-[#fdf4e6] dark:bg-orange-950/20 h-[220px] rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm border border-orange-100 dark:border-orange-900/30 p-6 text-center transition-colors">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center mb-3 border border-gray-100 dark:border-slate-700">
                <Compass className="w-8 h-8 text-orange-400" />
              </div>
              <h4 className="text-[13px] font-extrabold text-gray-800 dark:text-slate-200">Chưa có vị trí</h4>
              <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">Bài viết này không được ghim trên bản đồ.</p>
            </div>
          )}
        </aside>

      </main>
    </div>
  );
}